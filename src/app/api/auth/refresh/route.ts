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

    const { accessToken, refreshToken: newRefreshToken, user } = result

    const response = NextResponse.json(
      {
        success: true,
        data: {
          token: accessToken,
          user: user
        }
      },
      { status: 200 }
    )

    // Update the refresh token cookie
    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}