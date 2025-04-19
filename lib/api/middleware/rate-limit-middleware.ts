import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createErrorResponse } from "../utils/api-response";

// Simple in-memory rate limiting store
// In production, use a more robust solution like Redis
const rateLimitStore = new Map<string, { count: number; timestamp: number }>();

// Clean up expired rate limit entries
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.timestamp > 60000) { // 1 minute window
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every minute
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 60000);
}

/**
 * Rate limiting middleware
 * @param limit Maximum number of requests in the time window
 * @param windowMs Time window in milliseconds
 * @param identifierFn Function to determine the rate limit key
 */
export async function withRateLimit(
  request: NextRequest,
  handler: (req: NextRequest, session?: any) => Promise<NextResponse>,
  options: {
    limit?: number; // Default: 60
    windowMs?: number; // Default: 60000 (1 minute)
    identifierFn?: (req: NextRequest, session?: any) => string;
  } = {}
) {
  const {
    limit = 60,
    windowMs = 60000,
    identifierFn,
  } = options;

  // Get session if available
  const session = await getServerSession(authOptions);

  // Determine rate limit key
  let identifier: string;
  if (identifierFn) {
    identifier = identifierFn(request, session);
  } else {
    // Default behavior: use IP address or userId if authenticated
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    identifier = session?.user?.id || ip;
  }

  // Add API path to make the key more specific
  const key = `${identifier}:${request.nextUrl.pathname}`;

  const now = Date.now();
  const windowStart = now - windowMs;

  // Get current rate limit data
  const currentLimit = rateLimitStore.get(key) || { count: 0, timestamp: now };

  // Reset if outside window
  if (currentLimit.timestamp < windowStart) {
    currentLimit.count = 0;
    currentLimit.timestamp = now;
  }

  // Increment counter
  currentLimit.count += 1;
  rateLimitStore.set(key, currentLimit);

  // Check if over limit
  if (currentLimit.count > limit) {
    return createErrorResponse("Too many requests, please try again later", 429);
  }

  // Set rate limit headers
  const response = await handler(request, session);
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', Math.max(0, limit - currentLimit.count).toString());
  response.headers.set('X-RateLimit-Reset', (Math.ceil(currentLimit.timestamp / 1000) + windowMs / 1000).toString());

  return response;
}