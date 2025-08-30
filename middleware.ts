import { NextRequest, NextResponse } from 'next/server';
import { corsMiddleware } from './server/middleware/cors';
import { apiRateLimiter, authRateLimiter } from './server/middleware/rateLimiter';

export async function middleware(request: NextRequest) {
  // Apply CORS to all API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const corsResponse = corsMiddleware(request);
    
    // Handle OPTIONS preflight requests
    if (request.method === 'OPTIONS') {
      return corsResponse;
    }

    // Apply rate limiting to auth routes
    if (request.nextUrl.pathname.startsWith('/api/auth')) {
      const rateLimitResponse = await authRateLimiter(request);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    }
    
    // Apply general rate limiting to other API routes
    else if (request.nextUrl.pathname.startsWith('/api')) {
      const rateLimitResponse = await apiRateLimiter(request);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    }

    return corsResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};