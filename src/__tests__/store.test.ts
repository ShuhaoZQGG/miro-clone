import { useCanvasStore, useCanvasActions } from '@/store/useCanvasStore'
import { CanvasElement } from '@/types'

// Mock element for testing
const mockStickyNote: CanvasElement = {
  id: 'test-sticky-1',
  type: 'sticky_note',
  boardId: 'test-board',
  position: { x: 100, y: 200 },
  size: { width: 200, height: 150 },
  rotation: 0,
  layerIndex: 0,
  createdBy: 'test-user',
  createdAt: '2025-08-29T12:00:00Z',
  updatedAt: '2025-08-29T12:00:00Z',
  isVisible: true,
  isLocked: false,
  content: {
    text: 'Test note',
    fontSize: 14,
    fontFamily: 'Arial',
    color: '#000000',
    backgroundColor: '#FEF08A'
  }
}

const mockRectangle: CanvasElement = {
  id: 'test-rect-1',
  type: 'rectangle',
  boardId: 'test-board',
  position: { x: 300, y: 400 },
  size: { width: 100, height: 100 },
  rotation: 0,
  layerIndex: 1,
  createdBy: 'test-user',
  createdAt: '2025-08-29T12:01:00Z',
  updatedAt: '2025-08-29T12:01:00Z',
  isVisible: true,
  isLocked: false,
  style: {
    fill: '#E5E7EB',
    stroke: '#374151',
    strokeWidth: 2,
    opacity: 1
  }
}

