import React, { useState } from 'react'
import { Plus, X, Square, Circle, Type, Image, Pen, Hexagon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloatingActionButtonProps {
  onSelectTool: (tool: string) => void
  className?: string
}

export function FloatingActionButton({ onSelectTool, className }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const tools = [
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'image', icon: Image, label: 'Image' },
    { id: 'pen', icon: Pen, label: 'Draw' },
    { id: 'sticky', icon: Hexagon, label: 'Sticky Note' }
  ]

  const handleToolSelect = (toolId: string) => {
    onSelectTool(toolId)
    setIsOpen(false)
  }

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      {/* Tool options */}
      <div
        className={cn(
          'absolute bottom-16 right-0 flex flex-col gap-2 transition-all duration-300',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        )}
      >
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolSelect(tool.id)}
            className={cn(
              'w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg',
              'flex items-center justify-center',
              'hover:scale-110 transition-transform',
              'border border-gray-200 dark:border-gray-700'
            )}
            aria-label={tool.label}
          >
            <tool.icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        ))}
      </div>

      {/* Main FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-14 h-14 rounded-full shadow-xl',
          'flex items-center justify-center',
          'transition-all duration-300 hover:scale-110',
          'bg-blue-600 hover:bg-blue-700 text-white',
          isOpen && 'rotate-45'
        )}
        aria-label={isOpen ? 'Close tools' : 'Open tools'}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </button>
    </div>
  )
}