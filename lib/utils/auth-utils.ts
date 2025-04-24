import { UserRole, SalesPosition } from '@prisma/client';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { Session } from 'next-auth';

import { authOptions } from '@/lib/auth';

/**
 * Utility for protected server components
 * Checks if user is authenticated, redirects to login if not
 * Optionally checks if user has specific roles
 */
export async function requireAuth(
  redirectTo = '/login',
  options?: {
    requiredRoles?: UserRole[];
    requiredPositions?: SalesPosition[];
    redirectUnauthorizedTo?: string;
  }
): Promise<Session> {
  const session = await getServerSession(authOptions);

  // Not authenticated
  if (!session) {
    redirect(redirectTo);
  }

  // Check if user is active
  if (session.user?.isActive === false) {
    redirect('/account-suspended');
  }

  // Check roles if required
  if (options?.requiredRoles && options.requiredRoles.length > 0) {
    const userRole = session.user?.role as UserRole;
    if (!userRole || !options.requiredRoles.includes(userRole)) {
      redirect(options.redirectUnauthorizedTo || '/dashboard');
    }
  }

  // Check positions if required
  if (options?.requiredPositions && options.requiredPositions.length > 0) {
    const userPosition = session.user?.position as SalesPosition;
    if (!userPosition || !options.requiredPositions.includes(userPosition)) {
      redirect(options.redirectUnauthorizedTo || '/dashboard');
    }
  }

  return session;
}

/**
 * Type guard for user roles
 */
export function hasRole(role: unknown): role is UserRole {
  return typeof role === 'string' && Object.values(UserRole).includes(role as UserRole);
}

/**
 * Type guard for sales positions
 */
export function hasPosition(position: unknown): position is SalesPosition {
  return typeof position === 'string' && Object.values(SalesPosition).includes(position as SalesPosition);
}