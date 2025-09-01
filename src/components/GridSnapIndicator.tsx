'use client'

import React from 'react'
import { clsx } from 'clsx'

interface GridSnapIndicatorProps {
  isVisible: boolean
  position: { x: number; y: number }
  size?: 'sm' | 'md' | 'lg'
}

export const GridSnapIndicator: React.FC<GridSnapIndicatorProps> = ({
  isVisible,
  position,
  size = 'md'
}) => {
  if (!isVisible) return null

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  return (
    <div
      className={clsx(
        'absolute bg-blue-500 rounded-full opacity-75 pointer-events-none z-50',
        'animate-pulse transition-all duration-150',
        sizeClasses[size]
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)'
      }}
      data-testid="grid-snap-indicator"
    >
      <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping" />
    </div>
  )
}

export const GridAlignmentGuides: React.FC<{
  horizontal?: number[]
  vertical?: number[]
  bounds?: { width: number; height: number }
}> = ({ horizontal = [], vertical = [], bounds }) => {
  if (!bounds) return null

  return (
    <>
      {/* Horizontal alignment guides */}
      {horizontal.map((y, index) => (
        <div
          key={`h-${index}`}
          className="absolute left-0 w-full h-px bg-blue-400 opacity-50 pointer-events-none z-40"
          style={{ top: `${y}px` }}
          data-testid="horizontal-alignment-guide"
        />
      ))}
      
      {/* Vertical alignment guides */}
      {vertical.map((x, index) => (
        <div
          key={`v-${index}`}
          className="absolute top-0 h-full w-px bg-blue-400 opacity-50 pointer-events-none z-40"
          style={{ left: `${x}px` }}
          data-testid="vertical-alignment-guide"
        />
      ))}
    </>
  )
}