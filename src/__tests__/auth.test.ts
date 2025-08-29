import { AuthService } from '@/lib/auth'
import { User, LoginForm, SignupForm } from '@/types'

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    authService = new AuthService()
    mockLocalStorage.clear()
    mockFetch.mockReset()
  })

  describe('User Registration', () => {
    it('should successfully register a new user with valid data', async () => {
      const signupForm: SignupForm = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        displayName: 'Test User',
        username: 'testuser'
      }

      const expectedUser: User = {
        id: '1',
        email: 'test@example.com',
        displayName: 'Test User',
        username: 'testuser',
        createdAt: '2025-08-29T02:30:00Z',
        updatedAt: '2025-08-29T02:30:00Z'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { user: expectedUser, token: 'jwt-token-123' }
        })
      })

      const result = await authService.signup(signupForm)

      expect(result.success).toBe(true)
      expect(result.data?.user).toEqual(expectedUser)
      expect(result.data?.token).toBe('jwt-token-123')
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm)
      })
    })

    it('should reject registration when passwords do not match', async () => {
      const signupForm: SignupForm = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'DifferentPassword!',
        displayName: 'Test User'
      }

      const result = await authService.signup(signupForm)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Passwords do not match')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should reject registration with invalid email format', async () => {
      const signupForm: SignupForm = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        displayName: 'Test User'
      }

      const result = await authService.signup(signupForm)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid email format')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should reject registration with weak password', async () => {
      const signupForm: SignupForm = {
        email: 'test@example.com',
        password: '123',
        confirmPassword: '123',
        displayName: 'Test User'
      }

      const result = await authService.signup(signupForm)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Password must be at least 8 characters')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle server errors during registration', async () => {
      const signupForm: SignupForm = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        displayName: 'Test User'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          error: 'Email already exists'
        })
      })

      const result = await authService.signup(signupForm)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email already exists')
    })
  })

  describe('User Login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginForm: LoginForm = {
        email: 'test@example.com',
        password: 'SecurePass123!'
      }

      const expectedUser: User = {
        id: '1',
        email: 'test@example.com',
        displayName: 'Test User',
        username: 'testuser',
        createdAt: '2025-08-29T02:30:00Z',
        updatedAt: '2025-08-29T02:30:00Z'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { user: expectedUser, token: 'jwt-token-123' }
        })
      })

      const result = await authService.login(loginForm)

      expect(result.success).toBe(true)
      expect(result.data?.user).toEqual(expectedUser)
      expect(result.data?.token).toBe('jwt-token-123')
      expect(mockLocalStorage.getItem('auth_token')).toBe('jwt-token-123')
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
    })

    it('should reject login with invalid credentials', async () => {
      const loginForm: LoginForm = {
        email: 'test@example.com',
        password: 'WrongPassword!'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: 'Invalid credentials'
        })
      })

      const result = await authService.login(loginForm)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
      expect(mockLocalStorage.getItem('auth_token')).toBeNull()
    })

    it('should validate email format before login', async () => {
      const loginForm: LoginForm = {
        email: 'invalid-email',
        password: 'SecurePass123!'
      }

      const result = await authService.login(loginForm)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid email format')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle network errors during login', async () => {
      const loginForm: LoginForm = {
        email: 'test@example.com',
        password: 'SecurePass123!'
      }

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await authService.login(loginForm)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })
  })

  describe('User Logout', () => {
    it('should successfully logout and clear stored tokens', () => {
      mockLocalStorage.setItem('auth_token', 'jwt-token-123')
      mockLocalStorage.setItem('refresh_token', 'refresh-token-123')

      authService.logout()

      expect(mockLocalStorage.getItem('auth_token')).toBeNull()
      expect(mockLocalStorage.getItem('refresh_token')).toBeNull()
    })
  })

  describe('Token Management', () => {
    it('should retrieve stored auth token', () => {
      mockLocalStorage.setItem('auth_token', 'jwt-token-123')

      const token = authService.getToken()

      expect(token).toBe('jwt-token-123')
    })

    it('should return null when no token is stored', () => {
      const token = authService.getToken()

      expect(token).toBeNull()
    })

    it('should validate token format', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const invalidToken = 'invalid-token'

      expect(authService.isValidTokenFormat(validToken)).toBe(true)
      expect(authService.isValidTokenFormat(invalidToken)).toBe(false)
      expect(authService.isValidTokenFormat('')).toBe(false)
      expect(authService.isValidTokenFormat(null)).toBe(false)
    })

    it('should check if user is authenticated', () => {
      expect(authService.isAuthenticated()).toBe(false)

      mockLocalStorage.setItem('auth_token', 'jwt-token-123')
      expect(authService.isAuthenticated()).toBe(true)

      mockLocalStorage.removeItem('auth_token')
      expect(authService.isAuthenticated()).toBe(false)
    })
  })

  describe('User Profile', () => {
    it('should fetch current user profile with valid token', async () => {
      const expectedUser: User = {
        id: '1',
        email: 'test@example.com',
        displayName: 'Test User',
        username: 'testuser',
        createdAt: '2025-08-29T02:30:00Z',
        updatedAt: '2025-08-29T02:30:00Z'
      }

      mockLocalStorage.setItem('auth_token', 'jwt-token-123')
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: expectedUser
        })
      })

      const result = await authService.getCurrentUser()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(expectedUser)
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer jwt-token-123'
        }
      })
    })

    it('should return error when no token is available', async () => {
      const result = await authService.getCurrentUser()

      expect(result.success).toBe(false)
      expect(result.error).toContain('No authentication token')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle expired token', async () => {
      mockLocalStorage.setItem('auth_token', 'expired-token')
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: 'Token expired'
        })
      })

      const result = await authService.getCurrentUser()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Token expired')
      expect(mockLocalStorage.getItem('auth_token')).toBeNull() // Should clear invalid token
    })
  })

  describe('OAuth Integration', () => {
    it('should initiate Google OAuth flow', () => {
      const originalLocation = window.location
      delete (window as any).location
      window.location = { href: '' } as any

      authService.initiateGoogleOAuth()

      expect(window.location.href).toContain('https://accounts.google.com/oauth/authorize')
      expect(window.location.href).toContain('client_id=')
      expect(window.location.href).toContain('redirect_uri=')
      expect(window.location.href).toContain('scope=email+profile')

      window.location = originalLocation as any
    })

    it('should handle OAuth callback with authorization code', async () => {
      const authCode = 'oauth-auth-code'
      const expectedUser: User = {
        id: '1',
        email: 'test@gmail.com',
        displayName: 'Test User',
        avatarUrl: 'https://lh3.googleusercontent.com/avatar.jpg',
        createdAt: '2025-08-29T02:30:00Z',
        updatedAt: '2025-08-29T02:30:00Z'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { user: expectedUser, token: 'jwt-token-123' }
        })
      })

      const result = await authService.handleOAuthCallback('google', authCode)

      expect(result.success).toBe(true)
      expect(result.data?.user).toEqual(expectedUser)
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/oauth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authCode })
      })
    })
  })

  describe('Password Reset', () => {
    it('should send password reset email', async () => {
      const email = 'test@example.com'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Password reset email sent'
        })
      })

      const result = await authService.requestPasswordReset(email)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Password reset email sent')
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
    })

    it('should reset password with valid token', async () => {
      const token = 'reset-token-123'
      const newPassword = 'NewSecurePass123!'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Password reset successfully'
        })
      })

      const result = await authService.resetPassword(token, newPassword)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Password reset successfully')
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword })
      })
    })
  })
})