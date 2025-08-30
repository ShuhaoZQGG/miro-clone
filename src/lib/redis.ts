import Redis from 'ioredis'

// Create Redis client
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

let redis: Redis | null = null

try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        console.error('Redis connection failed after 3 retries')
        return null
      }
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    reconnectOnError: (err) => {
      const targetError = 'READONLY'
      if (err.message.includes(targetError)) {
        // Only reconnect when the error contains "READONLY"
        return true
      }
      return false
    },
  })

  redis.on('connect', () => {
    console.log('Connected to Redis')
  })

  redis.on('error', (err) => {
    console.error('Redis error:', err)
  })
} catch (error) {
  console.error('Failed to create Redis client:', error)
}

// Session management functions
export const sessionStore = {
  async get(sessionId: string): Promise<any> {
    if (!redis) return null
    
    try {
      const data = await redis.get(`session:${sessionId}`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Session get error:', error)
      return null
    }
  },

  async set(sessionId: string, data: any, ttl = 86400): Promise<boolean> {
    if (!redis) return false
    
    try {
      await redis.setex(`session:${sessionId}`, ttl, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Session set error:', error)
      return false
    }
  },

  async delete(sessionId: string): Promise<boolean> {
    if (!redis) return false
    
    try {
      await redis.del(`session:${sessionId}`)
      return true
    } catch (error) {
      console.error('Session delete error:', error)
      return false
    }
  },

  async extend(sessionId: string, ttl = 86400): Promise<boolean> {
    if (!redis) return false
    
    try {
      await redis.expire(`session:${sessionId}`, ttl)
      return true
    } catch (error) {
      console.error('Session extend error:', error)
      return false
    }
  },
}

// Rate limiting functions
export const rateLimiter = {
  async check(key: string, limit: number, window: number): Promise<boolean> {
    if (!redis) return true // Allow if Redis is not available
    
    try {
      const current = await redis.incr(`rate:${key}`)
      
      if (current === 1) {
        await redis.expire(`rate:${key}`, window)
      }
      
      return current <= limit
    } catch (error) {
      console.error('Rate limit check error:', error)
      return true // Allow on error
    }
  },

  async reset(key: string): Promise<void> {
    if (!redis) return
    
    try {
      await redis.del(`rate:${key}`)
    } catch (error) {
      console.error('Rate limit reset error:', error)
    }
  },
}

// Cache functions
export const cache = {
  async get(key: string): Promise<any> {
    if (!redis) return null
    
    try {
      const data = await redis.get(`cache:${key}`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  },

  async set(key: string, data: any, ttl = 3600): Promise<boolean> {
    if (!redis) return false
    
    try {
      await redis.setex(`cache:${key}`, ttl, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  },

  async delete(key: string): Promise<boolean> {
    if (!redis) return false
    
    try {
      await redis.del(`cache:${key}`)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  },

  async invalidate(pattern: string): Promise<number> {
    if (!redis) return 0
    
    try {
      const keys = await redis.keys(`cache:${pattern}`)
      if (keys.length > 0) {
        return await redis.del(...keys)
      }
      return 0
    } catch (error) {
      console.error('Cache invalidate error:', error)
      return 0
    }
  },
}

export default redis