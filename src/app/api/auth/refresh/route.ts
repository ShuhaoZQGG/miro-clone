import { NextRequest, NextResponse } from 'next/server'
import { sessionManager } from '@/server/lib/session-manager'

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refresh_token')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'No refresh token provided' },
        { status: 401 }
      )
    }

    // Refresh the session
    const result = await sessionManager.refreshSession(refreshToken)

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired refresh token' },
        { status: 401 }
      )
    }

    const { accessToken, session } = result

    return NextResponse.json(
      {
        success: true,
        data: {
          token: accessToken,
          sessionId: session.id,
          expiresAt: session.expiresAt
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}