import React from 'react'
import { 
  Square, 
  Circle, 
  Type, 
  Image, 
  Pen, 
  Hexagon,
  MousePointer,
  Hand,
  Undo,
  Redo,
  Download,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileToolbarProps {
  selectedTool: string
  onSelectTool: (tool: string) => void
  onUndo: () => void
  onRedo: () => void
  onExport: () => void
  onCollaborate: () => void
  canUndo: boolean
  canRedo: boolean
  orientation: 'portrait' | 'landscape'
  className?: string
}

export function MobileToolbar({
  selectedTool,
  onSelectTool,
  onUndo,
  onRedo,
  onExport,
  onCollaborate,
  canUndo,
  canRedo,
  orientation,
  className
}: MobileToolbarProps) {
  const tools = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'pan', icon: Hand, label: 'Pan' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'image', icon: Image, label: 'Image' },
    { id: 'pen', icon: Pen, label: 'Draw' },
    { id: 'sticky', icon: Hexagon, label: 'Sticky Note' }
  ]

  const actions = [
    { 
      id: 'undo', 
      icon: Undo, 
      label: 'Undo', 
      onClick: onUndo, 
      disabled: !canUndo 
    },
    { 
      id: 'redo', 
      icon: Redo, 
      label: 'Redo', 
      onClick: onRedo, 
      disabled: !canRedo 
    },
    { 
      id: 'export', 
      icon: Download, 
      label: 'Export', 
      onClick: onExport 
    },
    { 
      id: 'collaborate', 
      icon: Users, 
      label: 'Collaborate', 
      onClick: onCollaborate 
    }
  ]

  if (orientation === 'portrait') {
    // In portrait mode, return null as we'll use FAB instead
    return null
  }

  // Landscape mode - horizontal toolbar
  return (
    <div 
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900',
        'border-t border-gray-200 dark:border-gray-700',
        'px-4 py-2 z-40',
        className
      )}
    >
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Tools section */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={cn(
                'min-w-[44px] h-[44px] rounded-lg',
                'flex items-center justify-center',
                'transition-colors',
                selectedTool === tool.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              )}
              aria-label={tool.label}
              aria-pressed={selectedTool === tool.id}
            >
              <tool.icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        {/* Actions section */}
        <div className="flex items-center gap-1">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                'min-w-[44px] h-[44px] rounded-lg',
                'flex items-center justify-center',
                'transition-colors',
                action.disabled
                  ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              )}
              aria-label={action.label}
            >
              <action.icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}