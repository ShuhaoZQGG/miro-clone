// Sentry monitoring disabled - requires configuration
// import * as Sentry from '@sentry/nextjs';
import React from 'react';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

export function initSentry() {
  // Sentry initialization disabled - needs configuration
  console.log('Sentry monitoring disabled - configure SENTRY_DSN to enable');
  return;
}

// Error boundary component - fallback implementation
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  // Fallback error boundary without Sentry
  return React.createElement(React.Fragment, null, children);
}

// Performance monitoring utilities - fallback implementation
export const measurePerformance = {
  startTransaction: (name: string, op: string = 'navigation') => {
    console.log(`Starting transaction: ${name} (${op})`);
    return { finish: () => {}, setStatus: () => {} };
  },
  
  measureAsync: async <T,>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      console.log(`${name} completed in ${performance.now() - start}ms`);
      return result;
    } catch (error) {
      console.error(`${name} failed after ${performance.now() - start}ms`);
      throw error;
    }
  },
  
  measureSync: <T,>(name: string, fn: () => T): T => {
    const start = performance.now();
    try {
      const result = fn();
      console.log(`${name} completed in ${performance.now() - start}ms`);
      return result;
    } catch (error) {
      console.error(`${name} failed after ${performance.now() - start}ms`);
      throw error;
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
    
    // Log error with context (Sentry disabled)
    console.error('ApplicationError:', {
      message,
      statusCode,
      context,
    });
  }
}