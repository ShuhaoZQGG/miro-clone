'use client'

import React, { useState } from 'react'
import { Button } from './ui/Button'
import { Avatar } from './ui/Avatar'
import { Tooltip } from './ui/Tooltip'
import { Badge } from './ui/Badge'
import { UserIcon, SettingsIcon, InviteIcon } from './ui/Icons'
import { clsx } from 'clsx'

interface UserPresence {
  userId: string
  displayName: string
  avatarColor: string
  cursor?: { x: number; y: number }
  selection?: string[]
  lastSeen?: Date
  isActive?: boolean
}

interface CollaborationPanelProps {
  users?: UserPresence[]
  isConnected?: boolean
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ users = [], isConnected = false }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const activeUsers = users.filter(u => u.isActive !== false)

  return (
    <div className="absolute top-4 right-4 z-40">
      {/* Collaboration Status */}
      <div className="bg-white shadow-lg rounded-lg border p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={clsx(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-red-500'
            )} />
            <span className="text-sm font-medium">
              {isConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1"
          >
            <SettingsIcon className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Collaborator Avatars */}
        <div className="flex items-center gap-2">
          {activeUsers.slice(0, 5).map((user) => (
            <Tooltip
              key={user.userId}
              content={`${user.displayName} ${user.isActive !== false ? '(active)' : '(idle)'}`}
            >
              <Avatar
                size="sm"
                className={clsx(
                  'ring-2',
                  user.isActive !== false ? 'ring-green-400' : 'ring-gray-300'
                )}
                style={{ backgroundColor: user.avatarColor || '#3B82F6' }}
              >
                <UserIcon className="w-3 h-3 text-white" />
              </Avatar>
            </Tooltip>
          ))}
          
          {activeUsers.length > 5 && (
            <Badge variant="secondary" className="text-xs">
              +{activeUsers.length - 5}
            </Badge>
          )}
          
          {activeUsers.length === 0 && (
            <div className="text-sm text-gray-500">
              No active collaborators
            </div>
          )}
        </div>

        {/* Invite Button */}
        <div className="mt-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center gap-2"
          >
            <InviteIcon className="w-4 h-4" />
            Invite others
          </Button>
        </div>
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="mt-2 bg-white shadow-lg rounded-lg border p-3 w-64">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Board Collaborators</h3>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setIsExpanded(false)}
                className="p-1"
              >
                ×
              </Button>
            </div>
            
            {/* Connection Status Details */}
            <div className="space-y-2">
              <div className="text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Active users:</span>
                  <span>{activeUsers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total users:</span>
                  <span>{users.length}</span>
                </div>
              </div>
            </div>

            {/* Collaborator List */}
            {users.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">Active Now</div>
                {users.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50"
                  >
                    <Avatar 
                      size="xs"
                      style={{ backgroundColor: user.avatarColor || '#3B82F6' }}
                    >
                      <UserIcon className="w-3 h-3 text-white" />
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {user.displayName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.isActive !== false ? 'Active' : user.lastSeen ? `Last seen ${new Date(user.lastSeen).toLocaleTimeString()}` : 'Away'}
                      </div>
                    </div>
                    
                    <Badge
                      variant={user.isActive !== false ? 'success' : 'secondary'}
                      size="xs"
                    >
                      {user.isActive !== false ? 'online' : 'away'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Collaboration Settings */}
            <div className="pt-2 border-t space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
              >
                Board settings
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full"
              >
                Manage permissions
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}