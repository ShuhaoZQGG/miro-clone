import { db } from './db'

export class DatabaseConnectionError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message)
    this.name = 'DatabaseConnectionError'
  }
}

export async function withDbConnection<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    return await operation()
  } catch (error: any) {
    // Check for common database connection errors
    if (
      error.code === 'P1001' || // Can't reach database server
      error.code === 'P1002' || // Database server timeout
      error.code === 'P1003' || // Database does not exist
      error.code === 'P1009' || // Database already exists
      error.code === 'P1010' || // User was denied access
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('ETIMEDOUT') ||
      error.message?.includes('ENOTFOUND')
    ) {
      const message = `Database connection failed: ${error.message}`
      console.error(message)
      
      if (fallback !== undefined) {
        return fallback
      }
      
      throw new DatabaseConnectionError(message, error.code)
    }
    
    // Re-throw other errors
    throw error
  }
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Try a simple query to check connection
    await db.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection check failed:', error)
    return false
  }
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i)
        console.log(`Retrying operation in ${delay}ms (attempt ${i + 2}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

export function handleDatabaseError(error: any): {
  message: string
  statusCode: number
  isRetryable: boolean
} {
  // Connection errors
  if (error instanceof DatabaseConnectionError) {
    return {
      message: 'Database connection unavailable. Please try again later.',
      statusCode: 503,
      isRetryable: true,
    }
  }
  
  // Prisma-specific errors
  if (error.code) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return {
          message: 'A record with this value already exists.',
          statusCode: 409,
          isRetryable: false,
        }
      case 'P2025': // Record not found
        return {
          message: 'The requested record was not found.',
          statusCode: 404,
          isRetryable: false,
        }
      case 'P2003': // Foreign key constraint violation
        return {
          message: 'Cannot perform this operation due to related records.',
          statusCode: 400,
          isRetryable: false,
        }
      case 'P2024': // Timeout
        return {
          message: 'Database operation timed out. Please try again.',
          statusCode: 504,
          isRetryable: true,
        }
      default:
        break
    }
  }
  
  // Generic database error
  return {
    message: 'A database error occurred. Please try again later.',
    statusCode: 500,
    isRetryable: false,
  }
}