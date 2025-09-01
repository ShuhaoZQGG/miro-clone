'use client'

import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react'
import { useCanvas } from '@/hooks/useCanvas'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useCanvasStore } from '@/store/useCanvasStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useAuth } from '@/context/AuthContext'
import { Toolbar } from './Toolbar'
import { ToolPanel } from './ToolPanel'
import { CollaborationPanel } from './CollaborationPanel'
import { CollaborativeCursors } from './CollaborativeCursors'
import { AuthModal } from './AuthModal'
import { Grid } from './Grid'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { ImageUploadManager } from '@/lib/canvas-features/image-upload'
import { clsx } from 'clsx'

interface WhiteboardProps {
  boardId: string
  className?: string
}

export const Whiteboard: React.FC<WhiteboardProps> = ({ boardId, className }) => {
  const { isGridVisible, isLoading, addElement } = useCanvasStore()
  const { user, isAuthenticated } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showDropZone, setShowDropZone] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageUploadManagerRef = useRef<ImageUploadManager | null>(null)
  
  // Use authenticated user or generate temporary ID
  const userId = useMemo(() => user?.id || `guest-${Math.random().toString(36).substr(2, 9)}`, [user])
  const displayName = useMemo(() => user?.displayName || `Guest ${userId.substr(6, 4)}`, [user, userId])
  
  // Initialize WebSocket connection
  const {
    isConnected,
    users,
    connect,
    disconnect,
    sendCursorPosition,
    sendOperation,
    sendSelection,
    onOperation,
    onCursorUpdate,
    onSelectionUpdate
  } = useWebSocket(boardId)
  
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
    exportCanvas,
    canvasEngine
  } = useCanvas({
    boardId,
    onElementCreate: (element) => {
      console.log('Element created:', element)
      // Send creation operation to other users
      sendOperation({
        type: 'create',
        elementId: element.id,
        element: element
      })
    },
    onElementUpdate: (element) => {
      console.log('Element updated:', element)
      // Send update operation to other users
      sendOperation({
        type: 'update',
        elementId: element.id,
        newState: element
      })
    },
    onSelectionChange: (selectedIds) => {
      console.log('Selection changed:', selectedIds)
      // Send selection update to other users
      sendSelection(selectedIds)
    }
  })

  useKeyboardShortcuts()
  
  // Initialize ImageUploadManager when canvas is ready
  useEffect(() => {
    if (canvasEngine && !imageUploadManagerRef.current) {
      const canvas = canvasEngine.getCanvas()
      imageUploadManagerRef.current = new ImageUploadManager(canvas)
      
      // Set up event handlers
      imageUploadManagerRef.current.on('imageAdded', (element) => {
        addElement(element)
        
        // Send creation operation to other users
        sendOperation({
          type: 'create',
          elementId: element.id,
          element: element
        })
      })
      
      imageUploadManagerRef.current.on('error', (error) => {
        console.error('Image upload error:', error)
        // TODO: Show error toast
      })
    }
    
    return () => {
      if (imageUploadManagerRef.current) {
        imageUploadManagerRef.current.dispose()
        imageUploadManagerRef.current = null
      }
    }
  }, [canvasEngine, addElement, sendOperation])
  
  // Handle file input
  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])
  
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !imageUploadManagerRef.current) return
    
    setIsUploading(true)
    try {
      await imageUploadManagerRef.current.handleFiles(Array.from(files))
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [])
  
  // Handle drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer?.types.includes('Files')) {
      setShowDropZone(true)
    }
  }, [])
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only hide if leaving the container entirely
    if (e.currentTarget === e.target) {
      setShowDropZone(false)
    }
  }, [])
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])
  
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDropZone(false)
    
    const files = Array.from(e.dataTransfer?.files || [])
    if (files.length > 0 && imageUploadManagerRef.current) {
      setIsUploading(true)
      try {
        await imageUploadManagerRef.current.handleFiles(files)
      } finally {
        setIsUploading(false)
      }
    }
  }, [])
  
  // Handle paste
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files || [])
      const imageFiles = files.filter(f => f.type.startsWith('image/'))
      
      if (imageFiles.length > 0 && imageUploadManagerRef.current) {
        setIsUploading(true)
        try {
          await imageUploadManagerRef.current.handleFiles(imageFiles)
        } finally {
          setIsUploading(false)
        }
      }
    }
    
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])
  
  // Connect to WebSocket on mount or when authentication changes
  useEffect(() => {
    connect(userId, displayName)
    return () => {
      disconnect()
    }
  }, [connect, disconnect, userId, displayName])
  
  // Show auth modal if not authenticated (optional)
  useEffect(() => {
    if (!isAuthenticated) {
      // Optionally prompt for authentication after a delay
      const timer = setTimeout(() => {
        // setShowAuthModal(true) // Uncomment to require auth
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated])
  
  // Listen for remote operations
  useEffect(() => {
    onOperation((operation) => {
      // Handle remote operations
      // This would integrate with your canvas engine
      console.log('Received remote operation:', operation)
    })
    
    onCursorUpdate((data) => {
      // Cursor updates are handled by CollaborativeCursors component
      console.log('Received cursor update:', data)
    })
    
    onSelectionUpdate((data) => {
      // Handle remote selection updates
      console.log('Received selection update:', data)
    })
  }, [onOperation, onCursorUpdate, onSelectionUpdate])
  
  // Enhanced mouse move handler with cursor broadcasting
  const handleEnhancedMouseMove = useCallback((e: React.MouseEvent) => {
    handleMouseMove(e)
    
    // Send cursor position to other users
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      sendCursorPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }, [handleMouseMove, sendCursorPosition, containerRef])

  return (
    <div 
      className={clsx(
        'fixed inset-0 overflow-hidden bg-white',
        'focus:outline-none',
        className
      )}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      style={{
        margin: 0,
        padding: 0
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        data-testid="image-file-input"
      />
      
      {/* Main Canvas Container - Full screen base layer */}
      <div
        ref={containerRef}
        className={clsx(
          'canvas-container',
          'fixed inset-0 cursor-crosshair',
          'touch-none select-none',
          'bg-gray-50',
          'w-full h-full'
        )}
        data-testid="canvas-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleEnhancedMouseMove}
        onMouseUp={handleMouseUp}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          position: 'fixed',
          inset: 0,
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          width: '100%',
          height: '100%',
          margin: 0,
          padding: 0,
          touchAction: 'none',
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          zIndex: 0
        }}
      >
        {/* Grid */}
        {isGridVisible && <Grid />}
        
        {/* Collaborative Cursors */}
        <CollaborativeCursors 
          users={users.filter(u => u.userId !== userId)} 
          currentUserId={userId}
        />
        
        {/* Loading State */}
        {(isLoading || !isInitialized) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
            <LoadingSpinner size="lg" />
          </div>
        )}
        
        {/* Drop Zone Overlay */}
        {showDropZone && (
          <div 
            className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center z-40 pointer-events-none"
            data-testid="drop-zone-overlay"
          >
            <div className="bg-white rounded-lg shadow-lg p-8">
              <p className="text-2xl font-semibold text-gray-700">Drop images here</p>
            </div>
          </div>
        )}
        
        {/* Upload Loading Indicator */}
        {isUploading && (
          <div 
            className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50"
            data-testid="upload-loading"
          >
            <LoadingSpinner size="sm" />
            <span className="ml-2 text-sm text-gray-600">Uploading...</span>
          </div>
        )}
        
        {/* Canvas content will be rendered here by Fabric.js */}
      </div>

      {/* Toolbar - Overlay on top */}
      <div className="toolbar" style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
        <Toolbar
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={resetZoom}
          onFitToScreen={fitToScreen}
          onExport={exportCanvas}
          onImageUpload={handleImageUpload}
        />
      </div>
      
      {/* Tool Panel - Overlay on left */}
      <div style={{ position: 'fixed', left: 16, top: 88, zIndex: 100 }}>
        <ToolPanel />
      </div>
      
      {/* Collaboration Panel - Overlay on right */}
      <div style={{ position: 'fixed', right: 16, top: 88, zIndex: 100 }}>
        <CollaborationPanel users={users} isConnected={isConnected} />
      </div>
      
      {/* Status Bar */}
      <div className="absolute bottom-4 right-4 bg-white shadow-lg rounded-lg px-3 py-2 text-sm text-gray-600 border" style={{ zIndex: 100 }}>
        <span>Board: {boardId}</span>
        <span className="ml-4">
          {isConnected ? (
            <span className="text-green-600">● Connected</span>
          ) : (
            <span className="text-red-600">● Disconnected</span>
          )}
        </span>
        <span className="ml-4">Users: {users.length}</span>
        <span className="ml-4">
          {isAuthenticated ? (
            <span className="text-blue-600">{user?.displayName}</span>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="text-blue-600 hover:underline"
            >
              Sign In
            </button>
          )}
        </span>
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
      
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