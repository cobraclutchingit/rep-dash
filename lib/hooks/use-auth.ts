import { UserRole, SalesPosition } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

import { hasOneOfRoles, hasOneOfPositions } from '@/lib/utils/permissions';

type UseAuthOptions = {
  requiredRoles?: UserRole[];
  requiredPositions?: SalesPosition[];
  redirectTo?: string;
  redirectIfFound?: boolean;
  redirectUnauthorizedTo?: string;
  onAuthorizedCallback?: () => void;
  onUnauthorizedCallback?: () => void;
};

/**
 * Client-side hook for auth checking and redirects
 */
export function useAuth({
  requiredRoles,
  requiredPositions,
  redirectTo = '/login',
  redirectIfFound = false,
  redirectUnauthorizedTo = '/dashboard',
  onAuthorizedCallback,
  onUnauthorizedCallback,
}: UseAuthOptions = {}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    // Don't do anything while loading
    if (isLoading) return;

    // Handle redirect if found logic
    if (redirectIfFound && isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Handle no auth or suspended user
    if (!isAuthenticated) {
      router.push(redirectTo);
      onUnauthorizedCallback?.();
      return;
    }

    // Check if user account is suspended
    if (session?.user?.isActive === false) {
      router.push('/account-suspended');
      return;
    }

    // Check roles if required
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = hasOneOfRoles(session, requiredRoles);
      if (!hasRequiredRole) {
        router.push(redirectUnauthorizedTo);
        onUnauthorizedCallback?.();
        return;
      }
    }

    // Check positions if required
    if (requiredPositions && requiredPositions.length > 0) {
      const hasRequiredPosition = hasOneOfPositions(session, requiredPositions);
      if (!hasRequiredPosition) {
        router.push(redirectUnauthorizedTo);
        onUnauthorizedCallback?.();
        return;
      }
    }

    // If we got here, user is authorized
    onAuthorizedCallback?.();
  }, [
    isLoading,
    isAuthenticated,
    session,
    router,
    redirectIfFound,
    redirectTo,
    redirectUnauthorizedTo,
    requiredRoles,
    requiredPositions,
    onAuthorizedCallback,
    onUnauthorizedCallback,
  ]);

  return {
    session,
    status,
    isLoading,
    isAuthenticated,
    isAuthorized:
      isAuthenticated &&
      session?.user?.isActive !== false &&
      (!requiredRoles || hasOneOfRoles(session, requiredRoles)) &&
      (!requiredPositions || hasOneOfPositions(session, requiredPositions)),
  };
}