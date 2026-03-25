import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get('accessToken')?.value;

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password'];
  
  // Special routes that should be accessible regardless of auth status
  const specialRoutes = ['/auth/reset-password'];
  
  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard', '/admin', '/profile', '/users', '/staff', 
    '/reward-redemptions', '/reward-catalog', '/sessions', 
    '/app-rules', '/global-rules', '/rbac-rules',
    '/app-management', '/ads-management', '/audit-logs',
    '/login-history', '/notifications', '/settings'
  ];

  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  const isSpecialRoute = specialRoutes.some(route => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (!accessToken && isProtectedRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    url.search = `returnTo=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access auth routes (except special routes) - DON'T REDIRECT FROM LOGIN PAGE
  if (accessToken && isPublicRoute && pathname !== '/auth/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Allow access to login page when authenticated (for login/refresh scenarios)
  if (accessToken && pathname === '/auth/login') {
    return NextResponse.next();
  }

  // Reset password route is special - allow access regardless of auth status
  if (isSpecialRoute) {
    return NextResponse.next();
  }

  // Redirect root to appropriate page based on authentication
  if (pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = accessToken ? '/dashboard' : '/auth/login';
    return NextResponse.redirect(url);
  }

  // For all other routes, let them fall through to show 404 if they don't exist
  return NextResponse.next();
}

export const config = {
  matcher: [

    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
