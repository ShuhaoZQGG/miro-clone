import React from 'react'
import { cn } from '@/lib/utils'

interface ConnectionStatusProps {
  status: 'disconnected' | 'connecting' | 'connected'
  className?: string
}

export function ConnectionStatus({ status, className }: ConnectionStatusProps) {
  const statusConfig = {
    disconnected: {
      color: 'bg-red-500',
      text: 'Disconnected',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21.5 21.5M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
          />
        </svg>
      )
    },
    connecting: {
      color: 'bg-yellow-500',
      text: 'Connecting...',
      icon: (
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      )
    },
    connected: {
      color: 'bg-green-500',
      text: 'Connected',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
          />
        </svg>
      )
    }
  }

  const config = statusConfig[status]

  return (
    <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-md bg-white shadow-sm border', className)}>
      <div className="flex items-center gap-1.5">
        <div className={cn('w-2 h-2 rounded-full', config.color, {
          'animate-pulse': status === 'connecting'
        })} />
        <span className="text-xs font-medium text-gray-600">{config.text}</span>
      </div>
      {config.icon}
    </div>
  )
}