import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'
import { config } from '@/lib/config'
import { withDbConnection, handleDatabaseError } from '@/lib/db-utils'

interface SignupBody {
  email: string
  password: string
  confirmPassword: string
  displayName: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupBody = await request.json()
    const { email, password, confirmPassword, displayName } = body

    // Validate input
    if (!email || !password || !confirmPassword || !displayName) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await withDbConnection(
      () => db.user.findUnique({ where: { email } })
    )

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await withDbConnection(
      () => db.user.create({
        data: {
          email,
          password: hashedPassword,
          displayName,
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          createdAt: true,
        },
      })
    )

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config().jwtSecret,
      { expiresIn: '7d' }
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          user,
          token,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Signup error:', error)
    const { message, statusCode } = handleDatabaseError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    )
  }
}