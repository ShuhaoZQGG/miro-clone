'use client'

import React, { useState } from 'react'
import { Button } from './ui/Button'
import { clsx } from 'clsx'

interface CollaborationToolbarProps {
  isConnected: boolean
  userCount: number
  onInvite?: () => void
  onShare?: () => void
  onFollow?: (userId: string) => void
  className?: string
}

export const CollaborationToolbar: React.FC<CollaborationToolbarProps> = ({
  isConnected,
  userCount,
  onInvite,
  onShare,
  onFollow,
  className
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const handleShare = () => {
    setShowShareMenu(!showShareMenu)
    onShare?.()
  }

  return (
    <div className={clsx('bg-white rounded-lg shadow-md border p-2', className)}>
      <div className="flex items-center gap-2">
        {/* Connection Status */}
        <div className="flex items-center gap-2 px-3 py-1">
          <div
            className={clsx(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            )}
          />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* User Count */}
        <div className="flex items-center gap-1 px-3 py-1 bg-gray-50 rounded">
          <svg
            className="w-4 h-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <span className="text-sm font-medium text-gray-700">{userCount}</span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300" />

        {/* Follow Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFollow?.('current-presenter')}
          className="flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          Follow
        </Button>

        {/* Invite Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onInvite}
          className="flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          Invite
        </Button>

        {/* Share Button */}
        <div className="relative">
          <Button
            variant="primary"
            size="sm"
            onClick={handleShare}
            className="flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-2.684-2.684m0 0a3 3 0 00-2.684 2.684M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Share
          </Button>

          {/* Share Menu */}
          {showShareMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border p-3 z-50">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Share this board
                </div>
                
                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  {copiedLink ? 'Link copied!' : 'Copy link'}
                </button>

                {/* Email Invite */}
                <button
                  onClick={() => {
                    setShowShareMenu(false)
                    onInvite?.()
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Invite via email
                </button>

                {/* Permissions */}
                <div className="pt-2 mt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Anyone with link can</span>
                    <select className="px-2 py-1 border rounded text-sm">
                      <option>View</option>
                      <option>Edit</option>
                      <option>Comment</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}