import { NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/db-utils'

export async function GET() {
  try {
    const dbConnected = await checkDatabaseConnection()
    
    const healthStatus = {
      status: dbConnected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbConnected ? 'connected' : 'disconnected',
        api: 'operational',
      },
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
    }
    
    return NextResponse.json(healthStatus, {
      status: dbConnected ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    )
  }
}