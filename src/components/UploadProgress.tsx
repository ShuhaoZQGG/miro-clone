'use client'

import React from 'react'
import { clsx } from 'clsx'
import { LoadingSpinner } from './ui/LoadingSpinner'

interface UploadProgressProps {
  isUploading: boolean
  progress?: number
  fileName?: string
  message?: string
  className?: string
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  isUploading,
  progress = 0,
  fileName,
  message = 'Uploading...',
  className
}) => {
  if (!isUploading) return null

  return (
    <div 
      className={clsx(
        'fixed bottom-20 right-4 bg-white rounded-lg shadow-xl p-4 z-50',
        'min-w-[280px] max-w-[400px]',
        'border border-gray-200',
        'transition-all duration-300 ease-out',
        'transform translate-y-0 opacity-100',
        className
      )}
      data-testid="upload-progress"
    >
      <div className="flex items-start space-x-3">
        <LoadingSpinner size="sm" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{message}</p>
          {fileName && (
            <p className="text-xs text-gray-500 mt-1 truncate">{fileName}</p>
          )}
          
          {progress > 0 && (
            <div className="mt-2">
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, progress)}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const MultipleUploadProgress: React.FC<{
  uploads: Array<{
    id: string
    fileName: string
    progress: number
    status: 'pending' | 'uploading' | 'completed' | 'error'
    error?: string
  }>
  onDismiss?: () => void
}> = ({ uploads, onDismiss }) => {
  if (uploads.length === 0) return null

  const activeUploads = uploads.filter(u => u.status === 'uploading' || u.status === 'pending')
  const completedUploads = uploads.filter(u => u.status === 'completed')
  const errorUploads = uploads.filter(u => u.status === 'error')

  return (
    <div className="fixed bottom-20 right-4 bg-white rounded-lg shadow-xl p-4 z-50 min-w-[320px] max-w-[480px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Uploading {uploads.length} file{uploads.length > 1 ? 's' : ''}
        </h3>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {uploads.map(upload => (
          <div key={upload.id} className="flex items-center space-x-2">
            {upload.status === 'uploading' && <LoadingSpinner size="xs" />}
            {upload.status === 'completed' && (
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {upload.status === 'error' && (
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {upload.status === 'pending' && (
              <div className="w-4 h-4 rounded-full bg-gray-300" />
            )}
            
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700 truncate">{upload.fileName}</p>
              {upload.status === 'uploading' && (
                <div className="mt-1 bg-gray-200 rounded-full h-1 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
              {upload.error && (
                <p className="text-xs text-red-500 mt-1">{upload.error}</p>
              )}
            </div>
            
            {upload.status === 'uploading' && (
              <span className="text-xs text-gray-500">{upload.progress}%</span>
            )}
          </div>
        ))}
      </div>

      {(completedUploads.length > 0 || errorUploads.length > 0) && (
        <div className="mt-3 pt-3 border-t text-xs text-gray-500">
          {completedUploads.length > 0 && (
            <span className="text-green-600">{completedUploads.length} completed</span>
          )}
          {completedUploads.length > 0 && errorUploads.length > 0 && <span className="mx-2">•</span>}
          {errorUploads.length > 0 && (
            <span className="text-red-600">{errorUploads.length} failed</span>
          )}
        </div>
      )}
    </div>
  )
}