'use client'

import React, { useState } from 'react'
import { useCanvasStore } from '@/store/useCanvasStore'
import { Button } from './ui/Button'
import { Avatar } from './ui/Avatar'
import { Tooltip } from './ui/Tooltip'
import { Badge } from './ui/Badge'
import { UserIcon, SettingsIcon, InviteIcon } from './ui/Icons'
import { clsx } from 'clsx'

export const CollaborationPanel: React.FC = () => {
  const { collaborators, isConnected } = useCanvasStore()
  const [isExpanded, setIsExpanded] = useState(false)
  
  const collaboratorArray = Array.from(collaborators.values())
  const activeCollaborators = collaboratorArray.filter(c => c.isActive)

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
          {activeCollaborators.slice(0, 5).map((collaborator) => (
            <Tooltip
              key={collaborator.userId}
              content={`User ${collaborator.userId.slice(-4)} ${collaborator.isActive ? '(active)' : '(idle)'}`}
            >
              <Avatar
                size="sm"
                className={clsx(
                  'ring-2',
                  collaborator.isActive ? 'ring-green-400' : 'ring-gray-300'
                )}
              >
                <UserIcon className="w-3 h-3" />
              </Avatar>
            </Tooltip>
          ))}
          
          {activeCollaborators.length > 5 && (
            <Badge variant="secondary" className="text-xs">
              +{activeCollaborators.length - 5}
            </Badge>
          )}
          
          {activeCollaborators.length === 0 && (
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
                  <span>{activeCollaborators.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total users:</span>
                  <span>{collaboratorArray.length}</span>
                </div>
              </div>
            </div>

            {/* Collaborator List */}
            {collaboratorArray.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">Active Now</div>
                {collaboratorArray.map((collaborator) => (
                  <div
                    key={collaborator.userId}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50"
                  >
                    <Avatar size="xs">
                      <UserIcon className="w-3 h-3" />
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        User {collaborator.userId.slice(-4)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {collaborator.isActive ? 'Active' : `Last seen ${new Date(collaborator.lastSeen).toLocaleTimeString()}`}
                      </div>
                    </div>
                    
                    <Badge
                      variant={collaborator.isActive ? 'success' : 'secondary'}
                      size="xs"
                    >
                      {collaborator.isActive ? 'online' : 'away'}
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