describe('Canvas Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useCanvasStore.getState()
    store.setElements([])
    store.clearSelection()
    store.setTool({ type: 'select' })
    store.setCamera({ x: 0, y: 0, zoom: 1 })
    store.setIsLoading(false)
    store.setCollaborators(new Map())
    store.setConnectionStatus(false)
  })

  describe('Element Management', () => {
    it('should add elements to the store', () => {
      const store = useCanvasStore.getState()
      
      store.addElement(mockStickyNote)
      
      expect(store.elements).toHaveLength(1)
      expect(store.elements[0]).toEqual(mockStickyNote)
    })

    it('should update existing elements', () => {
      const store = useCanvasStore.getState()
      
      store.addElement(mockStickyNote)
      
      const updates = {
        position: { x: 150, y: 250 },
        content: {
          ...mockStickyNote.content,
          text: 'Updated text'
        }
      }
      
      store.updateElement(mockStickyNote.id, updates)
      
      const updatedElement = store.elements[0] as any
      expect(updatedElement.position).toEqual({ x: 150, y: 250 })
      expect(updatedElement.content.text).toBe('Updated text')
      expect(updatedElement.updatedAt).not.toBe(mockStickyNote.updatedAt)
    })

    it('should remove elements from the store', () => {
      const store = useCanvasStore.getState()
      
      store.addElement(mockStickyNote)
      store.addElement(mockRectangle)
      expect(store.elements).toHaveLength(2)
      
      store.removeElement(mockStickyNote.id)
      
      expect(store.elements).toHaveLength(1)
      expect(store.elements[0].id).toBe(mockRectangle.id)
    })

    it('should set multiple elements at once', () => {
      const store = useCanvasStore.getState()
      const elements = [mockStickyNote, mockRectangle]
      
      store.setElements(elements)
      
      expect(store.elements).toHaveLength(2)
      expect(store.elements).toEqual(elements)
    })
  })

  describe('Selection Management', () => {
    it('should select individual elements', () => {
      const store = useCanvasStore.getState()
      
      store.selectElement(mockStickyNote.id)
      
      expect(store.selectedElementIds).toContain(mockStickyNote.id)
      expect(store.selectedElementIds).toHaveLength(1)
    })

    it('should select multiple elements', () => {
      const store = useCanvasStore.getState()
      
      store.selectElement(mockStickyNote.id)
      store.selectElement(mockRectangle.id)
      
      expect(store.selectedElementIds).toHaveLength(2)
      expect(store.selectedElementIds).toContain(mockStickyNote.id)
      expect(store.selectedElementIds).toContain(mockRectangle.id)
    })

    it('should not duplicate selection of the same element', () => {
      const store = useCanvasStore.getState()
      
      store.selectElement(mockStickyNote.id)
      store.selectElement(mockStickyNote.id)
      
      expect(store.selectedElementIds).toHaveLength(1)
    })

    it('should deselect individual elements', () => {
      const store = useCanvasStore.getState()
      
      store.setSelectedElements([mockStickyNote.id, mockRectangle.id])
      store.deselectElement(mockStickyNote.id)
      
      expect(store.selectedElementIds).toHaveLength(1)
      expect(store.selectedElementIds[0]).toBe(mockRectangle.id)
    })

    it('should clear all selections', () => {
      const store = useCanvasStore.getState()
      
      store.setSelectedElements([mockStickyNote.id, mockRectangle.id])
      store.clearSelection()
      
      expect(store.selectedElementIds).toHaveLength(0)
    })

    it('should remove element from selection when element is deleted', () => {
      const store = useCanvasStore.getState()
      
      store.addElement(mockStickyNote)
      store.selectElement(mockStickyNote.id)
      expect(store.selectedElementIds).toContain(mockStickyNote.id)
      
      store.removeElement(mockStickyNote.id)
      
      expect(store.selectedElementIds).not.toContain(mockStickyNote.id)
    })
  })

  describe('Camera Management', () => {
    it('should update camera position and zoom', () => {
      const store = useCanvasStore.getState()
      
      const newCamera = { x: 100, y: 200, zoom: 1.5 }
      store.setCamera(newCamera)
      
      expect(store.camera).toEqual(newCamera)
    })

    it('should partially update camera properties', () => {
      const store = useCanvasStore.getState()
      
      store.updateCamera({ zoom: 2.0 })
      
      expect(store.camera.zoom).toBe(2.0)
      expect(store.camera.x).toBe(0) // Should remain unchanged
      expect(store.camera.y).toBe(0) // Should remain unchanged
    })
  })

  describe('Tool Management', () => {
    it('should set the active tool', () => {
      const store = useCanvasStore.getState()
      
      store.setTool({ type: 'sticky_note' })
      
      expect(store.tool.type).toBe('sticky_note')
    })

    it('should set tool with options', () => {
      const store = useCanvasStore.getState()
      
      const toolWithOptions = { 
        type: 'rectangle' as const,
        options: { 
          fill: '#FF0000',
          strokeWidth: 3
        }
      }
      
      store.setTool(toolWithOptions)
      
      expect(store.tool).toEqual(toolWithOptions)
    })
  })

  describe('UI State Management', () => {
    it('should toggle grid visibility', () => {
      const store = useCanvasStore.getState()
      
      const initialVisible = store.isGridVisible
      store.toggleGrid()
      
      expect(store.isGridVisible).toBe(!initialVisible)
    })

    it('should toggle snap to grid', () => {
      const store = useCanvasStore.getState()
      
      const initialSnap = store.snapToGrid
      store.toggleSnapToGrid()
      
      expect(store.snapToGrid).toBe(!initialSnap)
    })

    it('should set loading state', () => {
      const store = useCanvasStore.getState()
      
      store.setIsLoading(true)
      expect(store.isLoading).toBe(true)
      
      store.setIsLoading(false)
      expect(store.isLoading).toBe(false)
    })
  })

  describe('Collaboration Management', () => {
    it('should manage collaborator presence', () => {
      const store = useCanvasStore.getState()
      
      const userId = 'user-123'
      const presence = {
        userId,
        isActive: true,
        lastSeen: new Date().toISOString(),
        cursor: { x: 100, y: 200 }
      }
      
      store.updateCollaborator(userId, presence)
      
      expect(store.collaborators.has(userId)).toBe(true)
      expect(store.collaborators.get(userId)).toEqual(presence)
    })

    it('should update existing collaborator presence', () => {
      const store = useCanvasStore.getState()
      
      const userId = 'user-123'
      
      // First update
      store.updateCollaborator(userId, {
        userId,
        isActive: true,
        lastSeen: '2025-08-29T12:00:00Z'
      })
      
      // Second update
      store.updateCollaborator(userId, {
        cursor: { x: 150, y: 250 },
        isActive: false
      })
      
      const collaborator = store.collaborators.get(userId)!
      expect(collaborator.cursor).toEqual({ x: 150, y: 250 })
      expect(collaborator.isActive).toBe(false)
      expect(collaborator.userId).toBe(userId)
    })

    it('should remove collaborators', () => {
      const store = useCanvasStore.getState()
      
      const userId = 'user-123'
      store.updateCollaborator(userId, { userId, isActive: true, lastSeen: new Date().toISOString() })
      expect(store.collaborators.has(userId)).toBe(true)
      
      store.removeCollaborator(userId)
      expect(store.collaborators.has(userId)).toBe(false)
    })

    it('should set connection status', () => {
      const store = useCanvasStore.getState()
      
      store.setConnectionStatus(true)
      expect(store.isConnected).toBe(true)
      
      store.setConnectionStatus(false)
      expect(store.isConnected).toBe(false)
    })
  })

  describe('Store Persistence', () => {
    it('should maintain state between updates', () => {
      const store = useCanvasStore.getState()
      
      // Set up initial state
      store.addElement(mockStickyNote)
      store.selectElement(mockStickyNote.id)
      store.setTool({ type: 'rectangle' })
      store.updateCamera({ zoom: 1.5 })
      
      // Perform another operation
      store.addElement(mockRectangle)
      
      // Previous state should be maintained
      expect(store.elements).toHaveLength(2)
      expect(store.selectedElementIds).toContain(mockStickyNote.id)
      expect(store.tool.type).toBe('rectangle')
      expect(store.camera.zoom).toBe(1.5)
    })
  })
})

