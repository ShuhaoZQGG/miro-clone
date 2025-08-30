import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// Production database configuration
export const createProductionPrismaClient = () => {
  const prismaClient = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'minimal',
  });

  // Connection pooling configuration
  prismaClient.$connect().catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  });

  return prismaClient;
};

// Production Redis configuration
export const createProductionRedisClient = () => {
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
  
  if (!redisUrl) {
    throw new Error('Redis URL not configured');
  }

  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
    enableReadyCheck: true,
    enableOfflineQueue: true,
    connectTimeout: 10000,
    keepAlive: 30000,
  });

  redis.on('connect', () => {
    console.log('Connected to Redis');
  });

  redis.on('error', (error) => {
    console.error('Redis error:', error);
  });

  redis.on('close', () => {
    console.log('Redis connection closed');
  });

  return redis;
};

// Database health check
export const checkDatabaseHealth = async (prisma: PrismaClient, redis: Redis) => {
  try {
    // Check Prisma connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    await redis.ping();
    
    return { healthy: true };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { healthy: false, error };
  }
};

// Connection pooling manager
export class ConnectionPool {
  private static prismaInstance: PrismaClient | null = null;
  private static redisInstance: Redis | null = null;

  static getPrisma(): PrismaClient {
    if (!this.prismaInstance) {
      this.prismaInstance = createProductionPrismaClient();
    }
    return this.prismaInstance;
  }

  static getRedis(): Redis {
    if (!this.redisInstance) {
      this.redisInstance = createProductionRedisClient();
    }
    return this.redisInstance;
  }

  static async cleanup() {
    if (this.prismaInstance) {
      await this.prismaInstance.$disconnect();
      this.prismaInstance = null;
    }
    if (this.redisInstance) {
      this.redisInstance.disconnect();
      this.redisInstance = null;
    }
  }
}

// Export singleton instances
export const prisma = ConnectionPool.getPrisma();
export const redis = ConnectionPool.getRedis();