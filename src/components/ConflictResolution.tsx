import React, { useState, useEffect } from 'react'
import { CanvasElement } from '@/types'
import { CRDTManager } from '@/lib/canvas-features/crdt-manager'

interface Conflict {
  elementId: string
  localValue: CanvasElement
  remoteValue: CanvasElement
  timestamp: number
}

interface ConflictResolutionProps {
  crdtManager: CRDTManager | null
  isVisible: boolean
  onClose: () => void
}

export const ConflictResolution: React.FC<ConflictResolutionProps> = ({
  crdtManager,
  isVisible,
  onClose
}) => {
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null)
  const [resolutionStrategy, setResolutionStrategy] = useState<'local' | 'remote' | 'merge'>('remote')

  useEffect(() => {
    if (!crdtManager) return

    const handleConflict = (data: any) => {
      const newConflict: Conflict = {
        elementId: data.elementId,
        localValue: data.localValue,
        remoteValue: data.remoteValue,
        timestamp: Date.now()
      }
      
      setConflicts(prev => [...prev, newConflict])
      
      // Auto-select first conflict
      if (conflicts.length === 0) {
        setSelectedConflict(newConflict)
      }
    }

    crdtManager.on('conflict', handleConflict)

    return () => {
      crdtManager.off('conflict', handleConflict)
    }
  }, [crdtManager, conflicts.length])

  const resolveConflict = () => {
    if (!selectedConflict || !crdtManager) return

    switch (resolutionStrategy) {
      case 'local':
        crdtManager.updateElement(selectedConflict.elementId, selectedConflict.localValue)
        break
      case 'remote':
        crdtManager.updateElement(selectedConflict.elementId, selectedConflict.remoteValue)
        break
      case 'merge':
        // Merge both values (position and style)
        const merged = {
          ...selectedConflict.remoteValue,
          position: {
            x: (selectedConflict.localValue.position.x + selectedConflict.remoteValue.position.x) / 2,
            y: (selectedConflict.localValue.position.y + selectedConflict.remoteValue.position.y) / 2
          }
        }
        crdtManager.updateElement(selectedConflict.elementId, merged)
        break
    }

    // Remove resolved conflict
    setConflicts(prev => prev.filter(c => c.elementId !== selectedConflict.elementId))
    
    // Select next conflict if available
    const remaining = conflicts.filter(c => c.elementId !== selectedConflict.elementId)
    if (remaining.length > 0) {
      setSelectedConflict(remaining[0])
    } else {
      setSelectedConflict(null)
    }
  }

  const resolveAllConflicts = () => {
    if (!crdtManager) return

    conflicts.forEach(conflict => {
      // Apply selected strategy to all conflicts
      switch (resolutionStrategy) {
        case 'local':
          crdtManager.updateElement(conflict.elementId, conflict.localValue)
          break
        case 'remote':
          crdtManager.updateElement(conflict.elementId, conflict.remoteValue)
          break
        case 'merge':
          const merged = {
            ...conflict.remoteValue,
            position: {
              x: (conflict.localValue.position.x + conflict.remoteValue.position.x) / 2,
              y: (conflict.localValue.position.y + conflict.remoteValue.position.y) / 2
            }
          }
          crdtManager.updateElement(conflict.elementId, merged)
          break
      }
    })

    setConflicts([])
    setSelectedConflict(null)
  }

  if (!isVisible || conflicts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-80 z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Conflict Resolution ({conflicts.length})
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close conflict resolution"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {selectedConflict && (
        <div className="space-y-3">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Element ID: {selectedConflict.elementId.substring(0, 8)}...
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-2">
            <div className="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-1">
              Conflict Detected
            </div>
            <div className="text-xs text-yellow-700 dark:text-yellow-400">
              Different values received from remote user
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Resolution Strategy:
            </label>
            <div className="space-y-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="remote"
                  checked={resolutionStrategy === 'remote'}
                  onChange={(e) => setResolutionStrategy(e.target.value as 'remote')}
                  className="text-blue-500"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Accept Remote (Recommended)
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="local"
                  checked={resolutionStrategy === 'local'}
                  onChange={(e) => setResolutionStrategy(e.target.value as 'local')}
                  className="text-blue-500"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Keep Local
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="merge"
                  checked={resolutionStrategy === 'merge'}
                  onChange={(e) => setResolutionStrategy(e.target.value as 'merge')}
                  className="text-blue-500"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Merge Both
                </span>
              </label>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={resolveConflict}
              className="flex-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors"
            >
              Resolve This
            </button>
            <button
              onClick={resolveAllConflicts}
              className="flex-1 px-3 py-1.5 bg-gray-500 text-white text-xs font-medium rounded hover:bg-gray-600 transition-colors"
            >
              Resolve All ({conflicts.length})
            </button>
          </div>
        </div>
      )}

      {conflicts.length > 1 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {conflicts.length - 1} more conflict{conflicts.length > 2 ? 's' : ''} pending
          </div>
        </div>
      )}
    </div>
  )
}