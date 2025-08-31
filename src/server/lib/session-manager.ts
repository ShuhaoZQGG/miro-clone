import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

interface SessionPayload {
  userId: string
  email: string
  displayName: string
}

interface RefreshPayload {
  userId: string
  type: 'refresh'
}

class SessionManager {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key'
  private readonly ACCESS_TOKEN_EXPIRY = '15m'
  private readonly REFRESH_TOKEN_EXPIRY = '7d'

  generateAccessToken(payload: SessionPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    })
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      this.JWT_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    )
  }

  verifyAccessToken(token: string): SessionPayload | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as SessionPayload
    } catch {
      return null
    }
  }

  verifyRefreshToken(token: string): RefreshPayload | null {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as RefreshPayload
      if (payload.type !== 'refresh') {
        return null
      }
      return payload
    } catch {
      return null
    }
  }

  setSessionCookies(response: NextResponse, accessToken: string, refreshToken: string) {
    // Set access token cookie
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    })

    // Set refresh token cookie
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })
  }

  clearSessionCookies(response: NextResponse) {
    response.cookies.delete('access_token')
    response.cookies.delete('refresh_token')
  }

  async getSessionFromCookies(): Promise<SessionPayload | null> {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return null
    }

    return this.verifyAccessToken(accessToken)
  }

  async createSession(
    userId: string, 
    email: string, 
    displayName: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<{
    session: SessionPayload
    accessToken: string
    refreshToken: string
  }> {
    const session: SessionPayload = {
      userId,
      email,
      displayName,
    }

    const accessToken = this.generateAccessToken(session)
    const refreshToken = this.generateRefreshToken(userId)

    // In production, you would store session metadata in database
    
    return {
      session,
      accessToken,
      refreshToken,
    }
  }

  async refreshSession(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string
    user: SessionPayload
  } | null> {
    const payload = this.verifyRefreshToken(refreshToken)
    
    if (!payload) {
      return null
    }

    // In a real app, you would fetch the user from the database here
    // For now, we'll create a mock user payload
    const userPayload: SessionPayload = {
      userId: payload.userId,
      email: 'user@example.com', // This should come from DB
      displayName: 'User', // This should come from DB
    }

    const newAccessToken = this.generateAccessToken(userPayload)
    const newRefreshToken = this.generateRefreshToken(payload.userId)

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: userPayload,
    }
  }
}

export const sessionManager = new SessionManager()