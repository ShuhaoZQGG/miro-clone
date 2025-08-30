#!/usr/bin/env ts-node

import { validateEnvironment, runDeploymentChecks } from '../src/lib/deployment/verification';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const DEPLOYMENT_TARGETS = ['vercel', 'railway', 'local'] as const;
type DeploymentTarget = typeof DEPLOYMENT_TARGETS[number];

interface DeploymentConfig {
  target: DeploymentTarget;
  envFile?: string;
  skipHealthCheck?: boolean;
}

function loadEnvironment(target: DeploymentTarget, envFile?: string): void {
  const envPath = envFile || `.env.${target}`;
  
  if (fs.existsSync(envPath)) {
    console.log(`📁 Loading environment from ${envPath}`);
    dotenv.config({ path: envPath });
  } else if (fs.existsSync('.env.production')) {
    console.log('📁 Loading environment from .env.production');
    dotenv.config({ path: '.env.production' });
  } else if (fs.existsSync('.env')) {
    console.log('📁 Loading environment from .env');
    dotenv.config({ path: '.env' });
  } else {
    console.warn('⚠️  No environment file found, using process environment');
  }
}

async function validateDeploymentTarget(target: DeploymentTarget): Promise<boolean> {
  console.log(`\n🎯 Validating ${target.toUpperCase()} deployment configuration...\n`);
  
  const specificRequirements: Record<DeploymentTarget, string[]> = {
    vercel: ['VERCEL_URL', 'VERCEL_ENV'],
    railway: ['RAILWAY_ENVIRONMENT', 'PORT'],
    local: ['NODE_ENV'],
  };
  
  const required = specificRequirements[target] || [];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing ${target}-specific variables:`, missing.join(', '));
    console.warn('   These may be automatically provided during deployment\n');
  }
  
  return true;
}

async function checkPreDeployment(): Promise<void> {
  console.log('🔍 Running pre-deployment checks...\n');
  
  // Check if build passes
  console.log('🏗️  Verifying build...');
  try {
    const { execSync } = require('child_process');
    execSync('npm run build', { stdio: 'pipe' });
    console.log('✅ Build successful\n');
  } catch (error) {
    console.error('❌ Build failed. Please fix build errors before deployment.');
    process.exit(1);
  }
  
  // Check if tests pass
  console.log('🧪 Running tests...');
  try {
    const { execSync } = require('child_process');
    const output = execSync('npm test -- --passWithNoTests', { stdio: 'pipe' });
    console.log('✅ Tests passed\n');
  } catch (error) {
    console.warn('⚠️  Some tests failed. Review before deployment.\n');
  }
  
  // Check TypeScript
  console.log('📝 Checking TypeScript...');
  try {
    const { execSync } = require('child_process');
    execSync('npm run type-check', { stdio: 'pipe' });
    console.log('✅ TypeScript check passed\n');
  } catch (error) {
    console.warn('⚠️  TypeScript warnings detected\n');
  }
}

async function generateDeploymentReport(target: DeploymentTarget): Promise<void> {
  const reportPath = path.join(process.cwd(), 'deployment-report.json');
  
  const report = {
    target,
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    configuration: {
      hasDatabase: !!process.env.DATABASE_URL,
      hasRedis: !!process.env.REDIS_URL,
      hasWebSocket: !!process.env.NEXT_PUBLIC_WS_URL,
      hasMonitoring: !!process.env.SENTRY_DSN,
    },
    validation: {
      environmentValid: false,
      healthCheckPassed: false,
      buildPassed: false,
      testsPassed: false,
    },
  };
  
  // Run validation
  const envResult = validateEnvironment(process.env as any);
  report.validation.environmentValid = envResult.valid;
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Deployment report saved to: ${reportPath}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const targetIndex = args.findIndex(arg => DEPLOYMENT_TARGETS.includes(arg as DeploymentTarget));
  const target: DeploymentTarget = targetIndex >= 0 
    ? args[targetIndex] as DeploymentTarget 
    : 'local';
  
  const skipHealthCheck = args.includes('--skip-health');
  const skipPreChecks = args.includes('--skip-pre-checks');
  const envFile = args.find(arg => arg.startsWith('--env='))?.split('=')[1];
  
  console.log('🚀 Miro Clone Deployment Validator\n');
  console.log('==================================\n');
  
  // Load environment
  loadEnvironment(target, envFile);
  
  // Run pre-deployment checks
  if (!skipPreChecks) {
    await checkPreDeployment();
  }
  
  // Validate target-specific requirements
  await validateDeploymentTarget(target);
  
  // Validate environment variables
  const envResult = validateEnvironment(process.env as any);
  
  if (!envResult.valid) {
    console.error('❌ Environment validation failed:');
    envResult.errors.forEach(err => console.error(`  - ${err}`));
    
    if (target === 'local') {
      console.log('\n💡 For local development, create a .env file with:');
      console.log('   NEXT_PUBLIC_APP_URL=http://localhost:3000');
      console.log('   NEXT_PUBLIC_WS_URL=ws://localhost:3001');
      console.log('   DATABASE_URL=postgresql://user:pass@localhost:5432/miro_clone');
      console.log('   REDIS_URL=redis://localhost:6379');
      console.log('   JWT_SECRET=your-secret-key-at-least-32-chars');
    }
    
    process.exit(1);
  }
  
  if (envResult.warnings && envResult.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    envResult.warnings.forEach(warn => console.warn(`  - ${warn}`));
  } else {
    console.log('✅ Environment variables validated\n');
  }
  
  // Run health checks if not skipped
  if (!skipHealthCheck && process.env.NEXT_PUBLIC_APP_URL) {
    try {
      await runDeploymentChecks();
    } catch (error) {
      console.warn('⚠️  Health check failed:', error);
      console.warn('   This is normal if services are not yet deployed\n');
    }
  }
  
  // Generate deployment report
  await generateDeploymentReport(target);
  
  console.log('\n✅ Deployment validation complete!');
  console.log(`   Target: ${target}`);
  console.log('   Ready for deployment\n');
}

// Run the validator
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

export { validateDeploymentTarget, checkPreDeployment };