import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthSocket extends Socket {
  userId?: string;
  user?: any;
}

export async function authenticateSocket(socket: AuthSocket, next: (err?: Error) => void) {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret-change-in-production';
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    socket.userId = decoded.userId;
    socket.user = decoded;
    
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
}