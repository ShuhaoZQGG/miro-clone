'use client'

import React, { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { XIcon, CheckCircleIcon, XCircleIcon, InfoIcon, AlertCircleIcon } from './Icons'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastProps {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  onClose?: (id: string) => void
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.(id)
    }, 300)
  }

  if (!isVisible) return null

  const icons = {
    success: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
    error: <XCircleIcon className="w-5 h-5 text-red-500" />,
    info: <InfoIcon className="w-5 h-5 text-blue-500" />,
    warning: <AlertCircleIcon className="w-5 h-5 text-yellow-500" />
  }

  const styles = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200'
  }

  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300',
        styles[type],
        isLeaving ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      )}
      role="alert"
      aria-live="polite"
    >
      {icons[type]}
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {message && (
          <p className="mt-1 text-sm text-gray-600">{message}</p>
        )}
      </div>
      <button
        onClick={handleClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close notification"
      >
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  )
}