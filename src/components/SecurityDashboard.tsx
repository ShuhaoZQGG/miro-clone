'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { Button } from './ui/Button'
import { MFASetup } from './MFASetup'
import { 
  Shield, 
  Smartphone, 
  Key, 
  Monitor, 
  MapPin, 
  Clock, 
  AlertCircle,
  Check,
  X,
  ChevronRight
} from 'lucide-react'
import { clsx } from 'clsx'

interface Session {
  id: string
  device: string
  browser: string
  location: string
  ip: string
  lastActive: Date
  current: boolean
}

export const SecurityDashboard: React.FC = () => {
  const { user } = useAuth()
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [showMFASetup, setShowMFASetup] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSecurityStatus()
    loadActiveSessions()
  }, [])

  const loadSecurityStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check MFA status from user metadata
        setMfaEnabled(user.app_metadata?.mfa_enabled || false)
      }
    } catch (error) {
      console.error('Failed to load security status:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadActiveSessions = () => {
    // Mock data for demonstration - in production, fetch from backend
    setSessions([
      {
        id: '1',
        device: 'MacBook Pro',
        browser: 'Chrome 120',
        location: 'San Francisco, CA',
        ip: '192.168.1.1',
        lastActive: new Date(),
        current: true
      },
      {
        id: '2',
        device: 'iPhone 14',
        browser: 'Safari',
        location: 'San Francisco, CA',
        ip: '192.168.1.2',
        lastActive: new Date(Date.now() - 3600000),
        current: false
      }
    ])
  }

  const handleRevokeSession = async (sessionId: string) => {
    // Implement session revocation
    setSessions(sessions.filter(s => s.id !== sessionId))
  }

  const handleMFASuccess = () => {
    setMfaEnabled(true)
    setShowMFASetup(false)
  }

  const formatLastActive = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} minutes ago`
    if (hours < 24) return `${hours} hours ago`
    return `${days} days ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Security Overview */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Shield className="w-7 h-7 text-blue-600" />
          Security Settings
        </h2>

        {/* Security Score */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold">Security Score</span>
            <span className="text-3xl font-bold text-blue-600">
              {mfaEnabled ? '85%' : '60%'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={clsx(
                'h-2 rounded-full transition-all duration-500',
                mfaEnabled ? 'bg-blue-600 w-5/6' : 'bg-yellow-500 w-3/5'
              )}
            />
          </div>
          {!mfaEnabled && (
            <p className="mt-2 text-sm text-gray-600">
              Enable two-factor authentication to improve your security score
            </p>
          )}
        </div>

        {/* Two-Factor Authentication */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-gray-600" />
              <div>
                <h3 className="font-semibold">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-600">
                  Add an extra layer of security to your account
                </p>
              </div>
            </div>
            {mfaEnabled ? (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-semibold">Enabled</span>
              </div>
            ) : (
              <Button
                onClick={() => setShowMFASetup(true)}
                variant="primary"
                size="sm"
              >
                Enable
              </Button>
            )}
          </div>
        </div>

        {/* Password */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-gray-600" />
              <div>
                <h3 className="font-semibold">Password</h3>
                <p className="text-sm text-gray-600">
                  Last changed 30 days ago
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </div>
        </div>

        {/* Security Recommendations */}
        {!mfaEnabled && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-800">Recommended Actions</p>
                <ul className="mt-1 text-sm text-yellow-700 space-y-1">
                  <li>• Enable two-factor authentication for enhanced security</li>
                  <li>• Review and remove unused active sessions</li>
                  <li>• Use a strong, unique password</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Active Sessions</h2>
        <p className="text-sm text-gray-600 mb-4">
          These devices are currently signed in to your account
        </p>

        <div className="space-y-3">
          {sessions.map((session) => (
            <div 
              key={session.id}
              className={clsx(
                'border rounded-lg p-4',
                session.current && 'border-blue-500 bg-blue-50'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{session.device}</h4>
                      {session.current && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {session.browser} • {session.location}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {session.ip}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatLastActive(session.lastActive)}
                      </span>
                    </div>
                  </div>
                </div>
                {!session.current && (
                  <Button
                    onClick={() => handleRevokeSession(session.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                  >
                    Revoke
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Activity */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Recent Security Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <div>
                <p className="font-medium">Successful login</p>
                <p className="text-sm text-gray-600">Chrome on MacBook Pro</p>
              </div>
            </div>
            <span className="text-sm text-gray-500">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <div>
                <p className="font-medium">Password changed</p>
                <p className="text-sm text-gray-600">Security settings</p>
              </div>
            </div>
            <span className="text-sm text-gray-500">30 days ago</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <div>
                <p className="font-medium">New device login</p>
                <p className="text-sm text-gray-600">Safari on iPhone</p>
              </div>
            </div>
            <span className="text-sm text-gray-500">2 days ago</span>
          </div>
        </div>
      </div>

      {/* MFA Setup Modal */}
      <MFASetup 
        isOpen={showMFASetup}
        onClose={() => setShowMFASetup(false)}
        onSuccess={handleMFASuccess}
      />
    </div>
  )
}

export default SecurityDashboard