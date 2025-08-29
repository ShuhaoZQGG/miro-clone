import React from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}) => {
  return (
    <button
      className={clsx(
        // Base styles
        'inline-flex items-center justify-center font-medium rounded-md',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'transition-colors duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        
        // Size variants
        {
          'px-2 py-1 text-xs': size === 'xs',
          'px-3 py-1.5 text-sm': size === 'sm', 
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg'
        },
        
        // Color variants
        {
          'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': variant === 'primary',
          'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500': variant === 'secondary',
          'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500': variant === 'outline',
          'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500': variant === 'ghost'
        },
        
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}