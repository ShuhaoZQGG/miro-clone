interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

interface HealthCheckResult {
  service: string;
  healthy: boolean;
  responseTime?: number;
  error?: string;
  details?: any;
}

interface DeploymentResult {
  success: boolean;
  services: HealthCheckResult[];
  failedServices?: string[];
  metricsPass?: boolean;
  metrics?: any;
}

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_WS_URL',
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
];

const OPTIONAL_ENV_VARS = [
  'SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
  'VERCEL_URL',
  'RAILWAY_ENVIRONMENT',
];

export function validateEnvironment(env: Record<string, string | undefined>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    if (!env[varName]) {
      errors.push(`${varName} is required`);
    }
  }

  // Validate URL formats
  const urlVars = ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_WS_URL', 'DATABASE_URL', 'REDIS_URL'];
  for (const varName of urlVars) {
    if (env[varName]) {
      try {
        new URL(env[varName]!);
      } catch {
        errors.push(`${varName} must be a valid URL`);
      }
    }
  }

  // Check WebSocket URL protocol
  if (env.NEXT_PUBLIC_WS_URL && !env.NEXT_PUBLIC_WS_URL.startsWith('ws')) {
    errors.push('NEXT_PUBLIC_WS_URL must use ws:// or wss:// protocol');
  }

  // Check optional but recommended variables
  for (const varName of OPTIONAL_ENV_VARS) {
    if (!env[varName]) {
      warnings.push(`${varName} is recommended for production`);
    }
  }

  // Validate JWT secret strength
  if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters for security');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export async function checkServiceHealth(
  service: string,
  url: string,
  timeout: number = 5000
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const healthUrl = service === 'websocket' 
      ? url.replace('wss://', 'https://').replace('ws://', 'http://') + '/health'
      : url + '/api/health';

    const response = await fetch(healthUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Miro-Clone-Deployment-Verifier/1.0',
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        service,
        healthy: false,
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    
    return {
      service,
      healthy: true,
      responseTime,
      details: data,
    };
  } catch (error) {
    return {
      service,
      healthy: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function verifyDeployment(config: any): Promise<DeploymentResult> {
  const healthChecks: HealthCheckResult[] = [];
  const failedServices: string[] = [];

  // Check each service
  const services = [
    { name: 'frontend', url: config.frontend },
    { name: 'websocket', url: config.websocket },
    { name: 'monitoring', url: config.monitoring },
  ].filter(s => s.url);

  for (const service of services) {
    const result = await checkServiceHealth(service.name, service.url);
    healthChecks.push(result);
    
    if (!result.healthy) {
      failedServices.push(service.name);
    }
  }

  // Check metrics against requirements
  let metricsPass = true;
  const metrics: any = {};

  if (config.requirements) {
    for (const check of healthChecks) {
      if (check.healthy && check.details?.metrics) {
        const m = check.details.metrics;
        
        if (config.requirements.maxLoadTime && m.loadTime > config.requirements.maxLoadTime) {
          metricsPass = false;
          metrics.loadTimeExceeded = true;
        }
        
        if (config.requirements.maxLatency && m.latency > config.requirements.maxLatency) {
          metricsPass = false;
          metrics.latencyExceeded = true;
        }
        
        if (config.requirements.minUptime && m.uptime < config.requirements.minUptime) {
          metricsPass = false;
          metrics.uptimeBelowThreshold = true;
        }
        
        Object.assign(metrics, m);
      }
    }
  }

  return {
    success: failedServices.length === 0 && metricsPass,
    services: healthChecks,
    failedServices: failedServices.length > 0 ? failedServices : undefined,
    metricsPass,
    metrics,
  };
}

export async function runDeploymentChecks(): Promise<void> {
  console.log('🚀 Running deployment verification...\n');

  // Step 1: Validate environment
  console.log('📋 Validating environment variables...');
  const envResult = validateEnvironment(process.env as any);
  
  if (!envResult.valid) {
    console.error('❌ Environment validation failed:');
    envResult.errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
  
  if (envResult.warnings && envResult.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    envResult.warnings.forEach(warn => console.warn(`  - ${warn}`));
  } else {
    console.log('✅ Environment variables validated\n');
  }

  // Step 2: Check service health
  console.log('🏥 Checking service health...');
  
  const config = {
    frontend: process.env.NEXT_PUBLIC_APP_URL,
    websocket: process.env.NEXT_PUBLIC_WS_URL,
    monitoring: process.env.SENTRY_DSN ? 'https://sentry.io' : undefined,
    requirements: {
      maxLoadTime: 2000,
      maxLatency: 200,
      minUptime: 99.5,
    }
  };

  const deployResult = await verifyDeployment(config);
  
  // Display results
  console.log('\n📊 Deployment Status:');
  deployResult.services.forEach(service => {
    const status = service.healthy ? '✅' : '❌';
    const time = service.responseTime ? ` (${service.responseTime}ms)` : '';
    console.log(`  ${status} ${service.service}${time}`);
    if (service.error) {
      console.error(`     Error: ${service.error}`);
    }
  });

  if (deployResult.metrics) {
    console.log('\n📈 Performance Metrics:');
    console.log(`  Load Time: ${deployResult.metrics.loadTime || 'N/A'}ms`);
    console.log(`  Latency: ${deployResult.metrics.latency || 'N/A'}ms`);
    console.log(`  Uptime: ${deployResult.metrics.uptime || 'N/A'}%`);
  }

  if (!deployResult.success) {
    console.error('\n❌ Deployment verification failed!');
    if (deployResult.failedServices) {
      console.error('Failed services:', deployResult.failedServices.join(', '));
    }
    process.exit(1);
  } else {
    console.log('\n✅ Deployment verification successful!');
  }
}

// Run if executed directly
if (require.main === module) {
  runDeploymentChecks().catch(console.error);
}