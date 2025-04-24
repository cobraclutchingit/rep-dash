import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Middleware function
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;
  const isActiveUser = token?.isActive !== false; // Default to true if not specified

  // Define auth pages
  const isAuthPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register') ||
    request.nextUrl.pathname.startsWith('/forgot-password') ||
    request.nextUrl.pathname.startsWith('/reset-password');

  // If user is on auth page but already authenticated, redirect to dashboard
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Define public pages (accessible without login)
  const isPublic =
    request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/api/public');

  // If user is accessing a public page, allow access
  if (isPublic) {
    return NextResponse.next();
  }

  // Define protected pages
  const isProtectedPage =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/calendar') ||
    request.nextUrl.pathname.startsWith('/training') ||
    request.nextUrl.pathname.startsWith('/onboarding') ||
    request.nextUrl.pathname.startsWith('/communication') ||
    request.nextUrl.pathname.startsWith('/leaderboard') ||
    request.nextUrl.pathname.startsWith('/profile');

  // Protected API routes
  const isProtectedApi =
    request.nextUrl.pathname.startsWith('/api/') &&
    !request.nextUrl.pathname.startsWith('/api/auth/') &&
    !request.nextUrl.pathname.startsWith('/api/public/');

  // If user is not authenticated and accesses protected page or API, redirect to login
  if ((isProtectedPage || isProtectedApi) && !isAuthenticated) {
    // If it's an API request, return 401 Unauthorized
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For page requests, redirect to login
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(request.nextUrl.pathname)}`, request.url)
    );
  }

  // Check if account is inactive (suspended)
  if (isAuthenticated && !isActiveUser && !isAuthPage) {
    // For API requests, return 403 Forbidden
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
    }

    // For page requests, redirect to account suspended page
    return NextResponse.redirect(new URL('/account-suspended', request.url));
  }

  // Check admin routes
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin');
  const isAdminApi = request.nextUrl.pathname.startsWith('/api/admin');
  const isAdmin = token?.role === 'ADMIN';

  // If user is not an admin but accessing admin routes, redirect to dashboard
  if ((isAdminPage || isAdminApi) && !isAdmin) {
    // For API requests, return 403 Forbidden
    if (isAdminApi) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // For page requests, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Role-specific page access controls
  const isManagerPage = request.nextUrl.pathname.startsWith('/manager');
  const isManager = token?.position === 'MANAGER';

  if (isManagerPage && !(isAdmin || isManager)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Sales position-specific routes
  const isECPage = request.nextUrl.pathname.startsWith('/energy-consultant');
  const isEnergyConsultant =
    token?.position === 'ENERGY_CONSULTANT' || token?.position === 'ENERGY_SPECIALIST';

  if (isECPage && !(isAdmin || isManager || isEnergyConsultant)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Continue for all other cases
  return NextResponse.next();
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/login/:path*',
    '/register/:path*',
    '/forgot-password/:path*',
    '/reset-password/:path*',
    '/account-suspended/:path*',
    '/calendar/:path*',
    '/training/:path*',
    '/onboarding/:path*',
    '/communication/:path*',
    '/leaderboard/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/manager/:path*',
    '/energy-consultant/:path*',
    '/api/:path*',
  ],
};
