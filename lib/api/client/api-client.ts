"use client";

import { ApiResponse } from "../utils/api-response";

/**
 * API client configuration
 */
export interface ApiClientConfig {
  baseUrl?: string;
  defaultHeaders?: HeadersInit;
  unauthorizedCallback?: () => void;
}

/**
 * API request options
 */
export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  abortSignal?: AbortSignal;
}

/**
 * Default API client configuration
 */
const defaultConfig: ApiClientConfig = {
  baseUrl: "/api",
  defaultHeaders: {
    "Content-Type": "application/json",
  },
  unauthorizedCallback: () => {
    // Redirect to login page if running in browser
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
  },
};

/**
 * Create a new API client
 */
export function createApiClient(config: ApiClientConfig = {}) {
  const { baseUrl, defaultHeaders, unauthorizedCallback } = {
    ...defaultConfig,
    ...config,
  };

  /**
   * Make an API request
   */
  async function request<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    // Extract params and abortSignal from options
    const { params, abortSignal, ...fetchOptions } = options;

    // Build URL with query parameters
    let url = `${baseUrl}${endpoint}`;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      url = `${url}?${searchParams.toString()}`;
    }

    // Merge headers
    const headers = {
      ...defaultHeaders,
      ...options.headers,
    };

    try {
      // Make the request
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: abortSignal,
      });

      // Handle 401 Unauthorized
      if (response.status === 401 && unauthorizedCallback) {
        unauthorizedCallback();
      }

      // Parse response
      const contentType = response.headers.get("content-type");
      let data: ApiResponse<T>;

      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = {
          success: response.ok,
          data: text as any,
        };
      }

      // Handle API errors
      if (!response.ok) {
        throw new Error(data.error || "An unknown error occurred");
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Unknown error occurred");
    }
  }

  /**
   * HTTP methods
   */
  return {
    get: <T = any>(endpoint: string, options?: ApiRequestOptions) =>
      request<T>(endpoint, { method: "GET", ...options }),
    
    post: <T = any>(endpoint: string, data?: any, options?: ApiRequestOptions) =>
      request<T>(endpoint, {
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      }),
    
    put: <T = any>(endpoint: string, data?: any, options?: ApiRequestOptions) =>
      request<T>(endpoint, {
        method: "PUT",
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      }),
    
    patch: <T = any>(endpoint: string, data?: any, options?: ApiRequestOptions) =>
      request<T>(endpoint, {
        method: "PATCH",
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      }),
    
    delete: <T = any>(endpoint: string, options?: ApiRequestOptions) =>
      request<T>(endpoint, { method: "DELETE", ...options }),
  };
}

/**
 * Default API client instance
 */
export const apiClient = createApiClient();