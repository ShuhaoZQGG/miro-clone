import { Socket } from 'socket.io';

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  message?: string;  // Error message
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// Store for rate limiting data per socket/event
const rateLimitStores = new Map<string, RateLimitStore>();

// Default rate limit configurations per event type
const eventRateLimits: Record<string, RateLimitConfig> = {
  'cursor-move': {
    windowMs: 1000,  // 1 second
    maxRequests: 30,  // 30 cursor updates per second max
    message: 'Too many cursor updates'
  },
  'element-create': {
    windowMs: 1000,
    maxRequests: 10,  // 10 element creations per second max
    message: 'Too many element creations'
  },
  'element-update': {
    windowMs: 1000,
    maxRequests: 20,  // 20 element updates per second max
    message: 'Too many element updates'
  },
  'element-delete': {
    windowMs: 1000,
    maxRequests: 10,  // 10 element deletions per second max
    message: 'Too many element deletions'
  },
  'elements-batch-update': {
    windowMs: 1000,
    maxRequests: 5,  // 5 batch updates per second max
    message: 'Too many batch updates'
  },
  'default': {
    windowMs: 1000,
    maxRequests: 50,  // Default: 50 events per second max
    message: 'Too many requests'
  }
};

export function createRateLimiter(eventName: string, customConfig?: RateLimitConfig) {
  const config = customConfig || eventRateLimits[eventName] || eventRateLimits.default;
  
  return (socket: Socket, next: (err?: Error) => void) => {
    const key = `${socket.id}:${eventName}`;
    const now = Date.now();
    
    // Get or create rate limit store for this socket/event combination
    let store = rateLimitStores.get(key);
    
    if (!store || now > store.resetTime) {
      // Create new store or reset expired one
      store = {
        count: 1,
        resetTime: now + config.windowMs
      };
      rateLimitStores.set(key, store);
      return next();
    }
    
    // Check if limit exceeded
    if (store.count >= config.maxRequests) {
      const error = new Error(config.message || 'Rate limit exceeded');
      (error as any).code = 'RATE_LIMIT_EXCEEDED';
      return next(error);
    }
    
    // Increment counter
    store.count++;
    next();
  };
}

// Cleanup old entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  rateLimitStores.forEach((store, key) => {
    if (now > store.resetTime + 60000) {  // Remove entries older than 1 minute past reset
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => rateLimitStores.delete(key));
}, 60000);  // Run cleanup every minute

// Apply rate limiting to socket events
export function applyRateLimiting(socket: Socket) {
  const originalEmit = socket.emit;
  
  // Track events for rate limiting
  const trackedEvents = [
    'cursor-move',
    'element-create', 
    'element-update',
    'element-delete',
    'elements-batch-update'
  ];
  
  // Intercept event handlers
  trackedEvents.forEach(eventName => {
    const originalOn = socket.on;
    socket.on = function(this: Socket, event: string, handler: any) {
      if (event === eventName) {
        const rateLimiter = createRateLimiter(eventName);
        const wrappedHandler = function(this: any, ...args: any[]) {
          rateLimiter(socket, (err) => {
            if (err) {
              socket.emit('error', {
                type: 'rate_limit',
                event: eventName,
                message: err.message
              });
              return;
            }
            handler.apply(this, args);
          });
        };
        return originalOn.call(this, event, wrappedHandler);
      }
      return originalOn.call(this, event, handler);
    } as any;
  });
  
  return socket;
}

// Export function to clear rate limit for a socket (e.g., on disconnect)
export function clearRateLimitForSocket(socketId: string) {
  const keysToDelete: string[] = [];
  rateLimitStores.forEach((_, key) => {
    if (key.startsWith(`${socketId}:`)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => rateLimitStores.delete(key));
}