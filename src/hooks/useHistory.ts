import { useRef, useCallback, useEffect } from 'react'
import { HistoryManager } from '@/lib/history-manager'
import { useCanvasStore } from '@/store/useCanvasStore'
import { CanvasElement } from '@/types'

export const useHistory = () => {
  const historyManagerRef = useRef<HistoryManager>(new HistoryManager())
  const { 
    elements,
    addElement, 
    updateElement, 
    removeElement,
    setElements 
  } = useCanvasStore()

  // Track element creation
  const trackElementCreation = useCallback((element: CanvasElement) => {
    const command = historyManagerRef.current.createElementCommand('create', {
      element,
      onExecute: (el) => addElement(el as CanvasElement),
      onUndo: (id) => removeElement(id as string)
    })
    
    historyManagerRef.current.execute(command)
  }, [addElement, removeElement])

  // Track element update
  const trackElementUpdate = useCallback((
    elementId: string, 
    oldState: Partial<CanvasElement>, 
    newState: Partial<CanvasElement>
  ) => {
    const command = historyManagerRef.current.createElementCommand('update', {
      elementId,
      oldState,
      newState,
      onExecute: (id, state) => updateElement(id as string, state),
      onUndo: (id, state) => updateElement(id as string, state)
    })
    
    historyManagerRef.current.execute(command)
  }, [updateElement])

  // Track element deletion
  const trackElementDeletion = useCallback((element: CanvasElement) => {
    const command = historyManagerRef.current.createElementCommand('delete', {
      element,
      onExecute: (id) => removeElement(id as string),
      onUndo: (el) => addElement(el as CanvasElement)
    })
    
    historyManagerRef.current.execute(command)
  }, [addElement, removeElement])

  // Track batch operations
  const trackBatchOperation = useCallback((operations: Array<{
    type: 'create' | 'update' | 'delete'
    element?: CanvasElement
    elementId?: string
    oldState?: Partial<CanvasElement>
    newState?: Partial<CanvasElement>
  }>) => {
    const commands = operations.map(op => {
      switch (op.type) {
        case 'create':
          return historyManagerRef.current.createElementCommand('create', {
            element: op.element,
            onExecute: (el) => addElement(el as CanvasElement),
            onUndo: (id) => removeElement(id as string)
          })
        case 'update':
          return historyManagerRef.current.createElementCommand('update', {
            elementId: op.elementId,
            oldState: op.oldState,
            newState: op.newState,
            onExecute: (id, state) => updateElement(id as string, state),
            onUndo: (id, state) => updateElement(id as string, state)
          })
        case 'delete':
          return historyManagerRef.current.createElementCommand('delete', {
            element: op.element,
            onExecute: (id) => removeElement(id as string),
            onUndo: (el) => addElement(el as CanvasElement)
          })
        default:
          throw new Error(`Unknown operation type: ${op.type}`)
      }
    })

    const batchCommand = historyManagerRef.current.createBatchCommand(commands)
    historyManagerRef.current.execute(batchCommand)
  }, [addElement, updateElement, removeElement])

  // Undo/Redo functions
  const undo = useCallback(() => {
    return historyManagerRef.current.undo()
  }, [])

  const redo = useCallback(() => {
    return historyManagerRef.current.redo()
  }, [])

  const canUndo = useCallback(() => {
    return historyManagerRef.current.canUndo()
  }, [])

  const canRedo = useCallback(() => {
    return historyManagerRef.current.canRedo()
  }, [])

  const clearHistory = useCallback(() => {
    historyManagerRef.current.clear()
  }, [])

  const getHistoryState = useCallback(() => {
    return historyManagerRef.current.getState()
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifierKey = isMac ? e.metaKey : e.ctrlKey

      if (modifierKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (modifierKey && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
      } else if (modifierKey && e.key === 'y') {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  return {
    trackElementCreation,
    trackElementUpdate,
    trackElementDeletion,
    trackBatchOperation,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    getHistoryState,
    historyManager: historyManagerRef.current
  }
}