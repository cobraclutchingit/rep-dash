import type { ApiResponse } from '@/lib/api/utils/api-response';

import { apiClient } from './api-client';

/**
 * Generic API service class that provides CRUD operations
 * and handles errors consistently
 */
export class ApiService<T, CreateDTO = Omit<T, 'id' | 'createdAt' | 'updatedAt'>, UpdateDTO = Partial<CreateDTO>> {
  constructor(
    private readonly baseUrl: string,
    private readonly config: {
      idField?: keyof T & string;
      queryFn?: (data: unknown) => unknown;
    } = {}
  ) {
    this.config = {
      idField: 'id' as keyof T & string,
      ...config,
    };
  }

  /**
   * Get all items
   */
  async getAll(params?: Record<string, unknown>): Promise<ApiResponse<T[]>> {
    try {
      const response = await apiClient.get<ApiResponse<T[]>>(this.baseUrl, { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get item by ID
   */
  async getById(id: string | number): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.get<ApiResponse<T>>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Create new item
   */
  async create(data: CreateDTO): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.post<ApiResponse<T>>(this.baseUrl, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Update item
   */
  async update(id: string | number, data: UpdateDTO): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.patch<ApiResponse<T>>(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Delete item
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Custom query
   */
  async query<R = unknown>(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    data?: unknown,
    params?: Record<string, unknown>
  ): Promise<ApiResponse<R>> {
    try {
      const url = path.startsWith('/') ? path : `${this.baseUrl}/${path}`;
      const config = { params };

      let response;
      switch (method) {
        case 'GET':
          response = await apiClient.get<ApiResponse<R>>(url, config);
          break;
        case 'POST':
          response = await apiClient.post<ApiResponse<R>>(url, data, config);
          break;
        case 'PUT':
          response = await apiClient.put<ApiResponse<R>>(url, data, config);
          break;
        case 'PATCH':
          response = await apiClient.patch<ApiResponse<R>>(url, data, config);
          break;
        case 'DELETE':
          response = await apiClient.delete<ApiResponse<R>>(url, { ...config, data });
          break;
      }

      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown): void {
    if (import.meta.env.DEV) {
      console.error('API Error:', error);
    }
    // Here you could add monitoring & error tracking code
  }
}