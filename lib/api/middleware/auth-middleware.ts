import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createUnauthorizedResponse, createForbiddenResponse } from "../utils/api-response";
import * as permissions from "@/lib/utils/permissions";

/**
 * Authentication middleware to ensure the user is authenticated
 */
export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, session: any) => Promise<NextResponse>
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return createUnauthorizedResponse();
  }

  // Check if user is active
  if (!permissions.isActive(session)) {
    return createForbiddenResponse("Your account is currently suspended");
  }

  return handler(request, session);
}

/**
 * Role-based access control middleware
 */
export async function withRole(
  request: NextRequest,
  handler: (req: NextRequest, session: any) => Promise<NextResponse>,
  roles: string[]
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return createUnauthorizedResponse();
  }

  // Check if user is active
  if (!permissions.isActive(session)) {
    return createForbiddenResponse("Your account is currently suspended");
  }

  // Check if user has required role
  if (!permissions.hasOneOfRoles(session, roles as any[])) {
    return createForbiddenResponse();
  }

  return handler(request, session);
}

/**
 * Permission-based access control middleware
 */
export async function withPermission(
  request: NextRequest,
  handler: (req: NextRequest, session: any) => Promise<NextResponse>,
  permissionCheck: (session: any, ...args: any[]) => boolean,
  ...permissionArgs: any[]
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return createUnauthorizedResponse();
  }

  // Check if user is active
  if (!permissions.isActive(session)) {
    return createForbiddenResponse("Your account is currently suspended");
  }

  // Check if user has required permission
  if (!permissionCheck(session, ...permissionArgs)) {
    return createForbiddenResponse();
  }

  return handler(request, session);
}