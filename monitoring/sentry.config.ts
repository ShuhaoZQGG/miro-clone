import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.log('Sentry DSN not found, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/miro-clone\.vercel\.app/,
      /^https:\/\/api\.miro-clone/,
    ],
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    
    // Integrations
    integrations: [
      new Sentry.BrowserTracing({
        routingInstrumentation: Sentry.nextRouterInstrumentation,
      }),
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    // Filtering
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      
      // Network errors
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      
      // User cancelled actions
      'AbortError',
      'cancelled',
    ],
    
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      
      // Other browsers
      /^moz-extension:\/\//i,
      /^ms-browser-extension:\/\//i,
    ],
    
    beforeSend(event, hint) {
      // Filter out non-actionable errors
      if (event.exception) {
        const error = hint.originalException;
        
        // Filter out network errors in development
        if (process.env.NODE_ENV === 'development' && 
            error && typeof error === 'object' && 
            'name' in error && error.name === 'NetworkError') {
          return null;
        }
      }
      
      // Add user context
      if (event.user) {
        event.user = {
          ...event.user,
          ip_address: '{{auto}}',
        };
      }
      
      return event;
    },
  });
}

// Error boundary component
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-4">
            We've been notified and are working on a fix.
          </p>
          <details className="mb-4 p-4 border rounded max-w-lg">
            <summary className="cursor-pointer">Error details</summary>
            <pre className="mt-2 text-sm overflow-auto">
              {error?.message || 'Unknown error'}
            </pre>
          </details>
          <button
            onClick={resetError}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try again
          </button>
        </div>
      )}
      showDialog={process.env.NODE_ENV === 'development'}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}

// Performance monitoring utilities
export const measurePerformance = {
  startTransaction: (name: string, op: string = 'navigation') => {
    return Sentry.startTransaction({ name, op });
  },
  
  measureAsync: async <T,>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    const transaction = Sentry.startTransaction({ name, op: 'task' });
    Sentry.getCurrentHub().getScope()?.setSpan(transaction);
    
    try {
      const result = await fn();
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      throw error;
    } finally {
      transaction.finish();
    }
  },
  
  measureSync: <T,>(name: string, fn: () => T): T => {
    const transaction = Sentry.startTransaction({ name, op: 'task' });
    Sentry.getCurrentHub().getScope()?.setSpan(transaction);
    
    try {
      const result = fn();
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      throw error;
    } finally {
      transaction.finish();
    }
  },
};

// Custom error class for better error tracking
export class ApplicationError extends Error {
  public readonly context?: Record<string, any>;
  public readonly statusCode?: number;
  
  constructor(
    message: string,
    statusCode?: number,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.statusCode = statusCode;
    this.context = context;
    
    // Capture to Sentry with context
    Sentry.captureException(this, {
      contexts: {
        application: {
          statusCode,
          ...context,
        },
      },
    });
  }
}