import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Protect routes listed in `matcher` (see export config below).
 * If there is no session (getToken returns null) redirect to NextAuth sign-in
 * with a callbackUrl so the user is returned after login.
 *
 * Make sure NEXTAUTH_SECRET is set in your environment for getToken to work.
 */
export async function middleware(request: NextRequest) {
  const { nextUrl, url } = request;
  const pathname = nextUrl.pathname;

  // Allow public assets and NextAuth routes
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/auth") || // allow NextAuth endpoints
    pathname.startsWith("/static/") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Check token/session
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    // redirect to sign in page with callbackUrl pointing back to requested page
    const signInUrl = new URL("/api/auth/signin", url);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

/**
 * Configure which paths the middleware runs for.
 * Update this list to include your protected routes.
 */
export const config = {
  matcher: [
    /*
      Protect dashboard and any project-related pages and API routes.
      Add/remove patterns as needed for your app.
    */
    "/dashboard/:path*",
    "/projects/:path*",
    "/api/projects/:path*",
    "/settings/:path*"
  ],
};