import React from 'react'
import { UserPresence as UserPresenceType } from '@/lib/realtime-manager'
import { cn } from '@/lib/utils'

interface UserPresenceProps {
  users: UserPresenceType[]
  maxVisible?: number
  className?: string
}

export function UserPresenceList({ users, maxVisible = 5, className }: UserPresenceProps) {
  const visibleUsers = users.slice(0, maxVisible)
  const remainingCount = Math.max(0, users.length - maxVisible)

  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {visibleUsers.map((user) => (
        <UserAvatar key={user.userId} user={user} />
      ))}
      {remainingCount > 0 && (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 border-2 border-white text-xs font-medium text-gray-600">
          +{remainingCount}
        </div>
      )}
    </div>
  )
}

interface UserAvatarProps {
  user: UserPresenceType
  showCursor?: boolean
  className?: string
}

export function UserAvatar({ user, showCursor = false, className }: UserAvatarProps) {
  const initials = user.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={cn('relative group', className)}>
      <div
        className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-sm text-xs font-medium text-white transition-transform hover:scale-110"
        style={{ backgroundColor: user.avatarColor }}
        title={user.displayName}
      >
        {initials}
      </div>
      
      {showCursor && user.cursor && (
        <UserCursor
          position={user.cursor}
          color={user.avatarColor}
          name={user.displayName}
        />
      )}
      
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {user.displayName}
      </div>
    </div>
  )
}

interface UserCursorProps {
  position: { x: number; y: number }
  color: string
  name: string
}

export function UserCursor({ position, color, name }: UserCursorProps) {
  return (
    <div
      className="absolute pointer-events-none z-50 transition-transform duration-75"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill={color}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      </svg>
      <div
        className="absolute top-5 left-2 px-1.5 py-0.5 text-xs text-white rounded shadow-sm whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  )
}