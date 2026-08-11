import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip middleware for internal Next.js paths and common static assets
  if (
    pathname.includes('.') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get('accessToken')?.value;
  const refreshToken = req.cookies.get('refreshToken')?.value;
  const agencyToken = req.cookies.get('agency_owner_gs_authtoken')?.value;

  // Robust auth check - handle common edge cases like 'undefined' or 'null' strings
  const hasAuth = !!(
    (accessToken && accessToken !== 'undefined' && accessToken !== 'null') ||
    (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') ||
    (agencyToken && agencyToken !== 'undefined' && agencyToken !== 'null')
  );

  // Route categories
  // Public auth routes should NOT be accessible when logged in
  const authRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password'];
  
  // Routes accessible by EVERYONE (guests AND authenticated users)
  const globalAccessRoutes = [
    '/pages/terms-and-conditions',
    '/pages/privacy-policy',
    '/pages/how-to-delete-account',
    '/billing/success',
    '/billing/cancel',
    '/friends/accept',
  ];
  
  const protectedPrefixes = [
    '/dashboard', '/profile', '/app-rules', '/global-rules',
    '/rbac-rules', '/users', '/staff', '/sessions',
    '/reward-redemptions', '/audit-logs', '/settings', '/admin'
  ];

  const isAuthRoute = authRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  const isGlobalAccessRoute = globalAccessRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  const isPublicRoute = isAuthRoute || isGlobalAccessRoute;
  const isKnownProtected = protectedPrefixes.some(prefix => pathname === prefix || pathname.startsWith(prefix + '/'));

  // Logic for Authenticated users
  if (hasAuth) {
    // If authenticated, redirect away from public auth pages (except reset-password) or root to dashboard
    const shouldRedirect = pathname === '/' || (isAuthRoute && !pathname.startsWith('/auth/reset-password'));

    if (shouldRedirect) {

      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }
  // Logic for Unauthenticated users
  else {
    // If NOT authenticated, redirect to login if on root, protected route, or unknown route
    // (Everything except publicRoutes is considered protected in this admin app)
    if (pathname === '/' || !isPublicRoute) {

      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      // Only add returnTo if it's a known protected route and not just root
      if (pathname !== '/' && (isKnownProtected || !isPublicRoute)) {
        const returnPath = `${pathname}${req.nextUrl.search || ''}`;
        url.search = `returnTo=${encodeURIComponent(returnPath)}`;
      } else {
        url.search = '';
      }
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next (Next.js internals)
     * - static files (favicon.ico, robots.txt, etc.)
     */
    '/((?!api|_next|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