describe('Canvas Actions', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useCanvasStore.getState()
    store.setElements([])
    store.clearSelection()
  })

  describe('Element Operations', () => {
    it('should create elements through actions', () => {
      const actions = useCanvasActions()
      
      actions.createElement(mockStickyNote)
      
      const store = useCanvasStore.getState()
      expect(store.elements).toContain(mockStickyNote)
    })

    it('should duplicate selected elements', () => {
      const store = useCanvasStore.getState()
      const actions = useCanvasActions()
      
      store.addElement(mockStickyNote)
      store.selectElement(mockStickyNote.id)
      
      actions.duplicateElements([mockStickyNote.id])
      
      expect(store.elements).toHaveLength(2)
      expect(store.selectedElementIds).toHaveLength(1) // Should select the duplicated element
      
      const originalElement = store.elements.find(el => el.id === mockStickyNote.id)!
      const duplicatedElement = store.elements.find(el => el.id !== mockStickyNote.id)!
      
      expect(originalElement.position).toEqual({ x: 100, y: 200 })
      expect(duplicatedElement.position).toEqual({ x: 120, y: 220 }) // Offset by 20px
    })

    it('should move elements by delta', () => {
      const store = useCanvasStore.getState()
      const actions = useCanvasActions()
      
      store.addElement(mockStickyNote)
      
      actions.moveElements([mockStickyNote.id], { x: 50, y: -30 })
      
      const movedElement = store.elements[0]
      expect(movedElement.position).toEqual({ x: 150, y: 170 })
    })

    it('should delete selected elements', () => {
      const store = useCanvasStore.getState()
      const actions = useCanvasActions()
      
      store.addElement(mockStickyNote)
      store.addElement(mockRectangle)
      store.setSelectedElements([mockStickyNote.id])
      
      actions.deleteSelectedElements()
      
      expect(store.elements).toHaveLength(1)
      expect(store.elements[0].id).toBe(mockRectangle.id)
      expect(store.selectedElementIds).toHaveLength(0)
    })

    it('should select all elements', () => {
      const store = useCanvasStore.getState()
      const actions = useCanvasActions()
      
      store.addElement(mockStickyNote)
      store.addElement(mockRectangle)
      
      actions.selectAll()
      
      expect(store.selectedElementIds).toHaveLength(2)
      expect(store.selectedElementIds).toContain(mockStickyNote.id)
      expect(store.selectedElementIds).toContain(mockRectangle.id)
    })
  })
})