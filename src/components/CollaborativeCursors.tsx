import React, { memo } from 'react'

interface UserPresence {
  userId: string
  displayName: string
  avatarColor: string
  cursor?: { x: number; y: number }
}

interface ViewportBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

interface CollaborativeCursorsProps {
  users: UserPresence[]
  currentUserId: string
  viewportBounds?: ViewportBounds
}

const CursorSvg: React.FC<{ color: string }> = ({ color }) => (
  <svg
    width="24"
    height="36"
    viewBox="0 0 24 36"
    fill={color}
    style={{ position: 'absolute', top: 0, left: 0 }}
  >
    <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z" />
  </svg>
)

const Cursor: React.FC<{
  user: UserPresence
  viewportBounds?: ViewportBounds
}> = memo(({ user, viewportBounds }) => {
  if (!user.cursor) return null

  if (viewportBounds) {
    const { minX, minY, maxX, maxY } = viewportBounds
    if (
      user.cursor.x < minX ||
      user.cursor.x > maxX ||
      user.cursor.y < minY ||
      user.cursor.y > maxY
    ) {
      return null
    }
  }

  return (
    <div
      data-testid={`cursor-${user.userId}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        transform: `translate(${user.cursor.x}px, ${user.cursor.y}px)`,
        transition: 'transform 0.1s linear',
        pointerEvents: 'none',
        zIndex: 1000
      }}
    >
      <CursorSvg color={user.avatarColor} />
      <div
        data-testid={`cursor-label-${user.userId}`}
        style={{
          position: 'absolute',
          top: 20,
          left: 14,
          backgroundColor: user.avatarColor,
          color: 'white',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          userSelect: 'none'
        }}
      >
        {user.displayName}
      </div>
    </div>
  )
})

Cursor.displayName = 'Cursor'

export const CollaborativeCursors: React.FC<CollaborativeCursorsProps> = memo(({
  users,
  currentUserId,
  viewportBounds
}) => {
  const visibleUsers = users.filter(
    user => user.userId !== currentUserId && user.cursor
  )

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 999
      }}
    >
      {visibleUsers.map(user => (
        <Cursor
          key={user.userId}
          user={user}
          viewportBounds={viewportBounds}
        />
      ))}
    </div>
  )
})

CollaborativeCursors.displayName = 'CollaborativeCursors'