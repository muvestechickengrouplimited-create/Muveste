import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define the dashboard paths that need to be protected.
// Even though they are under the (dashboard) route group, their actual URLs don't include 'dashboard'.
const protectedPaths = [
  '/broiler-farm',
  '/butcher-kibungo',
  '/butcher-rwamagana',
  '/butcher-nyabugogo',
  '/finance',
  '/admin',
  '/settings'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current requested path is one of the protected dashboard routes
  const isProtectedRoute = protectedPaths.some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isProtectedRoute) {
    // Firebase Client SDK doesn't automatically attach an auth cookie.
    // We expect the /login page to set a 'session' cookie upon successful login.
    const session = request.cookies.get('session')?.value;

    if (!session) {
      // If no valid session cookie is found, redirect to the login page
      const loginUrl = new URL('/login', request.url);
      // You can also pass the 'from' parameter to redirect back after login
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
