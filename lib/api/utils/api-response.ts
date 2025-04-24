import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: { [key: string]: string[] } | { path: string; message: string }[];
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

/**
 * Creates a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  status = 200,
  pagination?: ApiResponse<T>['pagination']
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(pagination && { pagination }),
    },
    { status }
  );
}

/**
 * Creates an error API response
 */
export function createErrorResponse(
  error: string | ZodError | Error,
  status = 500
): NextResponse<ApiResponse<unknown>> {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const fieldErrors = error.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    return NextResponse.json(
      {
        success: false,
        error: 'Validation error',
        errors: fieldErrors,
      },
      { status: 400 }
    );
  }

  // Handle standard errors
  const errorMessage = error instanceof Error ? error.message : error;

  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
    },
    { status }
  );
}

/**
 * Helper for 404 responses
 */
export function createNotFoundResponse(entity = 'Resource'): NextResponse<ApiResponse<unknown>> {
  return createErrorResponse(`${entity} not found`, 404);
}

/**
 * Helper for unauthorized responses
 */
export function createUnauthorizedResponse(): NextResponse<ApiResponse<unknown>> {
  return createErrorResponse('Unauthorized', 401);
}

/**
 * Helper for forbidden responses
 */
export function createForbiddenResponse(
  message = "You don't have permission to perform this action"
): NextResponse<ApiResponse<unknown>> {
  return createErrorResponse(message, 403);
}

/**
 * Response for successful creation
 */
export function createResourceResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return createSuccessResponse(data, 201);
}

/**
 * Response for empty success (e.g., deletion)
 */
export function createEmptySuccessResponse(): NextResponse<ApiResponse<unknown>> {
  return createSuccessResponse({}, 204);
}
