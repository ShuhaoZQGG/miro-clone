import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'
import { config } from '@/lib/config'
import { withDbConnection, handleDatabaseError } from '@/lib/db-utils'

interface LoginBody {
  email: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginBody = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user with password for verification
    let user: any
    try {
      user = await db.user.findUnique({ 
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          displayName: true,
          createdAt: true,
          updatedAt: true
        }
      })
    } catch (dbError: any) {
      console.error('Database error:', dbError)
      const { message, statusCode } = handleDatabaseError(dbError)
      return NextResponse.json(
        { success: false, error: message },
        { status: statusCode }
      )
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config().jwtSecret,
      { expiresIn: '7d' }
    )

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        success: true,
        data: {
          user: userWithoutPassword,
          token,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Login error:', error)
    const { message, statusCode } = handleDatabaseError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    )
  }
}