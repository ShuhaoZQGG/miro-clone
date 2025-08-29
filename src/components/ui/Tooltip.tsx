import React, { useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'

interface TooltipProps {
  content: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  children: React.ReactElement
  disabled?: boolean
  delay?: number
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  side = 'bottom',
  children,
  disabled = false,
  delay = 500
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  const handleMouseEnter = () => {
    if (disabled) return
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay)
  }
  
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && !disabled && (
        <div
          className={clsx(
            'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg',
            'whitespace-nowrap pointer-events-none',
            {
              'bottom-full left-1/2 transform -translate-x-1/2 mb-2': side === 'top',
              'top-full left-1/2 transform -translate-x-1/2 mt-2': side === 'bottom',
              'right-full top-1/2 transform -translate-y-1/2 mr-2': side === 'left',
              'left-full top-1/2 transform -translate-y-1/2 ml-2': side === 'right',
            }
          )}
        >
          {content}
          
          {/* Arrow */}
          <div
            className={clsx(
              'absolute w-2 h-2 bg-gray-900 transform rotate-45',
              {
                'top-full left-1/2 -translate-x-1/2 -mt-1': side === 'top',
                'bottom-full left-1/2 -translate-x-1/2 -mb-1': side === 'bottom',
                'top-1/2 left-full -translate-y-1/2 -ml-1': side === 'left',
                'top-1/2 right-full -translate-y-1/2 -mr-1': side === 'right',
              }
            )}
          />
        </div>
      )}
    </div>
  )
}