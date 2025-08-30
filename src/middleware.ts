import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware } from './middleware/security';

export async function middleware(request: NextRequest) {
  // Apply security middleware to API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const securityResponse = await securityMiddleware.handle(request);
    if (securityResponse) {
      return securityResponse;
    }
  }

  // Get security headers
  const headers = securityMiddleware.getSecurityHeaders();
  
  // Create response with security headers
  const response = NextResponse.next();
  
  headers.forEach((value, key) => {
    response.headers.set(key, value);
  });

  // Add CORS headers for allowed origins
  const origin = request.headers.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};