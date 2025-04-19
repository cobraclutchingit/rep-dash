import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ZodSchema } from "zod";
import { createErrorResponse, createUnauthorizedResponse, createForbiddenResponse } from "./api-response";
import { ApiError } from "./api-error";
import * as permissions from "@/lib/utils/permissions";

/**
 * Options for the API handler
 */
interface ApiHandlerOptions {
  // Route options
  GET?: RouteHandlerOptions;
  POST?: RouteHandlerOptions;
  PUT?: RouteHandlerOptions;
  PATCH?: RouteHandlerOptions;
  DELETE?: RouteHandlerOptions;
}

/**
 * Options for a specific HTTP method in the API handler
 */
interface RouteHandlerOptions {
  // Request validation
  validator?: ZodSchema;
  
  // Authentication/Authorization
  auth?: boolean;
  roles?: string[];
  permission?: (session: any, ...args: any[]) => boolean;
  permissionArgs?: any[];
  
  // Request handling
  handler: (req: NextRequest, context: { session?: any; params?: any }) => Promise<NextResponse>;
}

/**
 * Enhanced API handler that encapsulates common API route functionality
 * including validation, authentication, and error handling.
 */
export function createApiHandler(options: ApiHandlerOptions) {
  return async (req: NextRequest, context: { params: any }) => {
    const method = req.method as keyof ApiHandlerOptions;
    const methodOptions = options[method];
    
    // Return 405 Method Not Allowed if method is not supported
    if (!methodOptions) {
      return createErrorResponse(`Method ${method} Not Allowed`, 405);
    }
    
    try {
      // Get session if authentication is needed
      let session = null;
      if (methodOptions.auth || methodOptions.roles || methodOptions.permission) {
        session = await getServerSession(authOptions);
        
        // Check authentication
        if (!session) {
          return createUnauthorizedResponse();
        }
        
        // Check if user is active
        if (!permissions.isActive(session)) {
          return createForbiddenResponse("Your account is currently suspended");
        }
        
        // Check roles if specified
        if (methodOptions.roles && !permissions.hasOneOfRoles(session, methodOptions.roles as any[])) {
          return createForbiddenResponse();
        }
        
        // Check permissions if specified
        if (methodOptions.permission && !methodOptions.permission(session, ...(methodOptions.permissionArgs || []))) {
          return createForbiddenResponse();
        }
      }
      
      // Validate request body if needed
      if (methodOptions.validator && ["POST", "PUT", "PATCH"].includes(method)) {
        const body = await req.json();
        try {
          // Validate the request body
          const validatedData = methodOptions.validator.parse(body);
          
          // Replace the request with a modified request containing the validated data
          req = new NextRequest(req.url, {
            method: req.method,
            headers: req.headers,
            cache: req.cache,
            credentials: req.credentials,
            integrity: req.integrity,
            keepalive: req.keepalive,
            mode: req.mode,
            redirect: req.redirect,
            referrer: req.referrer,
            referrerPolicy: req.referrerPolicy,
            signal: req.signal,
            body: JSON.stringify(validatedData),
          });
        } catch (error) {
          return createErrorResponse(error as Error, 400);
        }
      }
      
      // Execute handler
      return await methodOptions.handler(req, { session, params: context.params });
    } catch (error) {
      // Handle different error types
      if (error instanceof ApiError) {
        return createErrorResponse(error.message, error.status);
      }
      
      // Log error for debugging
      console.error("API error:", error);
      
      // Return generic error response
      return createErrorResponse(
        process.env.NODE_ENV === "development" && error instanceof Error 
          ? error.message 
          : "Internal Server Error",
        500
      );
    }
  };
}