import { useEffect, useCallback } from 'react'
import { useCanvasStore, useCanvasActions } from '@/store/useCanvasStore'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  handler: () => void
  preventDefault?: boolean
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[] = []) => {
  const { tool, setTool, clearSelection } = useCanvasStore()
  const { deleteSelectedElements, selectAll, duplicateElements } = useCanvasActions()
  const selectedElementIds = useCanvasStore(state => state.selectedElementIds)

  // Default shortcuts
  const defaultShortcuts: KeyboardShortcut[] = [
    // Tool shortcuts
    { key: 'v', handler: () => setTool({ type: 'select' }) },
    { key: 's', handler: () => setTool({ type: 'sticky_note' }) },
    { key: 'r', handler: () => setTool({ type: 'rectangle' }) },
    { key: 'c', handler: () => setTool({ type: 'circle' }) },
    { key: 't', handler: () => setTool({ type: 'text' }) },
    { key: 'h', handler: () => setTool({ type: 'pan' }) },
    
    // Selection shortcuts
    { key: 'Escape', handler: () => clearSelection() },
    { key: 'a', ctrlKey: true, handler: () => selectAll(), preventDefault: true },
    { key: 'a', metaKey: true, handler: () => selectAll(), preventDefault: true },
    
    // Edit shortcuts
    { key: 'Delete', handler: () => deleteSelectedElements() },
    { key: 'Backspace', handler: () => deleteSelectedElements() },
    { 
      key: 'd', 
      ctrlKey: true, 
      handler: () => {
        if (selectedElementIds.length > 0) {
          duplicateElements(selectedElementIds)
        }
      },
      preventDefault: true
    },
    { 
      key: 'd', 
      metaKey: true, 
      handler: () => {
        if (selectedElementIds.length > 0) {
          duplicateElements(selectedElementIds)
        }
      },
      preventDefault: true
    }
  ]

  const allShortcuts = [...defaultShortcuts, ...shortcuts]

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle shortcuts when user is typing in an input
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target as HTMLElement)?.isContentEditable
    ) {
      return
    }

    for (const shortcut of allShortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey
      const metaMatches = !!shortcut.metaKey === event.metaKey
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey
      const altMatches = !!shortcut.altKey === event.altKey

      if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
        if (shortcut.preventDefault) {
          event.preventDefault()
        }
        shortcut.handler()
        break
      }
    }
  }, [allShortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    currentTool: tool.type
  }
}

// Hook for displaying keyboard shortcuts help
export const useShortcutHelp = () => {
  const shortcuts = [
    { category: 'Tools', items: [
      { key: 'V', description: 'Select tool' },
      { key: 'S', description: 'Sticky note' },
      { key: 'R', description: 'Rectangle' },
      { key: 'C', description: 'Circle' },
      { key: 'T', description: 'Text' },
      { key: 'H', description: 'Hand tool (pan)' }
    ]},
    { category: 'Selection', items: [
      { key: 'Ctrl+A', description: 'Select all' },
      { key: 'Esc', description: 'Clear selection' }
    ]},
    { category: 'Edit', items: [
      { key: 'Delete', description: 'Delete selected' },
      { key: 'Ctrl+D', description: 'Duplicate selected' }
    ]},
    { category: 'View', items: [
      { key: 'Ctrl++', description: 'Zoom in' },
      { key: 'Ctrl+-', description: 'Zoom out' },
      { key: 'Ctrl+0', description: 'Reset zoom' }
    ]}
  ]

  return shortcuts
}