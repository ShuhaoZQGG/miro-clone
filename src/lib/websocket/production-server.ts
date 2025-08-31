import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { instrument } from '@socket.io/admin-ui';
import Redis from 'ioredis';
import { Server as HTTPServer } from 'http';

interface ProductionSocketConfig {
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  redisUrl: string;
  adminAuth?: {
    username: string;
    password: string;
  };
  maxHttpBufferSize?: number;
  pingTimeout?: number;
  pingInterval?: number;
  transports?: ('polling' | 'websocket')[];
}

export class ProductionSocketServer {
  private io: SocketIOServer;
  private pubClient: Redis;
  private subClient: Redis;

  constructor(httpServer: HTTPServer, config: ProductionSocketConfig) {
    // Initialize Socket.IO with production settings
    this.io = new SocketIOServer(httpServer, {
      cors: config.cors,
      maxHttpBufferSize: config.maxHttpBufferSize || 1e7, // 10 MB
      pingTimeout: config.pingTimeout || 60000,
      pingInterval: config.pingInterval || 25000,
      transports: config.transports || ['websocket', 'polling'],
      allowEIO3: true, // Support older clients
    });

    // Setup Redis adapter for horizontal scaling
    this.pubClient = new Redis(config.redisUrl, {
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.subClient = this.pubClient.duplicate();

    // Configure Redis adapter
    this.io.adapter(createAdapter(this.pubClient, this.subClient));

    // Setup admin UI for monitoring (optional)
    if (config.adminAuth) {
      instrument(this.io, {
        auth: {
          type: 'basic',
          username: config.adminAuth.username,
          password: config.adminAuth.password,
        },
        mode: 'production',
      });
    }

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupScaling();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        // Verify JWT token
        const userId = await this.verifyToken(token);
        
        if (!userId) {
          return next(new Error('Invalid token'));
        }

        // Attach user info to socket
        socket.data.userId = userId;
        socket.data.connectedAt = Date.now();
        
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Rate limiting middleware
    const rateLimitMap = new Map();
    
    this.io.use((socket, next) => {
      const clientId = socket.handshake.address;
      const now = Date.now();
      const windowMs = 60000; // 1 minute
      const maxRequests = 100;

      if (!rateLimitMap.has(clientId)) {
        rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs });
        return next();
      }

      const rateLimit = rateLimitMap.get(clientId);
      
      if (now > rateLimit.resetTime) {
        rateLimit.count = 1;
        rateLimit.resetTime = now + windowMs;
        return next();
      }

      if (rateLimit.count >= maxRequests) {
        return next(new Error('Rate limit exceeded'));
      }

      rateLimit.count++;
      next();
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}, User: ${socket.data.userId}`);
      
      // Track connection metrics
      this.trackConnection(socket);

      // Join user-specific room
      socket.join(`user:${socket.data.userId}`);

      // Handle board joining
      socket.on('join-board', async (boardId: string) => {
        try {
          // Verify user has access to board
          const hasAccess = await this.verifyBoardAccess(socket.data.userId, boardId);
          
          if (!hasAccess) {
            socket.emit('error', { message: 'Access denied to board' });
            return;
          }

          socket.join(`board:${boardId}`);
          socket.data.currentBoard = boardId;
          
          // Notify others in the board
          socket.to(`board:${boardId}`).emit('user-joined', {
            userId: socket.data.userId,
            boardId,
          });

          // Send current board state
          const boardState = await this.getBoardState(boardId);
          socket.emit('board-state', boardState);
        } catch (error) {
          console.error('Error joining board:', error);
          socket.emit('error', { message: 'Failed to join board' });
        }
      });

      // Handle canvas updates with conflict resolution
      socket.on('canvas-update', async (data) => {
        try {
          const { boardId, operation } = data;
          
          // Validate operation
          if (!this.validateOperation(operation)) {
            socket.emit('error', { message: 'Invalid operation' });
            return;
          }

          // Apply operation transformation if needed
          const transformedOp = await this.transformOperation(boardId, operation);
          
          // Broadcast to others in the board
          socket.to(`board:${boardId}`).emit('canvas-update', {
            operation: transformedOp,
            userId: socket.data.userId,
            timestamp: Date.now(),
          });

          // Store operation for persistence
          await this.storeOperation(boardId, transformedOp);
        } catch (error) {
          console.error('Error processing canvas update:', error);
          socket.emit('error', { message: 'Failed to process update' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`Client disconnected: ${socket.id}, Reason: ${reason}`);
        
        if (socket.data.currentBoard) {
          socket.to(`board:${socket.data.currentBoard}`).emit('user-left', {
            userId: socket.data.userId,
            boardId: socket.data.currentBoard,
          });
        }

        this.trackDisconnection(socket);
      });

      // Error handling
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  private setupScaling() {
    // Handle sticky sessions for scaling
    this.io.on('connection', (socket) => {
      // Store socket server ID for sticky routing
      socket.emit('server-id', process.env.INSTANCE_ID || 'default');
    });

    // Periodic health checks
    setInterval(() => {
      const metrics = {
        connections: this.io.sockets.sockets.size,
        rooms: this.io.sockets.adapter.rooms.size,
        timestamp: Date.now(),
      };
      
      // Publish metrics to Redis for monitoring
      this.pubClient.publish('socket-metrics', JSON.stringify(metrics));
    }, 30000);
  }

  // Helper methods
  private async verifyToken(token: string): Promise<string | null> {
    // Implement JWT verification
    // This should match your auth implementation
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded.userId;
    } catch {
      return null;
    }
  }

  private async verifyBoardAccess(userId: string, boardId: string): Promise<boolean> {
    // Check if user has access to board
    // Query database or cache
    return true; // Placeholder
  }

  private async getBoardState(boardId: string): Promise<any> {
    // Retrieve current board state from database/cache
    return {}; // Placeholder
  }

  private validateOperation(operation: any): boolean {
    // Validate operation structure and data
    return true; // Placeholder
  }

  private async transformOperation(boardId: string, operation: any): Promise<any> {
    // Apply operational transformation for conflict resolution
    return operation; // Placeholder
  }

  private async storeOperation(boardId: string, operation: any): Promise<void> {
    // Store operation in database for persistence
  }

  private trackConnection(socket: any): void {
    // Track connection metrics
  }

  private trackDisconnection(socket: any): void {
    // Track disconnection metrics
  }

  public getIO(): SocketIOServer {
    return this.io;
  }

  public async shutdown(): Promise<void> {
    console.log('Shutting down WebSocket server...');
    
    // Close all connections
    this.io.disconnectSockets(true);
    
    // Close Redis connections
    this.pubClient.disconnect();
    this.subClient.disconnect();
    
    // Close Socket.IO server
    await new Promise<void>((resolve) => {
      this.io.close(() => {
        console.log('WebSocket server shut down');
        resolve();
      });
    });
  }
}

// Export factory function
export function createProductionSocketServer(
  httpServer: HTTPServer,
  config: Partial<ProductionSocketConfig> = {}
): ProductionSocketServer {
  const defaultConfig: ProductionSocketConfig = {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    },
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    maxHttpBufferSize: 10 * 1024 * 1024, // 10 MB
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  };

  return new ProductionSocketServer(httpServer, { ...defaultConfig, ...config });
}