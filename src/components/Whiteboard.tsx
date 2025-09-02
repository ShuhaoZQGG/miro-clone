'use client'

import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react'
import { useCanvas } from '@/hooks/useCanvas'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useCanvasStore } from '@/store/useCanvasStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useAuth } from '@/context/AuthContext'
import { useHistory } from '@/hooks/useHistory'
import { Toolbar } from './Toolbar'
import { ToolPanel } from './ToolPanel'
import { CollaborationPanel } from './CollaborationPanel'
import { CollaborativeCursors } from './CollaborativeCursors'
import { AuthModal } from './AuthModal'
import { Grid } from './Grid'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { ToastContainer } from './ui/ToastContainer'
import { useToast, createToastHelpers } from '@/hooks/useToast'
import { ImageUploadManager } from '@/lib/canvas-features/image-upload'
import { TextEditingManager } from '@/lib/canvas-features/text-editing'
import { GridSnappingManager } from '@/lib/canvas-features/grid-snapping'
import { TemplateGallery } from './TemplateGallery'
import { Template } from '@/lib/canvas-features/templates'
import { GridSnapIndicator, GridAlignmentGuides } from './GridSnapIndicator'
import { GridSettings } from './GridSettings'
import { UploadProgress } from './UploadProgress'
import { clsx } from 'clsx'
import { WebGLRenderer } from '@/lib/canvas-features/webgl-renderer'
import { PerformanceMonitor } from './PerformanceMonitor'
import { ConflictResolution } from './ConflictResolution'

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
  const [gridEnabled, setGridEnabled] = useState(false)
  const [gridSize, setGridSize] = useState(20)
  const [showGridSettings, setShowGridSettings] = useState(false)
  const [showTemplateGallery, setShowTemplateGallery] = useState(false)
  const [selectedTextFormats, setSelectedTextFormats] = useState({
    bold: false,
    italic: false,
    underline: false
  })
  const [snapIndicator, setSnapIndicator] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0
  })
  const [alignmentGuides, setAlignmentGuides] = useState<{ horizontal: number[]; vertical: number[] }>({
    horizontal: [],
    vertical: []
  })
  const [uploadFileName, setUploadFileName] = useState<string>('')
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false)
  const [showConflictResolution, setShowConflictResolution] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageUploadManagerRef = useRef<ImageUploadManager | null>(null)
  const textEditingManagerRef = useRef<TextEditingManager | null>(null)
  const gridSnappingManagerRef = useRef<GridSnappingManager | null>(null)
  const webglRendererRef = useRef<WebGLRenderer | null>(null)
  
  const { toasts, showToast, removeToast } = useToast()
  const toast = useMemo(() => createToastHelpers(showToast), [showToast])
  
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
  
  const { tool, setTool } = useCanvasStore()
  
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
    userId,
    websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:4000',
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

  // Initialize history management
  const { 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    trackElementCreation,
    trackElementUpdate,
    trackElementDeletion
  } = useHistory()

  useKeyboardShortcuts()
  
  // Initialize managers when canvas is ready
  useEffect(() => {
    if (canvasEngine) {
      const canvas = canvasEngine.getCanvas()
      const canvasElement = canvas.getElement() as HTMLCanvasElement
      
      // Initialize ImageUploadManager
      if (!imageUploadManagerRef.current) {
        imageUploadManagerRef.current = new ImageUploadManager(canvasElement)
        
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
          toast.error('Image upload failed', error.message || 'Please try again with a valid image file')
        })
      }
      
      // Initialize TextEditingManager
      if (!textEditingManagerRef.current && canvas) {
        textEditingManagerRef.current = new TextEditingManager(canvas)
        
        // Set up text change handler
        textEditingManagerRef.current.onTextChanged = (element) => {
          // Send update operation to other users
          sendOperation({
            type: 'update',
            elementId: element.id,
            newState: element
          })
        }
      }
      
      // Initialize GridSnappingManager
      if (!gridSnappingManagerRef.current) {
        gridSnappingManagerRef.current = new GridSnappingManager()
        if (gridEnabled) {
          gridSnappingManagerRef.current.enable()
        } else {
          gridSnappingManagerRef.current.disable()
        }
        gridSnappingManagerRef.current.setGridSize(gridSize)
        
        // Set up snapping event handlers for visual feedback
        // TODO: Implement event handlers when GridSnappingManager supports events
        // gridSnappingManagerRef.current.on('snap', (position: { x: number; y: number }) => {
        //   setSnapIndicator({ visible: true, x: position.x, y: position.y })
        //   setTimeout(() => setSnapIndicator({ visible: false, x: 0, y: 0 }), 300)
        // })
        
        // gridSnappingManagerRef.current.on('alignmentGuides', (guides: { horizontal: number[]; vertical: number[] }) => {
        //   setAlignmentGuides(guides)
        // })
        
        // gridSnappingManagerRef.current.on('clearGuides', () => {
        //   setAlignmentGuides({ horizontal: [], vertical: [] })
        // })
      }
      
      // Initialize WebGL Renderer
      if (!webglRendererRef.current && canvas) {
        if (WebGLRenderer.isSupported()) {
          webglRendererRef.current = new WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance'
          })
          
          const initialized = webglRendererRef.current.initialize(canvas)
          if (initialized) {
            console.log('WebGL renderer initialized successfully')
            
            // Set performance mode based on element count
            const elements = canvasEngine.getElements()
            if (elements.length > 100) {
              webglRendererRef.current.setPerformanceMode('performance')
            } else {
              webglRendererRef.current.setPerformanceMode('auto')
            }
          } else {
            console.warn('Failed to initialize WebGL renderer')
          }
        } else {
          console.warn('WebGL not supported in this browser')
        }
      }
      
      // Note: CRDT is now handled internally by CanvasEngine when enableCRDT is true
      // The CanvasEngine will manage its own CRDT instance with the provided userId and websocketUrl
    }
    
    return () => {
      if (imageUploadManagerRef.current) {
        imageUploadManagerRef.current.dispose()
        imageUploadManagerRef.current = null
      }
      if (textEditingManagerRef.current) {
        textEditingManagerRef.current = null
      }
      if (gridSnappingManagerRef.current) {
        gridSnappingManagerRef.current = null
      }
      if (webglRendererRef.current) {
        webglRendererRef.current.dispose()
        webglRendererRef.current = null
      }
      // CRDT cleanup is handled by CanvasEngine disposal
    }
  }, [canvasEngine, addElement, sendOperation, toast, gridEnabled, gridSize, boardId, userId])
  
  // Handle file input
  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])
  
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !imageUploadManagerRef.current) return
    
    const fileName = files[0]?.name || 'image'
    setUploadFileName(fileName)
    setIsUploading(true)
    try {
      await imageUploadManagerRef.current.handleFiles(Array.from(files))
      toast.success('Image uploaded successfully')
    } catch (error) {
      toast.error('Failed to upload image', 'Please check the file format and try again')
    } finally {
      setIsUploading(false)
      setUploadFileName('')
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [toast])
  
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
        toast.success(`${files.length} image${files.length > 1 ? 's' : ''} uploaded successfully`)
      } catch (error) {
        toast.error('Failed to upload images', 'Please check the file formats and try again')
      } finally {
        setIsUploading(false)
      }
    }
  }, [toast])
  
  // Handle paste
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files || [])
      const imageFiles = files.filter(f => f.type.startsWith('image/'))
      
      if (imageFiles.length > 0 && imageUploadManagerRef.current) {
        setIsUploading(true)
        try {
          await imageUploadManagerRef.current.handleFiles(imageFiles)
          toast.success('Image pasted successfully')
        } catch (error) {
          toast.error('Failed to paste image', 'Please try copying a valid image')
        } finally {
          setIsUploading(false)
        }
      }
    }
    
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [toast])
  
  // Handle text element creation from text tool
  useEffect(() => {
    const handleCreateTextElement = (event: CustomEvent) => {
      if (!textEditingManagerRef.current || !canvasEngine) return
      
      const { position } = event.detail
      const textElement = textEditingManagerRef.current.createTextElement(position, {
        text: 'Text',
        fontSize: 16,
        fontFamily: 'Arial'
      })
      
      // Add to store
      addElement(textElement)
      
      // Start editing immediately
      const canvas = canvasEngine.getCanvas()
      if (canvas) {
        const fabricObjects = canvas.getObjects()
        const textObject = fabricObjects.find((obj: any) => obj.elementId === textElement.id)
        if (textObject) {
          textEditingManagerRef.current.startEditing(textObject)
        }
      }
      
      // Send creation operation to other users
      sendOperation({
        type: 'create',
        elementId: textElement.id,
        element: textElement
      })
    }
    
    window.addEventListener('createTextElement', handleCreateTextElement as EventListener)
    return () => window.removeEventListener('createTextElement', handleCreateTextElement as EventListener)
  }, [addElement, sendOperation, canvasEngine])
  
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
  
  // Handle template selection
  const handleTemplateSelect = useCallback((template: Template) => {
    if (!canvasEngine) return
    
    // Load template elements onto canvas
    template.elements.forEach((templateElement, index) => {
      // Convert template element to canvas element
      const canvasElement: any = {
        id: `template-${Date.now()}-${index}`,
        boardId: boardId || 'demo-board',
        type: templateElement.type === 'rect' ? 'shape' : templateElement.type,
        shape: templateElement.type === 'rect' ? 'rectangle' : undefined,
        position: templateElement.position,
        size: templateElement.size || { width: 100, height: 100 },
        rotation: 0,
        scale: 1,
        opacity: 1,
        locked: false,
        ...templateElement.properties
      }
      
      // Handle specific element types
      if (templateElement.type === 'text') {
        canvasElement.content = templateElement.properties.text || 'Text'
        canvasElement.fontSize = templateElement.properties.fontSize || 16
        canvasElement.fontFamily = templateElement.properties.fontFamily || 'Arial'
      } else if (templateElement.type === 'circle') {
        canvasElement.type = 'shape'
        canvasElement.shape = 'circle'
      }
      
      addElement(canvasElement)
      // Send creation operation to other users
      sendOperation({
        type: 'create',
        elementId: canvasElement.id,
        element: canvasElement
      })
    })
    
    setShowTemplateGallery(false)
    toast.success('Template loaded successfully')
  }, [canvasEngine, addElement, sendOperation, toast])
  
  // Handle text formatting
  const handleTextFormat = useCallback((format: 'bold' | 'italic' | 'underline') => {
    if (!textEditingManagerRef.current) return
    
    const activeObject = canvasEngine?.getCanvas().getActiveObject()
    if (activeObject && activeObject.type === 'i-text') {
      // Toggle the format
      const newFormats = { ...selectedTextFormats }
      newFormats[format] = !newFormats[format]
      setSelectedTextFormats(newFormats)
      
      // Apply format to text
      const activeObject = canvasEngine?.getCanvas()?.getActiveObject()
      if (activeObject && (activeObject.type === 'text' || activeObject.type === 'i-text')) {
        switch (format) {
          case 'bold':
            textEditingManagerRef.current.toggleBold(activeObject)
            break
          case 'italic':
            textEditingManagerRef.current.toggleItalic(activeObject)
            break
          case 'underline':
            textEditingManagerRef.current.toggleUnderline(activeObject)
            break
        }
      }
    } else {
      toast.info('Select text to apply formatting')
    }
  }, [canvasEngine, selectedTextFormats, toast])
  
  // Update text format state when selection changes
  useEffect(() => {
    if (!canvasEngine || !textEditingManagerRef.current) return
    
    const canvas = canvasEngine.getCanvas()
    const updateFormatState = () => {
      const activeObject = canvas.getActiveObject()
      if (activeObject && activeObject.type === 'i-text') {
        const textObj = activeObject as any
        setSelectedTextFormats({
          bold: textObj.fontWeight === 'bold',
          italic: textObj.fontStyle === 'italic',
          underline: textObj.underline || false
        })
      } else {
        setSelectedTextFormats({
          bold: false,
          italic: false,
          underline: false
        })
      }
    }
    
    canvas.on('selection:created', updateFormatState)
    canvas.on('selection:updated', updateFormatState)
    canvas.on('selection:cleared', updateFormatState)
    
    return () => {
      canvas.off('selection:created', updateFormatState)
      canvas.off('selection:updated', updateFormatState)
      canvas.off('selection:cleared', updateFormatState)
    }
  }, [canvasEngine])
  
  // Handle grid settings changes
  const handleGridToggle = useCallback((enabled: boolean) => {
    setGridEnabled(enabled)
    if (gridSnappingManagerRef.current) {
      if (enabled) {
        gridSnappingManagerRef.current.enable()
      } else {
        gridSnappingManagerRef.current.disable()
      }
    }
  }, [])
  
  const handleGridSizeChange = useCallback((size: number) => {
    setGridSize(size)
    if (gridSnappingManagerRef.current) {
      gridSnappingManagerRef.current.setGridSize(size)
    }
  }, [])

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
        onMouseDown={(e) => {
          // Handle text tool specially
          if (tool.type === 'text' && textEditingManagerRef.current) {
            const rect = containerRef.current?.getBoundingClientRect()
            if (rect) {
              const position = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
              }
              const textElement = textEditingManagerRef.current.createTextElement(position)
              // Start editing immediately
              const canvas = canvasEngine?.getCanvas()
              if (canvas) {
                const objects = canvas.getObjects()
                const textObject = objects.find((obj: any) => obj.elementId === textElement.id)
                if (textObject) {
                  canvas.setActiveObject(textObject)
                  canvas.renderAll()
                  if (textObject.type === 'i-text') {
                    (textObject as any).enterEditing()
                    (textObject as any).selectAll()
                  }
                }
              }
              return
            }
          }
          handleMouseDown(e)
        }}
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
        {isGridVisible && <Grid gridSize={gridSize} />}
        
        {/* Grid Alignment Guides */}
        <GridAlignmentGuides 
          horizontal={alignmentGuides.horizontal}
          vertical={alignmentGuides.vertical}
          bounds={{ width: window.innerWidth, height: window.innerHeight }}
        />
        
        {/* Grid Snap Indicator */}
        <GridSnapIndicator 
          isVisible={snapIndicator.visible}
          position={{ x: snapIndicator.x, y: snapIndicator.y }}
          size="md"
        />
        
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
        
        {/* Upload Progress Indicator */}
        <UploadProgress 
          isUploading={isUploading}
          fileName={uploadFileName}
          message="Uploading image..."
        />
        
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
          onGridToggle={() => setShowGridSettings(!showGridSettings)}
          gridEnabled={gridEnabled}
          onTemplateGallery={() => setShowTemplateGallery(true)}
          onTextFormat={handleTextFormat}
          selectedTextFormats={selectedTextFormats}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo()}
          canRedo={canRedo()}
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
      
      {/* Grid Settings Panel */}
      <GridSettings
        isOpen={showGridSettings}
        onClose={() => setShowGridSettings(false)}
        gridEnabled={gridEnabled}
        gridSize={gridSize}
        onGridToggle={handleGridToggle}
        onGridSizeChange={handleGridSizeChange}
      />
      
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
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Template Gallery */}
      {showTemplateGallery && (
        <TemplateGallery
          isOpen={showTemplateGallery}
          onClose={() => setShowTemplateGallery(false)}
          onSelectTemplate={handleTemplateSelect}
          currentBoardElements={[]}
        />
      )}
      
      {/* Performance Monitor */}
      <PerformanceMonitor
        engine={canvasEngine}
        isVisible={showPerformanceMonitor}
        onClose={() => setShowPerformanceMonitor(false)}
      />
      
      {/* Conflict Resolution UI */}
      <ConflictResolution
        crdtManager={null}
        isVisible={showConflictResolution}
        onClose={() => setShowConflictResolution(false)}
      />
      
      {/* Performance Toggle Button */}
      <button
        onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
        className="fixed top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow z-40"
        aria-label="Toggle performance monitor"
        title="Performance Monitor"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>
      
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