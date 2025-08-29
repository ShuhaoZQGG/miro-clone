import { useEffect, useRef, useCallback, useState, MouseEvent, KeyboardEvent } from 'react'
import { CanvasEngine } from '@/lib/canvas-engine'
import { ElementManager } from '@/lib/element-manager'
import { useCanvasStore } from '@/store/useCanvasStore'
import { Position, Tool } from '@/types'

interface UseCanvasOptions {
  boardId: string
  onElementCreate?: (element: any) => void
  onElementUpdate?: (element: any) => void
  onSelectionChange?: (selectedIds: string[]) => void
}

// Removed unused interface CanvasHandlers

export const useCanvas = (options: UseCanvasOptions) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasEngineRef = useRef<CanvasEngine | null>(null)
  const elementManagerRef = useRef<ElementManager | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  const {
    tool,
    camera,
    elements,
    selectedElementIds,
    updateCamera,
    addElement,
    setSelectedElements,
    clearSelection
  } = useCanvasStore()

  // Initialize canvas
  useEffect(() => {
    if (!containerRef.current || isInitialized) return

    try {
      const canvasEngine = new CanvasEngine(containerRef.current)
      const elementManager = new ElementManager(canvasEngine.getCanvas(), options.boardId)
      
      canvasEngineRef.current = canvasEngine
      elementManagerRef.current = elementManager
      
      // Set up canvas event listeners
      canvasEngine.on('pan', ({ position }) => {
        updateCamera({ x: position.x, y: position.y })
      })
      
      canvasEngine.on('zoom', ({ zoom }) => {
        updateCamera({ zoom })
      })
      
      // Sync initial camera state
      canvasEngine.panTo({ x: camera.x, y: camera.y })
      canvasEngine.zoomTo(camera.zoom)
      
      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize canvas:', error)
    }

    return () => {
      if (canvasEngineRef.current) {
        canvasEngineRef.current.dispose()
      }
    }
  }, [isInitialized, options.boardId, updateCamera, camera.x, camera.y, camera.zoom])

  // Sync camera changes to canvas engine
  useEffect(() => {
    if (!canvasEngineRef.current) return
    
    const currentCamera = canvasEngineRef.current.getCamera()
    if (currentCamera.x !== camera.x || currentCamera.y !== camera.y) {
      canvasEngineRef.current.panTo({ x: camera.x, y: camera.y })
    }
    if (currentCamera.zoom !== camera.zoom) {
      canvasEngineRef.current.zoomTo(camera.zoom)
    }
  }, [camera])

  // Sync elements to canvas
  useEffect(() => {
    if (!elementManagerRef.current) return
    
    // This is a simplified sync - in a real app you'd want more efficient updates
    const currentElements = elementManagerRef.current.getElements()
    const currentIds = currentElements.map(el => el.id)
    const newIds = elements.map(el => el.id)
    
    // Remove elements that no longer exist
    const removedIds = currentIds.filter(id => !newIds.includes(id))
    removedIds.forEach(id => elementManagerRef.current?.removeElement(id))
    
    // Add new elements (simplified - would need proper element recreation)
    // This would need proper implementation based on element types
  }, [elements])

  // Canvas interaction handlers
  const createElementAtPosition = useCallback((position: Position, tool: Tool) => {
    if (!elementManagerRef.current) return
    
    const canvasPosition = canvasEngineRef.current?.screenToCanvas(position) || position
    
    let newElement
    
    switch (tool.type) {
      case 'sticky_note':
        newElement = elementManagerRef.current.createStickyNote(canvasPosition)
        break
      case 'rectangle':
        newElement = elementManagerRef.current.createRectangle(canvasPosition)
        break
      case 'circle':
        newElement = elementManagerRef.current.createCircle(canvasPosition)
        break
      case 'text':
        newElement = elementManagerRef.current.createText(canvasPosition)
        break
      default:
        return
    }
    
    if (newElement) {
      addElement(newElement)
      setSelectedElements([newElement.id])
      options.onElementCreate?.(newElement)
    }
  }, [addElement, setSelectedElements, options])

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!canvasEngineRef.current) return
    
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
    
    // Handle different tools
    switch (tool.type) {
      case 'select':
        // Selection logic would go here
        break
      case 'pan':
        // Pan is handled by canvas engine
        break
      default:
        // Create element
        createElementAtPosition(position, tool)
        break
    }
  }, [tool, createElementAtPosition])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    // Handle mouse move for different tools (drag, resize, etc.)
    if (!canvasEngineRef.current) return
    
    // Update cursor position for collaboration
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      // This would emit cursor position to collaboration system
      // Implementation would go here
    }
  }, [])

  const handleMouseUp = useCallback((_event: MouseEvent) => {
    // Handle mouse up for different tools
  }, [])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!canvasEngineRef.current) return
    
    // Handle keyboard shortcuts
    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        if (selectedElementIds.length > 0) {
          selectedElementIds.forEach(id => {
            elementManagerRef.current?.removeElement(id)
          })
          clearSelection()
        }
        break
      case 'Escape':
        clearSelection()
        break
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          // Select all
          const allIds = elements.map(el => el.id)
          setSelectedElements(allIds)
          event.preventDefault()
        }
        break
      case '+':
      case '=':
        if (event.ctrlKey || event.metaKey) {
          const currentZoom = canvasEngineRef.current.getCamera().zoom
          canvasEngineRef.current.zoomTo(currentZoom * 1.2)
          event.preventDefault()
        }
        break
      case '-':
        if (event.ctrlKey || event.metaKey) {
          const currentZoom = canvasEngineRef.current.getCamera().zoom
          canvasEngineRef.current.zoomTo(currentZoom * 0.8)
          event.preventDefault()
        }
        break
      case '0':
        if (event.ctrlKey || event.metaKey) {
          canvasEngineRef.current.resetCamera()
          event.preventDefault()
        }
        break
    }
  }, [selectedElementIds, clearSelection, elements, setSelectedElements])

  const handleKeyUp = useCallback((_event: KeyboardEvent) => {
    // Handle key up events
  }, [])

  // Canvas utility methods
  const zoomIn = useCallback(() => {
    if (canvasEngineRef.current) {
      const currentZoom = canvasEngineRef.current.getCamera().zoom
      canvasEngineRef.current.zoomTo(currentZoom * 1.2)
    }
  }, [])

  const zoomOut = useCallback(() => {
    if (canvasEngineRef.current) {
      const currentZoom = canvasEngineRef.current.getCamera().zoom
      canvasEngineRef.current.zoomTo(currentZoom * 0.8)
    }
  }, [])

  const resetZoom = useCallback(() => {
    canvasEngineRef.current?.zoomTo(1)
  }, [])

  const fitToScreen = useCallback(() => {
    if (canvasEngineRef.current && elements.length > 0) {
      canvasEngineRef.current.fitToElements(elements)
    }
  }, [elements])

  const exportCanvas = useCallback(async (_format: 'png' | 'jpg' | 'svg' = 'png') => {
    if (!canvasEngineRef.current) return null
    
    // This would implement canvas export functionality
    // For now, return a placeholder
    return 'data:image/png;base64,placeholder'
  }, [])

  return {
    containerRef,
    isInitialized,
    
    // Handlers
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleKeyDown,
    handleKeyUp,
    
    // Utilities
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    exportCanvas,
    
    // Engine access (use carefully)
    canvasEngine: canvasEngineRef.current,
    elementManager: elementManagerRef.current
  }
}