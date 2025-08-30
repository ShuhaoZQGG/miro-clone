// DataDog RUM (Real User Monitoring) Configuration
import { datadogRum } from '@datadog/browser-rum';
import { datadogLogs } from '@datadog/browser-logs';

export function initDatadog() {
  const clientToken = process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN;
  const applicationId = process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID;
  
  if (!clientToken || !applicationId) {
    console.log('DataDog credentials not found, skipping initialization');
    return;
  }

  // Initialize RUM
  datadogRum.init({
    applicationId,
    clientToken,
    site: 'datadoghq.com',
    service: 'miro-clone',
    env: process.env.NODE_ENV || 'development',
    version: process.env.VERCEL_GIT_COMMIT_SHA || '1.0.0',
    sessionSampleRate: 100,
    sessionReplaySampleRate: process.env.NODE_ENV === 'production' ? 20 : 100,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input',
    
    // Track custom actions
    trackViewsManually: false,
    
    // Performance tracking
    enableExperimentalFeatures: ['clickmap'],
    
    // User tracking
    trackSessionAcrossSubdomains: true,
    
    // Error tracking
    beforeSend: (event, context) => {
      // Filter out non-actionable errors
      if (context?.error?.message?.includes('ResizeObserver')) {
        return false;
      }
      return true;
    },
  });

  // Initialize Logs
  datadogLogs.init({
    clientToken,
    site: 'datadoghq.com',
    service: 'miro-clone',
    env: process.env.NODE_ENV || 'development',
    version: process.env.VERCEL_GIT_COMMIT_SHA || '1.0.0',
    
    // Logging configuration
    forwardErrorsToLogs: true,
    forwardConsoleLogs: ['error', 'warn'],
    forwardReports: ['intervention', 'deprecation'],
    
    // Sampling
    sessionSampleRate: 100,
    
    // Context
    beforeSend: (log) => {
      // Add custom context
      log.view = {
        url: window.location.href,
        referrer: document.referrer,
      };
      
      // Add user context if available
      const user = getCurrentUser();
      if (user) {
        log.usr = {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
      
      return log;
    },
  });

  // Start session
  datadogRum.startSessionReplayRecording();
}

// Custom monitoring utilities
export const monitoring = {
  // Track custom events
  trackEvent: (name: string, attributes?: Record<string, any>) => {
    datadogRum.addAction(name, attributes);
  },
  
  // Track errors
  trackError: (error: Error, context?: Record<string, any>) => {
    datadogRum.addError(error, {
      ...context,
      source: 'custom',
    });
  },
  
  // Track user actions
  trackUserAction: (action: string, metadata?: Record<string, any>) => {
    datadogRum.addAction(action, {
      type: 'user_action',
      ...metadata,
    });
  },
  
  // Track API calls
  trackApiCall: (url: string, method: string, status: number, duration: number) => {
    datadogRum.addAction('api_call', {
      url,
      method,
      status,
      duration,
      success: status >= 200 && status < 300,
    });
  },
  
  // Track page performance
  trackPageLoad: () => {
    if (typeof window !== 'undefined' && window.performance) {
      const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (perfData) {
        datadogRum.addAction('page_load', {
          dns: perfData.domainLookupEnd - perfData.domainLookupStart,
          tcp: perfData.connectEnd - perfData.connectStart,
          request: perfData.responseStart - perfData.requestStart,
          response: perfData.responseEnd - perfData.responseStart,
          dom: perfData.domInteractive - perfData.responseEnd,
          load: perfData.loadEventEnd - perfData.loadEventStart,
          total: perfData.loadEventEnd - perfData.fetchStart,
        });
      }
    }
  },
  
  // Set user context
  setUser: (user: { id: string; email?: string; name?: string }) => {
    datadogRum.setUser({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  },
  
  // Add custom timing
  addTiming: (name: string, duration: number) => {
    datadogRum.addTiming(name, duration);
  },
};

// Helper function to get current user (implement based on your auth system)
function getCurrentUser() {
  // This should be implemented based on your authentication system
  // For example, from NextAuth session or context
  return null;
}

// Performance observer for Core Web Vitals
export function observeWebVitals() {
  if (typeof window === 'undefined') return;
  
  // Observe Largest Contentful Paint
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as any;
    monitoring.addTiming('lcp', lastEntry.renderTime || lastEntry.loadTime);
  });
  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  
  // Observe First Input Delay
  const fidObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      monitoring.addTiming('fid', entry.processingStart - entry.startTime);
    });
  });
  fidObserver.observe({ entryTypes: ['first-input'] });
  
  // Observe Cumulative Layout Shift
  let cls = 0;
  const clsObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      if (!entry.hadRecentInput) {
        cls += entry.value;
        monitoring.addTiming('cls', cls * 1000); // Convert to ms
      }
    });
  });
  clsObserver.observe({ entryTypes: ['layout-shift'] });
}