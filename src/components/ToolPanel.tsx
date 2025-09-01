'use client'

import React from 'react'
import { useCanvasStore } from '@/store/useCanvasStore'
import { Button } from './ui/Button'
import { Tooltip } from './ui/Tooltip'
import { 
  SelectIcon,
  HandIcon,
  StickyNoteIcon,
  RectangleIcon,
  CircleIcon,
  TextIcon,
  ImageIcon,
  ConnectorIcon,
  PenIcon,
  LineIcon
} from './ui/Icons'
import { ElementType } from '@/types'
import { clsx } from 'clsx'

const tools = [
  { type: 'select' as const, icon: SelectIcon, label: 'Select (V)', shortcut: 'V' },
  { type: 'pan' as const, icon: HandIcon, label: 'Hand tool (H)', shortcut: 'H' },
  { type: 'sticky_note' as ElementType, icon: StickyNoteIcon, label: 'Sticky note (S)', shortcut: 'S' },
  { type: 'rectangle' as ElementType, icon: RectangleIcon, label: 'Rectangle (R)', shortcut: 'R' },
  { type: 'circle' as ElementType, icon: CircleIcon, label: 'Circle (C)', shortcut: 'C' },
  { type: 'text' as ElementType, icon: TextIcon, label: 'Text (T)', shortcut: 'T' },
  { type: 'line' as ElementType, icon: LineIcon, label: 'Line (L)', shortcut: 'L' },
  { type: 'freehand' as ElementType, icon: PenIcon, label: 'Pen (P)', shortcut: 'P' },
  // { type: 'image' as ElementType, icon: ImageIcon, label: 'Image', shortcut: 'I' },
  // { type: 'connector' as ElementType, icon: ConnectorIcon, label: 'Connector', shortcut: 'K' }
] as const

export const ToolPanel: React.FC = () => {
  const { tool, setTool } = useCanvasStore()

  const handleToolSelect = (toolType: typeof tools[number]['type']) => {
    setTool({ type: toolType })
  }

  return (
    <div className="absolute top-4 left-4 z-40">
      <div className="flex flex-col gap-1 bg-white shadow-lg rounded-lg border p-2">
        {tools.map((toolConfig) => (
          <Tooltip key={toolConfig.type} content={toolConfig.label} side="right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToolSelect(toolConfig.type)}
              className={clsx(
                'w-10 h-10 flex items-center justify-center',
                tool.type === toolConfig.type && 'bg-blue-50 text-blue-600 ring-2 ring-blue-200'
              )}
              aria-label={toolConfig.label}
              title={toolConfig.label}
              data-testid={`tool-${toolConfig.type}`}
            >
              <toolConfig.icon className="w-5 h-5" />
            </Button>
          </Tooltip>
        ))}
        
        {/* Divider */}
        <div className="h-px bg-gray-200 my-1" />
        
        {/* Additional tools placeholder */}
        <div className="flex flex-col gap-1">
          <Tooltip content="Image (Coming soon)" side="right">
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="w-10 h-10 flex items-center justify-center opacity-50"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
          </Tooltip>
          
          <Tooltip content="Connector (Coming soon)" side="right">
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="w-10 h-10 flex items-center justify-center opacity-50"
            >
              <ConnectorIcon className="w-5 h-5" />
            </Button>
          </Tooltip>
          
          <Tooltip content="Pen (Coming soon)" side="right">
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="w-10 h-10 flex items-center justify-center opacity-50"
            >
              <PenIcon className="w-5 h-5" />
            </Button>
          </Tooltip>
        </div>
      </div>
      
      {/* Tool Info */}
      <div className="mt-2 bg-white shadow-lg rounded-lg border p-2 text-xs text-gray-600">
        <div className="font-medium">Current Tool</div>
        <div className="capitalize">{tool.replace('_', ' ')}</div>
        {tools.find(t => t.type === tool)?.shortcut && (
          <div className="text-gray-400">Press {tools.find(t => t.type === tool)?.shortcut}</div>
        )}
      </div>
    </div>
  )
}