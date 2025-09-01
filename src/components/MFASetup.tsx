'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { Button } from './ui/Button'
import { Shield, Smartphone, Key, Copy, Check, X } from 'lucide-react'
import { clsx } from 'clsx'
import QRCode from 'qrcode'

interface MFASetupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const MFASetup: React.FC<MFASetupProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth()
  const [step, setStep] = useState<'choice' | 'totp-setup' | 'sms-setup' | 'verify' | 'backup'>('choice')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [secret, setSecret] = useState<string>('')
  const [verificationCode, setVerificationCode] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && step === 'totp-setup') {
      setupTOTP()
    }
  }, [isOpen, step])

  const setupTOTP = async () => {
    setLoading(true)
    setError(null)
    try {
      // Generate TOTP secret
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      })

      if (error) throw error

      if (data) {
        setSecret(data.totp?.secret || '')
        // Generate QR code
        const otpauth = `otpauth://totp/MiroClone:${user?.email}?secret=${data.totp?.secret}&issuer=MiroClone`
        const qr = await QRCode.toDataURL(otpauth)
        setQrCodeUrl(qr)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to setup TOTP')
    } finally {
      setLoading(false)
    }
  }

  const setupSMS = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'phone',
        phone: phoneNumber
      })

      if (error) throw error
      
      setStep('verify')
    } catch (err: any) {
      setError(err.message || 'Failed to setup SMS')
    } finally {
      setLoading(false)
    }
  }

  const verifyMFA = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: 'totp' // This would be dynamic based on setup type
      })

      if (error) throw error

      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: 'totp',
        challengeId: data?.id || '',
        code: verificationCode
      })

      if (verifyError) throw verifyError

      // Generate backup codes
      generateBackupCodes()
      setStep('backup')
    } catch (err: any) {
      setError(err.message || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  const generateBackupCodes = () => {
    const codes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    )
    setBackupCodes(codes)
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleComplete = () => {
    onSuccess?.()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold">Two-Factor Authentication</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close MFA setup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {step === 'choice' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Choose your preferred two-factor authentication method:
              </p>
              
              <button
                onClick={() => setStep('totp-setup')}
                className="w-full p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold">Authenticator App</h3>
                    <p className="text-sm text-gray-600">
                      Use Google Authenticator, Authy, or similar
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setStep('sms-setup')}
                className="w-full p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold">SMS Text Message</h3>
                    <p className="text-sm text-gray-600">
                      Receive codes via SMS to your phone
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {step === 'totp-setup' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Scan this QR code with your authenticator app:
              </p>
              
              {qrCodeUrl && (
                <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                  <img src={qrCodeUrl} alt="MFA QR Code" className="w-48 h-48" />
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-gray-600">Or enter this code manually:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-xs break-all">
                    {secret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(secret, -1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {copiedIndex === -1 ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                onClick={() => setStep('verify')}
                className="w-full"
                disabled={loading}
              >
                Continue to Verification
              </Button>
            </div>
          )}

          {step === 'sms-setup' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Enter your phone number to receive verification codes:
              </p>
              
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 234 567 8900"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <Button
                onClick={setupSMS}
                className="w-full"
                disabled={loading || !phoneNumber}
              >
                Send Verification Code
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Enter the 6-digit code from your authenticator app:
              </p>
              
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full p-3 text-center text-2xl font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <Button
                onClick={verifyMFA}
                className="w-full"
                disabled={loading || verificationCode.length !== 6}
              >
                Verify and Enable 2FA
              </Button>
            </div>
          )}

          {step === 'backup' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-semibold">2FA Successfully Enabled!</span>
              </div>

              <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                <p className="font-semibold mb-1">Important:</p>
                <p>Save these backup codes in a secure place. You can use them to access your account if you lose your authenticator device.</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">Backup Codes:</p>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <code className="flex-1 p-2 bg-gray-100 rounded text-xs font-mono">
                        {code}
                      </code>
                      <button
                        onClick={() => copyToClipboard(code, index)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleComplete}
                className="w-full"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MFASetup