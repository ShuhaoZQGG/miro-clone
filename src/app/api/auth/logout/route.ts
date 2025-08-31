import { NextRequest, NextResponse } from 'next/server'
import { sessionManager } from '@/server/lib/session-manager'

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (token) {
      // Validate the access token
      const session = sessionManager.verifyAccessToken(token)
      
      // In a real app, you would invalidate the session in the database here
      // For now, we just proceed to clear the cookies
    }

    // Clear refresh token cookie
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    )

    response.cookies.delete('refresh_token')
    response.cookies.delete('access_token')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}