// DataDog RUM (Real User Monitoring) Configuration
// NOTE: DataDog requires paid plan - commented out for deployment
// import { datadogRum } from '@datadog/browser-rum';
// import { datadogLogs } from '@datadog/browser-logs';

export function initDatadog() {
  // DataDog initialization disabled - requires paid plan
  console.log('DataDog monitoring disabled - using alternative monitoring solutions');
  return;
}

// Custom monitoring utilities - fallback implementation
export const monitoring = {
  // Track custom events
  trackEvent: (name: string, attributes?: Record<string, any>) => {
    console.log('Event tracked:', name, attributes);
    // In production, this would send to Sentry or another monitoring service
  },
  
  // Track errors
  trackError: (error: Error, context?: Record<string, any>) => {
    console.error('Error tracked:', error, context);
    // In production, this would send to Sentry
  },
  
  // Track user actions
  trackUserAction: (action: string, metadata?: Record<string, any>) => {
    console.log('User action:', action, metadata);
    // In production, this would send to analytics service
  },
  
  // Track API calls
  trackApiCall: (url: string, method: string, status: number, duration: number) => {
    console.log('API call:', { url, method, status, duration });
    // In production, this would send to monitoring service
  },
  
  // Track page performance
  trackPageLoad: () => {
    if (typeof window !== 'undefined' && window.performance) {
      const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (perfData) {
        console.log('Page load metrics:', {
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
    console.log('User context set:', user);
    // In production, this would set context in Sentry
  },
  
  // Add custom timing
  addTiming: (name: string, duration: number) => {
    console.log('Timing:', name, duration);
    // In production, this would send to performance monitoring
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
  
  try {
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
  } catch (error) {
    console.log('Web Vitals monitoring not available');
  }
}