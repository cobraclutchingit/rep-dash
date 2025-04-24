/**
 * Custom API error class for handling API-specific errors
 */
export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: unknown;

  constructor(message: string, status = 500, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static notFound(entity = 'Resource', code?: string) {
    return new ApiError(`${entity} not found`, 404, code);
  }

  static badRequest(message = 'Bad request', code?: string, details?: unknown) {
    return new ApiError(message, 400, code, details);
  }

  static unauthorized(message = 'Unauthorized', code?: string) {
    return new ApiError(message, 401, code);
  }

  static forbidden(message = 'Forbidden', code?: string) {
    return new ApiError(message, 403, code);
  }

  static internal(message = 'Internal server error', code?: string, details?: unknown) {
    return new ApiError(message, 500, code, details);
  }

  static conflict(message = 'Resource already exists', code?: string) {
    return new ApiError(message, 409, code);
  }

  static validation(details: unknown) {
    return new ApiError('Validation error', 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Error handler for async API routes
 */
export function withErrorHandler<T>(fn: () => Promise<T>): Promise<T> {
  return fn().catch((error) => {
    console.error('API Error:', error);

    // If it's already an ApiError, rethrow it
    if (error instanceof ApiError) {
      throw error;
    }

    // For Prisma errors, create appropriate ApiErrors
    if (error.code) {
      switch (error.code) {
        case 'P2025': // Record not found
          throw ApiError.notFound();
        case 'P2002': // Unique constraint violation
          throw ApiError.conflict('A record with this value already exists');
        default:
          // For other Prisma errors, throw an internal error
          throw ApiError.internal(
            'Database error',
            error.code,
            process.env.NODE_ENV === 'development' ? error : undefined
          );
      }
    }

    // For other errors, throw a generic internal error
    throw ApiError.internal(
      process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    );
  });
}
