import { UserRole } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, Session } from 'next-auth';

import { authOptions } from '@/lib/auth';
import * as permissions from '@/lib/utils/permissions';

import { createUnauthorizedResponse, createForbiddenResponse } from '../utils/api-response';

/**
 * Authentication middleware to ensure the user is authenticated
 */
export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, session: Session) => Promise<NextResponse>
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return createUnauthorizedResponse();
  }

  // Check if user is active
  if (!permissions.isActive(session)) {
    return createForbiddenResponse('Your account is currently suspended');
  }

  return handler(request, session);
}

/**
 * Role-based access control middleware
 */
export async function withRole(
  request: NextRequest,
  handler: (req: NextRequest, session: Session) => Promise<NextResponse>,
  roles: UserRole[]
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return createUnauthorizedResponse();
  }

  // Check if user is active
  if (!permissions.isActive(session)) {
    return createForbiddenResponse('Your account is currently suspended');
  }

  // Check if user has required role
  if (!permissions.hasOneOfRoles(session, roles)) {
    return createForbiddenResponse();
  }

  return handler(request, session);
}

/**
 * Permission-based access control middleware
 */
export async function withPermission(
  request: NextRequest,
  handler: (req: NextRequest, session: Session) => Promise<NextResponse>,
  permissionCheck: (session: Session, ...args: unknown[]) => boolean,
  ...permissionArgs: unknown[]
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return createUnauthorizedResponse();
  }

  // Check if user is active
  if (!permissions.isActive(session)) {
    return createForbiddenResponse('Your account is currently suspended');
  }

  // Check if user has required permission
  if (!permissionCheck(session, ...permissionArgs)) {
    return createForbiddenResponse();
  }

  return handler(request, session);
}
