import React from 'react'
import { clsx } from 'clsx'

interface AvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  src?: string
  alt?: string
  children?: React.ReactNode
  className?: string
}

export const Avatar: React.FC<AvatarProps> = ({
  size = 'md',
  src,
  alt = '',
  children,
  className
}) => {
  return (
    <div
      className={clsx(
        'relative inline-flex items-center justify-center rounded-full bg-gray-100 overflow-hidden',
        {
          'w-5 h-5': size === 'xs',
          'w-6 h-6': size === 'sm',
          'w-8 h-8': size === 'md',
          'w-10 h-10': size === 'lg',
        },
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        children || (
          <span className={clsx(
            'text-gray-500 font-medium',
            {
              'text-xs': size === 'xs' || size === 'sm',
              'text-sm': size === 'md',
              'text-base': size === 'lg',
            }
          )}>
            {alt ? alt.charAt(0).toUpperCase() : '?'}
          </span>
        )
      )}
    </div>
  )
}