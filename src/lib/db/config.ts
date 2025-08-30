// Database configuration for PostgreSQL and Redis

export const dbConfig = {
  postgres: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'miro_clone',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: 'miro_clone:',
    retryStrategy: (times: number) => {
      // Reconnect after 2^times * 100 ms, max 3 seconds
      const delay = Math.min(times * 100, 3000)
      return delay
    }
  }
}

// Connection URLs for easy setup
export const connectionUrls = {
  postgres: process.env.DATABASE_URL || 
    `postgresql://${dbConfig.postgres.user}:${dbConfig.postgres.password}@${dbConfig.postgres.host}:${dbConfig.postgres.port}/${dbConfig.postgres.database}`,
  
  redis: process.env.REDIS_URL || 
    `redis://${dbConfig.redis.password ? `:${dbConfig.redis.password}@` : ''}${dbConfig.redis.host}:${dbConfig.redis.port}/${dbConfig.redis.db}`
}