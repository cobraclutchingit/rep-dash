import { ZodError, z } from 'zod';

import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createUnauthorizedResponse,
  createForbiddenResponse,
} from '@/lib/api/utils/api-response';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((body, options) => ({
      body,
      status: options?.status || 200,
      headers: new Map(),
    })),
  },
}));

describe('API Response Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSuccessResponse', () => {
    test('should create a success response with default status', () => {
      const data = { id: '123', name: 'Test' };
      const response = createSuccessResponse(data);

      expect(response.body).toEqual({
        success: true,
        data,
      });
      expect(response.status).toBe(200);
    });

    test('should create a success response with custom status', () => {
      const data = { id: '123', name: 'Test' };
      const response = createSuccessResponse(data, 201);

      expect(response.body).toEqual({
        success: true,
        data,
      });
      expect(response.status).toBe(201);
    });

    test('should include pagination if provided', () => {
      const data = [{ id: '1' }, { id: '2' }];
      const pagination = {
        page: 1,
        pageSize: 10,
        totalCount: 20,
        totalPages: 2,
      };

      const response = createSuccessResponse(data, 200, pagination);

      expect(response.body).toEqual({
        success: true,
        data,
        pagination,
      });
    });
  });

  describe('createErrorResponse', () => {
    test('should create an error response with string error', () => {
      const error = 'Something went wrong';
      const response = createErrorResponse(error, 400);

      expect(response.body).toEqual({
        success: false,
        error,
      });
      expect(response.status).toBe(400);
    });

    test('should create an error response with Error object', () => {
      const error = new Error('Something went wrong');
      const response = createErrorResponse(error, 500);

      expect(response.body).toEqual({
        success: false,
        error: 'Something went wrong',
      });
      expect(response.status).toBe(500);
    });

    test('should handle Zod validation errors', () => {
      const schema = z.object({
        name: z.string().min(3),
        email: z.string().email(),
      });

      const result = schema.safeParse({ name: 'a', email: 'not-an-email' });
      const zodError = result.success ? null : result.error;

      const response = createErrorResponse(zodError as ZodError);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors).toHaveLength(2);
      expect(response.body.errors[0]).toHaveProperty('path');
      expect(response.body.errors[0]).toHaveProperty('message');
    });
  });

  describe('Helper response functions', () => {
    test('createNotFoundResponse should return 404 status', () => {
      const response = createNotFoundResponse('User');

      expect(response.body).toEqual({
        success: false,
        error: 'User not found',
      });
      expect(response.status).toBe(404);
    });

    test('createUnauthorizedResponse should return 401 status', () => {
      const response = createUnauthorizedResponse();

      expect(response.body).toEqual({
        success: false,
        error: 'Unauthorized',
      });
      expect(response.status).toBe(401);
    });

    test('createForbiddenResponse should return 403 status', () => {
      const response = createForbiddenResponse();

      expect(response.body).toEqual({
        success: false,
        error: "You don't have permission to perform this action",
      });
      expect(response.status).toBe(403);
    });

    test('createForbiddenResponse should allow custom message', () => {
      const customMessage = 'Custom forbidden message';
      const response = createForbiddenResponse(customMessage);

      expect(response.body).toEqual({
        success: false,
        error: customMessage,
      });
      expect(response.status).toBe(403);
    });
  });
});
