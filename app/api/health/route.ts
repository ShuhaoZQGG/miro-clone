import { NextRequest, NextResponse } from 'next/server';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database?: 'connected' | 'disconnected';
    redis?: 'connected' | 'disconnected';
    websocket?: 'ready' | 'not_configured';
    monitoring?: 'active' | 'inactive';
  };
  metrics: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    responseTime?: number;
    activeConnections?: number;
  };
  environment: string;
  version: string;
}

async function checkDatabaseConnection(): Promise<'connected' | 'disconnected'> {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      return 'disconnected';
    }
    
    // In production, you would actually test the database connection
    // For now, we'll return based on environment variable presence
    return 'connected';
  } catch {
    return 'disconnected';
  }
}

async function checkRedisConnection(): Promise<'connected' | 'disconnected'> {
  try {
    // Check if REDIS_URL is configured
    if (!process.env.REDIS_URL) {
      return 'disconnected';
    }
    
    // In production, you would actually test the Redis connection
    return 'connected';
  } catch {
    return 'disconnected';
  }
}

function checkWebSocketStatus(): 'ready' | 'not_configured' {
  // Check if WebSocket URL is configured
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return 'ready';
  }
  return 'not_configured';
}

function checkMonitoringStatus(): 'active' | 'inactive' {
  // Check if Sentry is configured
  if (process.env.SENTRY_DSN) {
    return 'active';
  }
  return 'inactive';
}

function getMemoryUsage() {
  const memUsage = process.memoryUsage();
  const totalMemory = process.env.NODE_ENV === 'production' 
    ? 512 * 1024 * 1024 // Assume 512MB in production
    : 2048 * 1024 * 1024; // Assume 2GB in development
  
  const used = memUsage.heapUsed + memUsage.external;
  
  return {
    used: Math.round(used / 1024 / 1024), // MB
    total: Math.round(totalMemory / 1024 / 1024), // MB
    percentage: Math.round((used / totalMemory) * 100),
  };
}

function getUptime(): number {
  return Math.round(process.uptime());
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Check all services
    const [dbStatus, redisStatus] = await Promise.all([
      checkDatabaseConnection(),
      checkRedisConnection(),
    ]);
    
    const wsStatus = checkWebSocketStatus();
    const monitoringStatus = checkMonitoringStatus();
    
    // Determine overall health status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (dbStatus === 'disconnected' || wsStatus === 'not_configured') {
      overallStatus = 'degraded';
    }
    
    // Get metrics
    const memory = getMemoryUsage();
    const uptime = getUptime();
    const responseTime = Date.now() - startTime;
    
    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
        websocket: wsStatus,
        monitoring: monitoringStatus,
      },
      metrics: {
        uptime,
        memory,
        responseTime,
      },
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.1.0',
    };
    
    // Add cache headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Response-Time': `${responseTime}ms`,
    });
    
    return NextResponse.json(healthStatus, { 
      status: 200,
      headers,
    });
  } catch (error) {
    // Even on error, return a response
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        services: {},
        metrics: {
          uptime: getUptime(),
          memory: getMemoryUsage(),
        },
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '0.1.0',
      },
      { status: 503 }
    );
  }
}