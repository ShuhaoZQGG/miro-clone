#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface MigrationOptions {
  isDryRun?: boolean;
  skipBackup?: boolean;
  force?: boolean;
}

class ProductionMigration {
  private prisma: PrismaClient;
  
  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async runMigrations(options: MigrationOptions = {}) {
    console.log('🚀 Starting production database migration...');
    
    try {
      // Step 1: Check database connection
      await this.checkConnection();
      
      // Step 2: Create backup (unless skipped)
      if (!options.skipBackup) {
        await this.createBackup();
      }
      
      // Step 3: Run Prisma migrations
      if (options.isDryRun) {
        await this.dryRunMigrations();
      } else {
        await this.applyMigrations(options.force);
      }
      
      // Step 4: Validate schema
      await this.validateSchema();
      
      // Step 5: Seed initial data if needed
      await this.seedInitialData();
      
      console.log('✅ Migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      
      // Rollback if needed
      if (!options.isDryRun && !options.skipBackup) {
        console.log('🔄 Attempting rollback...');
        await this.rollback();
      }
      
      process.exit(1);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private async checkConnection() {
    console.log('📡 Checking database connection...');
    
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection successful');
    } catch (error) {
      throw new Error(`Failed to connect to database: ${error}`);
    }
  }

  private async createBackup() {
    console.log('💾 Creating database backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup-${timestamp}.sql`;
    
    try {
      // Use pg_dump for PostgreSQL backup
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not set');
      }
      
      const command = `pg_dump ${databaseUrl} > backups/${backupFile}`;
      await execAsync(`mkdir -p backups && ${command}`);
      
      console.log(`✅ Backup created: ${backupFile}`);
    } catch (error) {
      console.warn(`⚠️ Backup failed: ${error}`);
      // Continue with migration but warn about missing backup
    }
  }

  private async dryRunMigrations() {
    console.log('🔍 Running migration dry run...');
    
    try {
      const { stdout } = await execAsync('npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script');
      
      if (stdout.trim()) {
        console.log('📋 Pending migrations:');
        console.log(stdout);
      } else {
        console.log('✅ No pending migrations');
      }
    } catch (error) {
      throw new Error(`Dry run failed: ${error}`);
    }
  }

  private async applyMigrations(force?: boolean) {
    console.log('🔄 Applying database migrations...');
    
    try {
      const command = force 
        ? 'npx prisma migrate deploy --skip-seed'
        : 'npx prisma migrate deploy';
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      
      console.log('✅ Migrations applied successfully');
    } catch (error) {
      throw new Error(`Migration failed: ${error}`);
    }
  }

  private async validateSchema() {
    console.log('🔍 Validating database schema...');
    
    try {
      // Check if all required tables exist
      const tables = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
      `;
      
      const requiredTables = [
        'users',
        'boards',
        'board_collaborators',
        'board_versions',
        'sessions',
        'activity_logs',
        'elements',
      ];
      
      const existingTables = tables.map(t => t.tablename);
      const missingTables = requiredTables.filter(t => !existingTables.includes(t));
      
      if (missingTables.length > 0) {
        throw new Error(`Missing tables: ${missingTables.join(', ')}`);
      }
      
      console.log('✅ Schema validation successful');
    } catch (error) {
      throw new Error(`Schema validation failed: ${error}`);
    }
  }

  private async seedInitialData() {
    console.log('🌱 Checking for initial data...');
    
    try {
      // Check if we need to create admin user
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN' },
      });
      
      if (adminCount === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH) {
        console.log('Creating admin user...');
        
        await this.prisma.user.create({
          data: {
            email: process.env.ADMIN_EMAIL,
            username: 'admin',
            passwordHash: process.env.ADMIN_PASSWORD_HASH,
            fullName: 'System Administrator',
            role: 'ADMIN',
            emailVerified: true,
          },
        });
        
        console.log('✅ Admin user created');
      }
      
      console.log('✅ Initial data check complete');
    } catch (error) {
      console.warn(`⚠️ Seeding failed: ${error}`);
      // Non-critical, continue
    }
  }

  private async rollback() {
    console.log('⏪ Rolling back migration...');
    
    try {
      // Find the latest backup
      const { stdout } = await execAsync('ls -t backups/*.sql | head -1');
      const latestBackup = stdout.trim();
      
      if (latestBackup) {
        console.log(`Restoring from: ${latestBackup}`);
        const databaseUrl = process.env.DATABASE_URL;
        await execAsync(`psql ${databaseUrl} < ${latestBackup}`);
        console.log('✅ Rollback successful');
      } else {
        console.error('❌ No backup available for rollback');
      }
    } catch (error) {
      console.error(`❌ Rollback failed: ${error}`);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {
    isDryRun: args.includes('--dry-run'),
    skipBackup: args.includes('--skip-backup'),
    force: args.includes('--force'),
  };

  if (args.includes('--help')) {
    console.log(`
Production Database Migration Tool

Usage: npm run migrate:production [options]

Options:
  --dry-run      Show what would be migrated without applying changes
  --skip-backup  Skip creating a backup before migration
  --force        Force migration even if there are warnings
  --help         Show this help message

Environment Variables:
  DATABASE_URL   PostgreSQL connection string (required)
  ADMIN_EMAIL    Initial admin email (optional)
  ADMIN_PASSWORD_HASH  Initial admin password hash (optional)
    `);
    process.exit(0);
  }

  const migration = new ProductionMigration();
  await migration.runMigrations(options);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { ProductionMigration };