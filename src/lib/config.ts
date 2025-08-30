export class Config {
  private static instance: Config

  private constructor() {
    this.validateEnvironment()
  }

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config()
    }
    return Config.instance
  }

  private validateEnvironment(): void {
    const required = [
      'JWT_SECRET',
      'DATABASE_URL',
    ]

    const missing = required.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}. ` +
        'Please check your .env file.'
      )
    }

    // Validate JWT_SECRET is not default
    if (process.env.JWT_SECRET === 'default-secret') {
      throw new Error(
        'JWT_SECRET cannot be "default-secret" in production. ' +
        'Please set a secure random secret.'
      )
    }

    // Validate JWT_SECRET length
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      throw new Error(
        'JWT_SECRET must be at least 32 characters long for security.'
      )
    }
  }

  get jwtSecret(): string {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET is not configured')
    }
    return secret
  }

  get databaseUrl(): string {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error('DATABASE_URL is not configured')
    }
    return url
  }

  get redisUrl(): string | undefined {
    return process.env.REDIS_URL
  }

  get nodeEnv(): string {
    return process.env.NODE_ENV || 'development'
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development'
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production'
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test'
  }

  get port(): number {
    return parseInt(process.env.PORT || '3000', 10)
  }

  get nextAuthUrl(): string {
    return process.env.NEXTAUTH_URL || `http://localhost:${this.port}`
  }

  get corsOrigin(): string {
    return process.env.CORS_ORIGIN || '*'
  }

  get sentryDsn(): string | undefined {
    return process.env.SENTRY_DSN
  }

  get awsAccessKeyId(): string | undefined {
    return process.env.AWS_ACCESS_KEY_ID
  }

  get awsSecretAccessKey(): string | undefined {
    return process.env.AWS_SECRET_ACCESS_KEY
  }

  get awsRegion(): string {
    return process.env.AWS_REGION || 'us-east-1'
  }

  get s3BucketName(): string | undefined {
    return process.env.S3_BUCKET_NAME
  }
}

// Initialize config on import (for server-side)
if (typeof window === 'undefined') {
  try {
    Config.getInstance()
  } catch (error) {
    // Only log in non-test environments
    if (process.env.NODE_ENV !== 'test') {
      console.error('Configuration error:', error)
    }
  }
}

export const config = Config.getInstance.bind(Config)