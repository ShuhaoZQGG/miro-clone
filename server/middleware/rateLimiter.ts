import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';

interface RateLimitOptions {
  uniqueTokenPerInterval?: number;
  interval?: number;
}

export function rateLimit(options?: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000, // 1 minute default
  });

  return async function rateLimitMiddleware(request: NextRequest) {
    const token = request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'anonymous';
    const tokenCount = (tokenCache.get(token) as number[]) || [0];
    
    if (tokenCount[0] === 0) {
      tokenCache.set(token, [1]);
    } else {
      tokenCache.set(token, [tokenCount[0] + 1]);
    }

    const currentUsage = tokenCache.get(token) as number[];
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
    
    if (currentUsage[0] > maxRequests) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + (options?.interval || 60000)).toISOString(),
          },
        }
      );
    }

    return null; // Continue to next middleware
  };
}

// Simple in-memory rate limiter for WebSocket connections
class WebSocketRateLimiter {
  private connections: Map<string, number[]> = new Map();
  private readonly maxConnections: number;
  private readonly windowMs: number;

  constructor(maxConnections = 5, windowMs = 60000) {
    this.maxConnections = maxConnections;
    this.windowMs = windowMs;

    // Clean up old entries periodically
    setInterval(() => {
      const now = Date.now();
      this.connections.forEach((timestamps, ip) => {
        const validTimestamps = timestamps.filter(t => now - t < this.windowMs);
        if (validTimestamps.length === 0) {
          this.connections.delete(ip);
        } else {
          this.connections.set(ip, validTimestamps);
        }
      });
    }, this.windowMs);
  }

  checkLimit(ip: string): boolean {
    const now = Date.now();
    const timestamps = this.connections.get(ip) || [];
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs);
    
    if (validTimestamps.length >= this.maxConnections) {
      return false; // Rate limit exceeded
    }
    
    // Add new timestamp
    validTimestamps.push(now);
    this.connections.set(ip, validTimestamps);
    
    return true; // Within limits
  }

  reset(ip: string): void {
    this.connections.delete(ip);
  }
}

export const wsRateLimiter = new WebSocketRateLimiter(
  parseInt(process.env.WS_RATE_LIMIT_MAX_CONNECTIONS || '5'),
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
);

// Rate limiter for API routes
export const apiRateLimiter = rateLimit({
  uniqueTokenPerInterval: 500,
  interval: 60000, // 1 minute
});

// Stricter rate limiter for auth routes
export const authRateLimiter = rateLimit({
  uniqueTokenPerInterval: 100,
  interval: 300000, // 5 minutes
});