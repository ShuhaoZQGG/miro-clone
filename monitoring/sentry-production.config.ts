/**
 * Production-ready Sentry configuration for Miro Clone
 * This file provides monitoring and error tracking capabilities
 */

interface SentryConfig {
  dsn?: string;
  environment: string;
  enabled: boolean;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

interface ErrorContext {
  userId?: string;
  boardId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class SentryService {
  private config: SentryConfig;
  private initialized: boolean = false;

  constructor() {
    this.config = {
      dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      enabled: !!process.env.SENTRY_DSN,
      tracesSampleRate: this.getTraceSampleRate(),
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    };
  }

  private getTraceSampleRate(): number {
    // Adjust sampling based on environment
    switch (process.env.NODE_ENV) {
      case 'production':
        return 0.1; // 10% in production
      case 'test':
        return 0; // Disable in test environment
      default:
        return 1.0; // 100% in development
    }
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      console.log('📊 Sentry monitoring disabled (no DSN configured)');
      return;
    }

    if (this.initialized) {
      console.warn('Sentry already initialized');
      return;
    }

    try {
      // Dynamic import to avoid loading Sentry if not needed
      const Sentry = await import('@sentry/nextjs');
      
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        
        // Performance Monitoring
        tracesSampleRate: this.config.tracesSampleRate,
        
        // Session Replay
        replaysSessionSampleRate: this.config.replaysSessionSampleRate,
        replaysOnErrorSampleRate: this.config.replaysOnErrorSampleRate,
        
        // Additional options
        beforeSend(event, hint) {
          // Filter out non-critical errors
          if (event.level === 'log' || event.level === 'debug') {
            return null;
          }
          
          // Sanitize sensitive data
          if (event.request?.cookies) {
            delete event.request.cookies;
          }
          
          return event;
        },
        
        integrations: [
          new Sentry.BrowserTracing({
            routingInstrumentation: Sentry.nextRouterInstrumentation,
          }),
        ],
      });

      this.initialized = true;
      console.log('✅ Sentry monitoring initialized');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  captureError(error: Error, context?: ErrorContext): void {
    if (!this.config.enabled) {
      console.error('Error (Sentry disabled):', error, context);
      return;
    }

    import('@sentry/nextjs').then(Sentry => {
      Sentry.withScope(scope => {
        if (context) {
          scope.setContext('error_context', context);
          if (context.userId) {
            scope.setUser({ id: context.userId });
          }
          if (context.boardId) {
            scope.setTag('board_id', context.boardId);
          }
        }
        Sentry.captureException(error);
      });
    }).catch(() => {
      console.error('Failed to capture error:', error, context);
    });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.config.enabled) {
      console.log(`[${level.toUpperCase()}]`, message);
      return;
    }

    import('@sentry/nextjs').then(Sentry => {
      Sentry.captureMessage(message, level);
    }).catch(() => {
      console.log(`[${level.toUpperCase()}]`, message);
    });
  }

  startTransaction(name: string, op: string = 'navigation') {
    const start = performance.now();
    
    if (!this.config.enabled) {
      return {
        finish: () => {
          const duration = performance.now() - start;
          console.log(`Transaction "${name}" completed in ${duration.toFixed(2)}ms`);
        },
        setStatus: (status: string) => {
          console.log(`Transaction "${name}" status: ${status}`);
        },
      };
    }

    let transaction: any = null;
    
    import('@sentry/nextjs').then(Sentry => {
      transaction = Sentry.startTransaction({ name, op });
      Sentry.getCurrentHub().configureScope(scope => scope.setSpan(transaction));
    }).catch(() => {
      console.log(`Started transaction: ${name}`);
    });

    return {
      finish: () => {
        if (transaction) {
          transaction.finish();
        }
        const duration = performance.now() - start;
        console.log(`Transaction "${name}" completed in ${duration.toFixed(2)}ms`);
      },
      setStatus: (status: string) => {
        if (transaction) {
          transaction.setStatus(status);
        }
      },
    };
  }

  async measurePerformance<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const transaction = this.startTransaction(name, 'task');
    const start = performance.now();
    
    try {
      const result = await fn();
      transaction.setStatus('ok');
      
      // Log performance metrics
      const duration = performance.now() - start;
      if (duration > 1000) {
        this.captureMessage(
          `Slow operation: ${name} took ${duration.toFixed(2)}ms`,
          'warning'
        );
      }
      
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      this.captureError(error as Error, { action: name, metadata });
      throw error;
    } finally {
      transaction.finish();
    }
  }

  setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.config.enabled) return;

    import('@sentry/nextjs').then(Sentry => {
      Sentry.setUser(user);
    }).catch(() => {
      console.log('User context set:', user.id);
    });
  }

  clearUser(): void {
    if (!this.config.enabled) return;

    import('@sentry/nextjs').then(Sentry => {
      Sentry.setUser(null);
    }).catch(() => {
      console.log('User context cleared');
    });
  }

  addBreadcrumb(
    message: string,
    category: string = 'custom',
    level: 'debug' | 'info' | 'warning' | 'error' = 'info',
    data?: Record<string, any>
  ): void {
    if (!this.config.enabled) {
      console.log(`[Breadcrumb] ${category}: ${message}`, data);
      return;
    }

    import('@sentry/nextjs').then(Sentry => {
      Sentry.addBreadcrumb({
        message,
        category,
        level,
        data,
        timestamp: Date.now() / 1000,
      });
    }).catch(() => {
      console.log(`[Breadcrumb] ${category}: ${message}`, data);
    });
  }
}

// Singleton instance
const sentryService = new SentryService();

// Initialize on module load
if (typeof window !== 'undefined') {
  sentryService.initialize();
}

// Export service methods
export const {
  initialize: initSentry,
  captureError,
  captureMessage,
  startTransaction,
  measurePerformance,
  setUser,
  clearUser,
  addBreadcrumb,
} = sentryService;

// Export error boundary component
export { ErrorBoundary } from './sentry.config';

// Export application error class
export class MonitoredError extends Error {
  public readonly context?: Record<string, any>;
  public readonly statusCode?: number;
  
  constructor(
    message: string,
    statusCode?: number,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'MonitoredError';
    this.statusCode = statusCode;
    this.context = context;
    
    // Automatically capture to Sentry
    sentryService.captureError(this, context);
  }
}

export default sentryService;