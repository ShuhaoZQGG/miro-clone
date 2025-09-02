'use client'

import React, { useState } from 'react'
import { useCanvasStore } from '@/store/useCanvasStore'
import { Button } from './ui/Button'
import { Tooltip } from './ui/Tooltip'
import { 
  ZoomInIcon, 
  ZoomOutIcon, 
  FitScreenIcon,
  ExportIcon,
  GridIcon,
  UndoIcon,
  RedoIcon,
  ShareIcon,
  ImageIcon,
  TemplateIcon,
  FormatBoldIcon,
  FormatItalicIcon,
  FormatUnderlineIcon,
  TextIcon
} from './ui/Icons'
import { clsx } from 'clsx'

interface ToolbarProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onFitToScreen: () => void
  onExport: (format: 'png' | 'jpg' | 'svg') => Promise<string | null>
  onImageUpload?: () => void
  onGridToggle?: () => void
  gridEnabled?: boolean
  onTemplateGallery?: () => void
  onTextFormat?: (format: 'bold' | 'italic' | 'underline') => void
  selectedTextFormats?: {
    bold?: boolean
    italic?: boolean
    underline?: boolean
  }
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  className?: string
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToScreen,
  onExport,
  onImageUpload,
  onGridToggle,
  gridEnabled = false,
  onTemplateGallery,
  onTextFormat,
  selectedTextFormats = {},
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  className
}) => {
  const { 
    camera, 
    isGridVisible, 
    toggleGrid,
    elements,
    selectedElementIds,
    isConnected
  } = useCanvasStore()
  
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'png' | 'jpg' | 'svg' = 'png') => {
    setIsExporting(true)
    try {
      const dataUrl = await onExport(format)
      if (dataUrl) {
        // Create download link
        const link = document.createElement('a')
        link.download = `whiteboard.${format}`
        link.href = dataUrl
        link.click()
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const zoomPercentage = Math.round(camera.zoom * 100)

  return (
    <div className={clsx(
      'absolute top-4 left-1/2 transform -translate-x-1/2 z-40',
      'flex items-center gap-2 bg-white shadow-lg rounded-lg border p-2',
      className
    )}>
      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <Tooltip content="Undo (Ctrl+Z)">
          <Button
            variant="ghost"
            size="sm"
            disabled={!canUndo}
            onClick={onUndo}
            data-testid="undo-button"
            aria-label="Undo"
          >
            <UndoIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
        
        <Tooltip content="Redo (Ctrl+Y)">
          <Button
            variant="ghost"
            size="sm"
            disabled={!canRedo}
            onClick={onRedo}
            data-testid="redo-button"
            aria-label="Redo"
          >
            <RedoIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
        
        <div className="w-px h-6 bg-gray-200 mx-1" />
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Tooltip content="Zoom out (Ctrl+-)">
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            disabled={camera.zoom <= 0.1}
          >
            <ZoomOutIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
        
        <Tooltip content="Reset zoom (Ctrl+0)">
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetZoom}
            className="min-w-16 text-sm font-mono"
          >
            {zoomPercentage}%
          </Button>
        </Tooltip>
        
        <Tooltip content="Zoom in (Ctrl++)">
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            disabled={camera.zoom >= 10}
          >
            <ZoomInIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
        
        <div className="w-px h-6 bg-gray-200 mx-1" />
      </div>

      {/* View Controls */}
      <div className="flex items-center gap-1">
        <Tooltip content="Fit to screen">
          <Button
            variant="ghost"
            size="sm"
            onClick={onFitToScreen}
            disabled={elements.length === 0}
          >
            <FitScreenIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
        
        <Tooltip content={`Toggle grid${gridEnabled ? ' (snapping enabled)' : ''}`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              toggleGrid()
              if (onGridToggle) onGridToggle()
            }}
            className={clsx(
              isGridVisible && 'bg-blue-50 text-blue-600',
              gridEnabled && 'ring-2 ring-blue-400'
            )}
          >
            <GridIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
        
        <div className="w-px h-6 bg-gray-200 mx-1" />
      </div>

      {/* Template & Text Controls */}
      <div className="flex items-center gap-1">
        {onTemplateGallery && (
          <Tooltip content="Template Gallery">
            <Button
              variant="ghost"
              size="sm"
              onClick={onTemplateGallery}
              data-testid="template-gallery-button"
              aria-label="Open Template Gallery"
            >
              <TemplateIcon className="w-4 h-4" />
            </Button>
          </Tooltip>
        )}
        
        {onTextFormat && (
          <>
            <Tooltip content="Bold (Ctrl+B)">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTextFormat('bold')}
                className={clsx(
                  selectedTextFormats.bold && 'bg-blue-50 text-blue-600'
                )}
                data-testid="format-bold-button"
                aria-label="Toggle Bold"
              >
                <FormatBoldIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <Tooltip content="Italic (Ctrl+I)">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTextFormat('italic')}
                className={clsx(
                  selectedTextFormats.italic && 'bg-blue-50 text-blue-600'
                )}
                data-testid="format-italic-button"
                aria-label="Toggle Italic"
              >
                <FormatItalicIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <Tooltip content="Underline (Ctrl+U)">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTextFormat('underline')}
                className={clsx(
                  selectedTextFormats.underline && 'bg-blue-50 text-blue-600'
                )}
                data-testid="format-underline-button"
                aria-label="Toggle Underline"
              >
                <FormatUnderlineIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
          </>
        )}
        
        <div className="w-px h-6 bg-gray-200 mx-1" />
      </div>

      {/* Export & Upload */}
      <div className="flex items-center gap-1">
        <Tooltip content="Export as PNG">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleExport('png')}
            disabled={isExporting || elements.length === 0}
            data-testid="export-button"
          >
            <ExportIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
        
        {onImageUpload && (
          <Tooltip content="Upload Image (or drag & drop)">
            <Button
              variant="ghost"
              size="sm"
              onClick={onImageUpload}
              data-testid="image-upload-button"
              aria-label="Upload Image"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
          </Tooltip>
        )}
        
        <div className="w-px h-6 bg-gray-200 mx-1" />
      </div>

      {/* Collaboration Status */}
      <div className="flex items-center gap-2">
        <Tooltip content={isConnected ? 'Connected' : 'Disconnected'}>
          <div className={clsx(
            'w-2 h-2 rounded-full',
            isConnected ? 'bg-green-500' : 'bg-red-500'
          )} />
        </Tooltip>
        
        <Tooltip content="Share board">
          <Button
            variant="ghost"
            size="sm"
          >
            <ShareIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>

      {/* Selection Info */}
      {selectedElementIds.length > 0 && (
        <>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <div className="text-sm text-gray-600 px-2">
            {selectedElementIds.length} selected
          </div>
        </>
      )}

      {/* Element Count */}
      <div className="text-xs text-gray-400 px-2">
        {elements.length} elements
      </div>
    </div>
  )
}