import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
}

// Rate limiter using LRU cache
class RateLimiter {
  private cache: LRUCache<string, { count: number; resetTime: number }>;

  constructor(private config: RateLimitConfig) {
    this.cache = new LRUCache({
      max: 10000, // Max number of items in cache
      ttl: config.windowMs, // Time to live
    });
  }

  async limit(req: NextRequest): Promise<NextResponse | null> {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(req)
      : this.getDefaultKey(req);
    
    const now = Date.now();
    const record = this.cache.get(key) || { count: 0, resetTime: now + this.config.windowMs };

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + this.config.windowMs;
    }

    record.count++;
    this.cache.set(key, record);

    if (record.count > this.config.maxRequests) {
      return NextResponse.json(
        { 
          error: this.config.message || 'Too many requests, please try again later.',
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)),
            'X-RateLimit-Limit': String(this.config.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
          }
        }
      );
    }

    return null;
  }

  private getDefaultKey(req: NextRequest): string {
    // Use IP address as default key
    const ip = req.headers.get('x-forwarded-for') || 
                req.headers.get('x-real-ip') || 
                'unknown';
    return `ratelimit:${ip}`;
  }
}

// CORS configuration
interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders?: string[];
  credentials: boolean;
  maxAge?: number;
}

// Security headers configuration
interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  strictTransportSecurity?: string;
  xContentTypeOptions?: string;
  xFrameOptions?: string;
  xXssProtection?: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
}

// Main security middleware
export class SecurityMiddleware {
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private corsConfig: CorsConfig;
  private securityHeaders: SecurityHeadersConfig;

  constructor() {
    // Initialize default CORS config
    this.corsConfig = {
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
      credentials: true,
      maxAge: 86400, // 24 hours
    };

    // Initialize security headers
    this.securityHeaders = {
      contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:;",
      strictTransportSecurity: 'max-age=31536000; includeSubDomains',
      xContentTypeOptions: 'nosniff',
      xFrameOptions: 'DENY',
      xXssProtection: '1; mode=block',
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: 'camera=(), microphone=(), geolocation=()',
    };

    // Initialize rate limiters for different endpoints
    this.initializeRateLimiters();
  }

  private initializeRateLimiters() {
    // General API rate limit
    this.rateLimiters.set('api', new RateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      message: 'Too many API requests',
    }));

    // Auth endpoints (stricter)
    this.rateLimiters.set('auth', new RateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      message: 'Too many authentication attempts',
    }));

    // Board creation (moderate)
    this.rateLimiters.set('board-create', new RateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 20,
      message: 'Board creation limit reached',
    }));

    // File upload (strict)
    this.rateLimiters.set('upload', new RateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 50,
      message: 'Upload limit reached',
    }));
  }

  async handle(req: NextRequest): Promise<NextResponse | null> {
    // Apply CORS
    const corsResponse = this.applyCors(req);
    if (corsResponse) return corsResponse;

    // Apply rate limiting based on path
    const rateLimitResponse = await this.applyRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    // Apply security headers
    const headers = this.getSecurityHeaders();

    return null; // Continue to next middleware
  }

  private applyCors(req: NextRequest): NextResponse | null {
    const origin = req.headers.get('origin');
    const method = req.method;

    // Handle preflight requests
    if (method === 'OPTIONS') {
      const headers = new Headers();
      
      if (origin && this.isOriginAllowed(origin)) {
        headers.set('Access-Control-Allow-Origin', origin);
        headers.set('Access-Control-Allow-Methods', this.corsConfig.allowedMethods.join(', '));
        headers.set('Access-Control-Allow-Headers', this.corsConfig.allowedHeaders.join(', '));
        headers.set('Access-Control-Max-Age', String(this.corsConfig.maxAge));
        
        if (this.corsConfig.credentials) {
          headers.set('Access-Control-Allow-Credentials', 'true');
        }
        
        if (this.corsConfig.exposedHeaders) {
          headers.set('Access-Control-Expose-Headers', this.corsConfig.exposedHeaders.join(', '));
        }
      }

      return new NextResponse(null, { status: 204, headers });
    }

    return null;
  }

  private isOriginAllowed(origin: string): boolean {
    return this.corsConfig.allowedOrigins.includes(origin) || 
           this.corsConfig.allowedOrigins.includes('*');
  }

  private async applyRateLimit(req: NextRequest): Promise<NextResponse | null> {
    const path = req.nextUrl.pathname;

    // Determine which rate limiter to use
    let limiterKey = 'api'; // default
    
    if (path.startsWith('/api/auth')) {
      limiterKey = 'auth';
    } else if (path.includes('/boards/create')) {
      limiterKey = 'board-create';
    } else if (path.includes('/upload')) {
      limiterKey = 'upload';
    }

    const limiter = this.rateLimiters.get(limiterKey);
    if (limiter) {
      return await limiter.limit(req);
    }

    return null;
  }

  getSecurityHeaders(): Headers {
    const headers = new Headers();

    if (this.securityHeaders.contentSecurityPolicy) {
      headers.set('Content-Security-Policy', this.securityHeaders.contentSecurityPolicy);
    }
    
    if (this.securityHeaders.strictTransportSecurity) {
      headers.set('Strict-Transport-Security', this.securityHeaders.strictTransportSecurity);
    }
    
    if (this.securityHeaders.xContentTypeOptions) {
      headers.set('X-Content-Type-Options', this.securityHeaders.xContentTypeOptions);
    }
    
    if (this.securityHeaders.xFrameOptions) {
      headers.set('X-Frame-Options', this.securityHeaders.xFrameOptions);
    }
    
    if (this.securityHeaders.xXssProtection) {
      headers.set('X-XSS-Protection', this.securityHeaders.xXssProtection);
    }
    
    if (this.securityHeaders.referrerPolicy) {
      headers.set('Referrer-Policy', this.securityHeaders.referrerPolicy);
    }
    
    if (this.securityHeaders.permissionsPolicy) {
      headers.set('Permissions-Policy', this.securityHeaders.permissionsPolicy);
    }

    return headers;
  }
}

// Request validation utilities
export class RequestValidator {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static sanitizeInput(input: string): string {
    // Remove any potentially dangerous characters
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  static validateUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

// CSRF protection
export class CsrfProtection {
  private static readonly TOKEN_LENGTH = 32;

  static generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  static validateToken(token: string, sessionToken: string): boolean {
    if (!token || !sessionToken) return false;
    
    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(sessionToken)
    );
  }
}

// Export middleware instance
export const securityMiddleware = new SecurityMiddleware();