import rateLimit from 'express-rate-limit'
import { NextRequest, NextResponse } from 'next/server'

// Express rate limiter for WebSocket server
export const createRateLimiter = (options?: {
  windowMs?: number
  max?: number
  message?: string
}) => {
  return rateLimit({
    windowMs: options?.windowMs || 60 * 1000, // 1 minute
    max: options?.max || 100, // limit each IP to 100 requests per windowMs
    message: options?.message || 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  })
}

// Rate limiter for Next.js API routes
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function rateLimitMiddleware(
  request: NextRequest,
  limits: { windowMs: number; max: number } = { windowMs: 60000, max: 100 }
) {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const now = Date.now()
  const userLimit = requestCounts.get(ip)

  if (!userLimit || now > userLimit.resetTime) {
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + limits.windowMs
    })
    return { allowed: true, remaining: limits.max - 1 }
  }

  if (userLimit.count >= limits.max) {
    const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000)
    return { 
      allowed: false, 
      remaining: 0,
      retryAfter,
      response: NextResponse.json(
        { error: 'Too many requests, please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limits.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(userLimit.resetTime).toISOString()
          }
        }
      )
    }
  }

  userLimit.count++
  const remaining = limits.max - userLimit.count
  
  return { 
    allowed: true, 
    remaining,
    headers: {
      'X-RateLimit-Limit': limits.max.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': new Date(userLimit.resetTime).toISOString()
    }
  }
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  const entries = Array.from(requestCounts.entries())
  for (const [ip, limit] of entries) {
    if (now > limit.resetTime) {
      requestCounts.delete(ip)
    }
  }
}, 60000) // Clean up every minute