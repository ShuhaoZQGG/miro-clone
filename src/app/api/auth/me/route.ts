import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get token from header
    const authorization = request.headers.get('authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authorization.substring(7)

    // Verify token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret')
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Find user
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}