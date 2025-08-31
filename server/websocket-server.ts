import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { authenticateSocket } from './middleware/authMiddleware';
import { setupCollaborationHandlers } from './handlers/collaborationHandlers';

let io: SocketIOServer | undefined;

export function initializeSocketServer(httpServer: HTTPServer) {
  if (process.env.NODE_ENV === 'development' && !io) {
    io = new SocketIOServer(httpServer, {
      path: '/socket.io/',
      cors: {
        origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true,
      },
    });

    io.use(authenticateSocket);
    setupCollaborationHandlers(io);

    console.log('Socket.IO server initialized');
  }
  return io;
}

export function getSocketServer() {
  return io;
}