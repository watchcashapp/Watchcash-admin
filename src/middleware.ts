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
  const protectedRoutes = ['/dashboard', '/admin', '/profile'];

  // Check if path matches any route type
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  const isSpecialRoute = specialRoutes.some(route => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // If user is not authenticated and trying to access protected routes
  if (!accessToken && isProtectedRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    url.search = `returnTo=${encodeURIComponent(pathname)}`;
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

  // Redirect root to appropriate page based on authentication
  if (pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = accessToken ? '/dashboard' : '/auth/login';
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
