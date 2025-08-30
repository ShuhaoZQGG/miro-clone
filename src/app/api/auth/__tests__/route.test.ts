/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import * as authRoutes from '../login/route'
import * as signupRoutes from '../signup/route'
import * as meRoutes from '../me/route'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}))

describe('Auth API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret'
  })

  describe('POST /api/auth/signup', () => {
    it('should create a new user with hashed password', async () => {
      const mockHashedPassword = 'hashed-password-123'
      const mockToken = 'jwt-token-123'
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: new Date(),
      }

      ;(bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword)
      ;(jwt.sign as jest.Mock).mockReturnValue(mockToken)

      const { db } = require('@/lib/db')
      db.user.findUnique.mockResolvedValue(null)
      db.user.create.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test123!@#',
          confirmPassword: 'Test123!@#',
          displayName: 'Test User',
        }),
      })

      const response = await signupRoutes.POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.user.email).toBe('test@example.com')
      expect(data.data.token).toBe(mockToken)
      expect(bcrypt.hash).toHaveBeenCalledWith('Test123!@#', 10)
    })

    it('should reject duplicate email', async () => {
      const { db } = require('@/lib/db')
      db.user.findUnique.mockResolvedValue({ id: '1', email: 'test@example.com' })

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test123!@#',
          confirmPassword: 'Test123!@#',
          displayName: 'Test User',
        }),
      })

      const response = await signupRoutes.POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('already exists')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should authenticate user with correct password', async () => {
      const mockToken = 'jwt-token-456'
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed-password',
        displayName: 'Test User',
      }

      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(jwt.sign as jest.Mock).mockReturnValue(mockToken)

      const { db } = require('@/lib/db')
      db.user.findUnique.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test123!@#',
        }),
      })

      const response = await authRoutes.POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.token).toBe(mockToken)
      expect(bcrypt.compare).toHaveBeenCalledWith('Test123!@#', 'hashed-password')
    })

    it('should reject invalid password', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed-password',
        displayName: 'Test User',
      }

      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const { db } = require('@/lib/db')
      db.user.findUnique.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'WrongPassword',
        }),
      })

      const response = await authRoutes.POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid')
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        displayName: 'Test User',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({ userId: '1' })

      const { db } = require('@/lib/db')
      db.user.findUnique.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: {
          authorization: 'Bearer jwt-token-123',
        },
      })

      const response = await meRoutes.GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.email).toBe('test@example.com')
    })

    it('should reject invalid token', async () => {
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      })

      const response = await meRoutes.GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid token')
    })
  })
})