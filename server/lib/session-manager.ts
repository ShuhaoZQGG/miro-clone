/**
 * Session Management System
 * Handles user sessions, authentication state, and session lifecycle
 */

import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';

export interface Session {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
  refreshToken?: string;
}

export interface SessionToken {
  sessionId: string;
  userId: string;
  email: string;
  exp: number;
  iat: number;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly REFRESH_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';

  /**
   * Create a new session for a user
   */
  async createSession(
    userId: string,
    email: string,
    displayName: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<{ session: Session; accessToken: string; refreshToken: string }> {
    const sessionId = this.generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_DURATION);
    
    // Create refresh token
    const refreshToken = this.generateRefreshToken();
    
    const session: Session = {
      id: sessionId,
      userId,
      email,
      displayName,
      createdAt: now,
      expiresAt,
      lastActivity: now,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      refreshToken
    };

    // Store session
    this.sessions.set(sessionId, session);
    
    // Track user sessions
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(sessionId);

    // Generate JWT access token
    const accessToken = this.generateAccessToken(session);

    // Clean up expired sessions periodically
    this.cleanupExpiredSessions();

    return { session, accessToken, refreshToken };
  }

  /**
   * Validate and get session from token
   */
  async validateSession(token: string): Promise<Session | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as SessionToken;
      const session = this.sessions.get(decoded.sessionId);

      if (!session) {
        return null;
      }

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        this.destroySession(session.id);
        return null;
      }

      // Update last activity
      session.lastActivity = new Date();
      this.sessions.set(session.id, session);

      return session;
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  /**
   * Refresh session with refresh token
   */
  async refreshSession(
    refreshToken: string
  ): Promise<{ accessToken: string; session: Session } | null> {
    // Find session by refresh token
    const session = Array.from(this.sessions.values()).find(
      s => s.refreshToken === refreshToken
    );

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (new Date() > session.expiresAt) {
      this.destroySession(session.id);
      return null;
    }

    // Extend session
    session.expiresAt = new Date(Date.now() + this.SESSION_DURATION);
    session.lastActivity = new Date();
    this.sessions.set(session.id, session);

    // Generate new access token
    const accessToken = this.generateAccessToken(session);

    return { accessToken, session };
  }

  /**
   * Destroy a session
   */
  destroySession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      
      // Remove from user sessions
      const userSessions = this.userSessions.get(session.userId);
      if (userSessions) {
        userSessions.delete(sessionId);
        if (userSessions.size === 0) {
          this.userSessions.delete(session.userId);
        }
      }
    }
  }

  /**
   * Destroy all sessions for a user
   */
  destroyUserSessions(userId: string): void {
    const sessionIds = this.userSessions.get(userId);
    if (sessionIds) {
      sessionIds.forEach(sessionId => {
        this.sessions.delete(sessionId);
      });
      this.userSessions.delete(userId);
    }
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: string): Session[] {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds) return [];

    return Array.from(sessionIds)
      .map(id => this.sessions.get(id))
      .filter(Boolean) as Session[];
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Update session activity
   */
  updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      this.sessions.set(sessionId, session);
    }
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    this.sessions.forEach((session, id) => {
      if (now > session.expiresAt) {
        expiredSessions.push(id);
      }
    });

    expiredSessions.forEach(id => this.destroySession(id));
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return createHash('sha256')
      .update(timestamp + random)
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return createHash('sha256')
      .update(timestamp + random + 'refresh')
      .digest('hex');
  }

  /**
   * Generate JWT access token
   */
  private generateAccessToken(session: Session): string {
    const payload: SessionToken = {
      sessionId: session.id,
      userId: session.userId,
      email: session.email,
      exp: Math.floor(session.expiresAt.getTime() / 1000),
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, this.JWT_SECRET);
  }

  /**
   * Get session statistics
   */
  getStatistics(): {
    totalSessions: number;
    totalUsers: number;
    sessionsPerUser: Map<string, number>;
  } {
    const sessionsPerUser = new Map<string, number>();
    
    this.userSessions.forEach((sessions, userId) => {
      sessionsPerUser.set(userId, sessions.size);
    });

    return {
      totalSessions: this.sessions.size,
      totalUsers: this.userSessions.size,
      sessionsPerUser
    };
  }

  /**
   * Clear all sessions (for testing)
   */
  clearAllSessions(): void {
    this.sessions.clear();
    this.userSessions.clear();
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

// Cleanup expired sessions every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const stats = sessionManager.getStatistics();
    console.log(`Session cleanup: ${stats.totalSessions} active sessions for ${stats.totalUsers} users`);
  }, 60 * 60 * 1000);
}