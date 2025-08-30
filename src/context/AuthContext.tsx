'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  displayName: string
  avatarColor: string
  createdAt: Date
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const generateAvatarColor = () => {
  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', 
    '#F59E0B', '#10B981', '#14B8A6', '#6366F1'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('miro-clone-user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser({
          ...userData,
          createdAt: new Date(userData.createdAt)
        })
      } catch (error) {
        console.error('Failed to parse stored user data:', error)
        localStorage.removeItem('miro-clone-user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    // In a real app, this would call an API
    // For now, we'll simulate authentication
    
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Create mock user
    const mockUser: User = {
      id: `user-${Date.now()}`,
      email,
      displayName: email.split('@')[0],
      avatarColor: generateAvatarColor(),
      createdAt: new Date()
    }

    setUser(mockUser)
    localStorage.setItem('miro-clone-user', JSON.stringify(mockUser))
  }

  const signup = async (email: string, password: string, displayName: string) => {
    // In a real app, this would call an API
    if (!email || !password || !displayName) {
      throw new Error('All fields are required')
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Create new user
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      displayName,
      avatarColor: generateAvatarColor(),
      createdAt: new Date()
    }

    setUser(newUser)
    localStorage.setItem('miro-clone-user', JSON.stringify(newUser))
  }

  const logout = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200))
    
    setUser(null)
    localStorage.removeItem('miro-clone-user')
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in')
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))

    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)
    localStorage.setItem('miro-clone-user', JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}