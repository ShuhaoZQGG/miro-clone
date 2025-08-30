import { NextRequest, NextResponse } from 'next/server'
import { sessionManager } from '@/server/lib/session-manager'

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (token) {
      // Validate and get session
      const session = await sessionManager.validateSession(token)
      
      if (session) {
        // Destroy the session
        sessionManager.destroySession(session.id)
      }
    }

    // Clear refresh token cookie
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    )

    response.cookies.delete('refresh_token')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}