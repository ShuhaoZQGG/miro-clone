'use client'

import React from 'react'
import { useCanvas } from '@/hooks/useCanvas'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useCanvasStore } from '@/store/useCanvasStore'
import { Toolbar } from './Toolbar'
import { ToolPanel } from './ToolPanel'
import { CollaborationPanel } from './CollaborationPanel'
import { Grid } from './Grid'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { clsx } from 'clsx'

interface WhiteboardProps {
  boardId: string
  className?: string
}

export const Whiteboard: React.FC<WhiteboardProps> = ({ boardId, className }) => {
  const { isGridVisible, isLoading } = useCanvasStore()
  
  const {
    containerRef,
    isInitialized,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleKeyDown,
    handleKeyUp,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    exportCanvas
  } = useCanvas({
    boardId,
    onElementCreate: (element) => {
      console.log('Element created:', element)
    },
    onElementUpdate: (element) => {
      console.log('Element updated:', element)
    },
    onSelectionChange: (selectedIds) => {
      console.log('Selection changed:', selectedIds)
    }
  })

  useKeyboardShortcuts()

  return (
    <div 
      className={clsx(
        'relative w-full h-full overflow-hidden bg-white',
        'focus:outline-none',
        className
      )}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      {/* Toolbar */}
      <Toolbar
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onFitToScreen={fitToScreen}
        onExport={exportCanvas}
      />
      
      {/* Tool Panel */}
      <ToolPanel />
      
      {/* Collaboration Panel */}
      <CollaborationPanel />
      
      {/* Main Canvas Container */}
      <div
        ref={containerRef}
        className={clsx(
          'absolute inset-0 cursor-crosshair',
          'touch-none select-none',
          'bg-gray-50',
          'w-full h-full' // Ensure full dimensions
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          touchAction: 'none', // Prevent default touch behaviors
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      >
        {/* Grid */}
        {isGridVisible && <Grid />}
        
        {/* Loading State */}
        {(isLoading || !isInitialized) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
            <LoadingSpinner size="lg" />
          </div>
        )}
        
        {/* Canvas content will be rendered here by Fabric.js */}
      </div>
      
      {/* Status Bar */}
      <div className="absolute bottom-4 right-4 bg-white shadow-lg rounded-lg px-3 py-2 text-sm text-gray-600 border">
        <span>Board: {boardId}</span>
      </div>
      
      {/* Keyboard Shortcuts Help - Hidden for now, can be toggled */}
      <div className="sr-only">
        <div>Use V for select, S for sticky note, R for rectangle, C for circle, T for text</div>
        <div>Use Ctrl+A to select all, Escape to clear selection</div>
        <div>Use Delete to remove selected elements</div>
        <div>Use Ctrl+Plus/Minus to zoom, Ctrl+0 to reset zoom</div>
      </div>
    </div>
  )
}

export default Whiteboard