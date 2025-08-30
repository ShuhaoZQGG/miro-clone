import { Server, Socket } from 'socket.io';

interface CollaborationSocket extends Socket {
  userId?: string;
  boardId?: string;
  user?: any;
}

export function setupCollaborationHandlers(io: Server) {
  io.on('connection', (socket: CollaborationSocket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle joining a board
    socket.on('board:join', async (data: { boardId: string }) => {
      const { boardId } = data;
      socket.boardId = boardId;
      
      // Join the board room
      await socket.join(boardId);
      
      // Notify others in the room
      socket.to(boardId).emit('user:joined', {
        userId: socket.userId,
        socketId: socket.id,
        timestamp: Date.now(),
      });

      console.log(`User ${socket.userId} joined board ${boardId}`);
    });

    // Handle cursor movement
    socket.on('cursor:move', (data: { x: number; y: number; boardId: string }) => {
      if (!socket.boardId) return;
      
      socket.to(socket.boardId).emit('cursor:update', {
        userId: socket.userId,
        socketId: socket.id,
        x: data.x,
        y: data.y,
        timestamp: Date.now(),
      });
    });

    // Handle canvas operations
    socket.on('canvas:operation', (data: any) => {
      if (!socket.boardId) return;
      
      // Broadcast to all other users in the same board
      socket.to(socket.boardId).emit('canvas:update', {
        userId: socket.userId,
        operation: data,
        timestamp: Date.now(),
      });
    });

    // Handle element creation
    socket.on('element:create', (data: any) => {
      if (!socket.boardId) return;
      
      socket.to(socket.boardId).emit('element:created', {
        userId: socket.userId,
        element: data,
        timestamp: Date.now(),
      });
    });

    // Handle element updates
    socket.on('element:update', (data: any) => {
      if (!socket.boardId) return;
      
      socket.to(socket.boardId).emit('element:updated', {
        userId: socket.userId,
        elementId: data.id,
        updates: data.updates,
        timestamp: Date.now(),
      });
    });

    // Handle element deletion
    socket.on('element:delete', (data: { elementId: string }) => {
      if (!socket.boardId) return;
      
      socket.to(socket.boardId).emit('element:deleted', {
        userId: socket.userId,
        elementId: data.elementId,
        timestamp: Date.now(),
      });
    });

    // Handle user presence
    socket.on('presence:update', (data: any) => {
      if (!socket.boardId) return;
      
      socket.to(socket.boardId).emit('presence:updated', {
        userId: socket.userId,
        presence: data,
        timestamp: Date.now(),
      });
    });

    // Handle leaving a board
    socket.on('board:leave', () => {
      if (!socket.boardId) return;
      
      const boardId = socket.boardId;
      socket.leave(boardId);
      
      // Notify others
      socket.to(boardId).emit('user:left', {
        userId: socket.userId,
        socketId: socket.id,
        timestamp: Date.now(),
      });
      
      socket.boardId = undefined;
      console.log(`User ${socket.userId} left board ${boardId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (socket.boardId) {
        socket.to(socket.boardId).emit('user:disconnected', {
          userId: socket.userId,
          socketId: socket.id,
          timestamp: Date.now(),
        });
      }
      
      console.log(`User disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });
}