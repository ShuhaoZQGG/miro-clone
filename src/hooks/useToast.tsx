'use client'

import { useState, useCallback } from 'react'
import { ToastProps, ToastType } from '@/components/ui/Toast'

export interface UseToastReturn {
  toasts: ToastProps[]
  showToast: (options: Omit<ToastProps, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const showToast = useCallback((options: Omit<ToastProps, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const toast: ToastProps = {
      id,
      ...options
    }
    setToasts((prev) => [...prev, toast])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    showToast,
    removeToast,
    clearToasts
  }
}

export const createToastHelpers = (showToast: UseToastReturn['showToast']) => ({
  success: (title: string, message?: string) => 
    showToast({ type: 'success', title, message }),
  error: (title: string, message?: string) => 
    showToast({ type: 'error', title, message }),
  info: (title: string, message?: string) => 
    showToast({ type: 'info', title, message }),
  warning: (title: string, message?: string) => 
    showToast({ type: 'warning', title, message })
})