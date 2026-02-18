import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get('accessToken')?.value;

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password'];
  
  // Special routes that should be accessible regardless of auth status
  const specialRoutes = ['/auth/reset-password'];
  
  // All valid routes that actually exist in your app
  const validRoutes = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
    '/dashboard',
    '/dashboard/profile',
    '/dashboard/app-rules',
    '/dashboard/users',
  ];
  
  // Check if the pathname exactly matches a valid route or is a dynamic route under reset-password
  const isValidRoute = validRoutes.includes(pathname) || pathname.startsWith('/auth/reset-password/');
  
  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  
  // Check if it's a special route
  const isSpecialRoute = specialRoutes.some(route => pathname.startsWith(route));

  // Redirect root to appropriate page based on authentication
  if (pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = accessToken ? '/dashboard' : '/auth/login';
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access public auth routes (except special routes)
  if (accessToken && isPublicRoute && !isSpecialRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Reset password route is special - allow access regardless of auth status
  if (isSpecialRoute) {
    return NextResponse.next();
  }

  // Handle invalid/unknown routes
  if (!isValidRoute) {
    const url = req.nextUrl.clone();
    // If authenticated, redirect to dashboard; otherwise to login
    url.pathname = accessToken ? '/dashboard' : '/auth/login';
    return NextResponse.redirect(url);
  }

  // If user is not authenticated and trying to access protected routes (dashboard)
  if (!accessToken && pathname.startsWith('/dashboard')) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    url.search = `returnTo=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - robots.txt
     * - sitemap.xml
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
