import { useCanvasStore } from '@/store/useCanvasStore'
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
      
      // Get fresh state after the action
      const newState = useCanvasStore.getState()
      expect(newState.elements).toHaveLength(1)
      expect(newState.elements[0]).toEqual(mockStickyNote)
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
      
      const newState = useCanvasStore.getState()
      const updatedElement = newState.elements[0] as any
      expect(updatedElement.position).toEqual({ x: 150, y: 250 })
      expect(updatedElement.content.text).toBe('Updated text')
      expect(updatedElement.updatedAt).not.toBe(mockStickyNote.updatedAt)
    })

    it('should remove elements from the store', () => {
      const store = useCanvasStore.getState()
      
      store.addElement(mockStickyNote)
      store.addElement(mockRectangle)
      let state = useCanvasStore.getState()
      expect(state.elements).toHaveLength(2)
      
      store.removeElement(mockStickyNote.id)
      
      state = useCanvasStore.getState()
      expect(state.elements).toHaveLength(1)
      expect(state.elements[0].id).toBe(mockRectangle.id)
    })

    it('should set multiple elements at once', () => {
      const store = useCanvasStore.getState()
      const elements = [mockStickyNote, mockRectangle]
      
      store.setElements(elements)
      
      const newState = useCanvasStore.getState()
      expect(newState.elements).toHaveLength(2)
      expect(newState.elements).toEqual(elements)
    })
  })

  describe('Selection Management', () => {
    it('should select individual elements', () => {
      const store = useCanvasStore.getState()
      store.addElement(mockStickyNote)
      
      store.selectElement(mockStickyNote.id)
      
      const state = useCanvasStore.getState()
      expect(state.selectedElementIds).toContain(mockStickyNote.id)
      expect(state.selectedElementIds).toHaveLength(1)
    })

    it('should select multiple elements', () => {
      const store = useCanvasStore.getState()
      store.addElement(mockStickyNote)
      store.addElement(mockRectangle)
      
      store.selectElement(mockStickyNote.id)
      store.selectElement(mockRectangle.id)
      
      const state = useCanvasStore.getState()
      expect(state.selectedElementIds).toHaveLength(2)
      expect(state.selectedElementIds).toContain(mockStickyNote.id)
      expect(state.selectedElementIds).toContain(mockRectangle.id)
    })

    it('should not duplicate selection of the same element', () => {
      const store = useCanvasStore.getState()
      store.addElement(mockStickyNote)
      
      store.selectElement(mockStickyNote.id)
      store.selectElement(mockStickyNote.id) // Try to select again
      
      const state = useCanvasStore.getState()
      expect(state.selectedElementIds).toHaveLength(1)
    })

    it('should deselect individual elements', () => {
      const store = useCanvasStore.getState()
      store.addElement(mockStickyNote)
      store.addElement(mockRectangle)
      store.selectElement(mockStickyNote.id)
      store.selectElement(mockRectangle.id)
      
      store.deselectElement(mockStickyNote.id)
      
      const state = useCanvasStore.getState()
      expect(state.selectedElementIds).toHaveLength(1)
      expect(state.selectedElementIds[0]).toBe(mockRectangle.id)
    })

    it('should clear all selections', () => {
      const store = useCanvasStore.getState()
      store.addElement(mockStickyNote)
      store.addElement(mockRectangle)
      store.selectElement(mockStickyNote.id)
      store.selectElement(mockRectangle.id)
      
      store.clearSelection()
      
      const state = useCanvasStore.getState()
      expect(state.selectedElementIds).toHaveLength(0)
    })

    it('should remove element from selection when element is deleted', () => {
      const store = useCanvasStore.getState()
      store.addElement(mockStickyNote)
      store.selectElement(mockStickyNote.id)
      
      let state = useCanvasStore.getState()
      expect(state.selectedElementIds).toContain(mockStickyNote.id)
      
      store.removeElement(mockStickyNote.id)
      
      state = useCanvasStore.getState()
      expect(state.selectedElementIds).not.toContain(mockStickyNote.id)
    })
  })

  describe('Camera Management', () => {
    it('should update camera position and zoom', () => {
      const store = useCanvasStore.getState()
      const newCamera = { x: 100, y: 200, zoom: 1.5 }
      
      store.setCamera(newCamera)
      
      const state = useCanvasStore.getState()
      expect(state.camera).toEqual(newCamera)
    })

    it('should partially update camera properties', () => {
      const store = useCanvasStore.getState()
      
      store.updateCamera({ zoom: 2.0 })
      
      const state = useCanvasStore.getState()
      expect(state.camera.zoom).toBe(2.0)
      expect(state.camera.x).toBe(0) // Should remain unchanged
      expect(state.camera.y).toBe(0) // Should remain unchanged
    })
  })

  describe('Tool Management', () => {
    it('should set the active tool', () => {
      const store = useCanvasStore.getState()
      
      store.setTool({ type: 'sticky_note' })
      
      const state = useCanvasStore.getState()
      expect(state.tool.type).toBe('sticky_note')
    })

    it('should set tool with options', () => {
      const store = useCanvasStore.getState()
      
      const toolWithOptions = {
        type: 'rectangle' as const,
        options: {
          fill: '#FF0000',
          stroke: '#000000',
          strokeWidth: 2
        }
      }
      
      store.setTool(toolWithOptions)
      
      const state = useCanvasStore.getState()
      expect(state.tool).toEqual(toolWithOptions)
    })
  })

  describe('UI State Management', () => {
    it('should toggle grid visibility', () => {
      const store = useCanvasStore.getState()
      const initialVisible = useCanvasStore.getState().isGridVisible
      
      store.toggleGrid()
      
      const state = useCanvasStore.getState()
      expect(state.isGridVisible).toBe(!initialVisible)
    })

    it('should toggle snap to grid', () => {
      const store = useCanvasStore.getState()
      const initialSnap = useCanvasStore.getState().snapToGrid
      
      store.toggleSnapToGrid()
      
      const state = useCanvasStore.getState()
      expect(state.snapToGrid).toBe(!initialSnap)
    })

    it('should set loading state', () => {
      const store = useCanvasStore.getState()
      
      store.setIsLoading(true)
      let state = useCanvasStore.getState()
      expect(state.isLoading).toBe(true)
      
      store.setIsLoading(false)
      state = useCanvasStore.getState()
      expect(state.isLoading).toBe(false)
    })
  })

  describe('Collaboration Management', () => {
    it('should manage collaborator presence', () => {
      const store = useCanvasStore.getState()
      
      const presence = {
        userId: 'user-123',
        cursor: { x: 100, y: 200 },
        isActive: true,
        lastSeen: '2025-08-29T12:00:00Z'
      }
      
      store.updateCollaborator(presence.userId, presence)
      
      const state = useCanvasStore.getState()
      expect(state.collaborators.get(presence.userId)).toMatchObject(presence)
    })

    it('should update existing collaborator presence', () => {
      const store = useCanvasStore.getState()
      
      const initial = {
        userId: 'user-123',
        cursor: { x: 100, y: 200 },
        isActive: true,
        lastSeen: '2025-08-29T12:00:00Z'
      }
      
      store.updateCollaborator(initial.userId, initial)
      
      const update = {
        cursor: { x: 300, y: 400 }
      }
      
      store.updateCollaborator(initial.userId, update)
      
      const state = useCanvasStore.getState()
      const updated = state.collaborators.get(initial.userId)
      expect(updated?.cursor).toEqual(update.cursor)
      expect(updated?.userId).toBe(initial.userId) // Should remain unchanged
    })

    it('should remove collaborators', () => {
      const store = useCanvasStore.getState()
      
      const presence = {
        userId: 'user-123',
        cursor: { x: 100, y: 200 },
        isActive: true,
        lastSeen: '2025-08-29T12:00:00Z'
      }
      
      store.updateCollaborator(presence.userId, presence)
      store.removeCollaborator(presence.userId)
      
      const state = useCanvasStore.getState()
      expect(state.collaborators.has(presence.userId)).toBe(false)
    })

    it('should set connection status', () => {
      const store = useCanvasStore.getState()
      
      store.setConnectionStatus(true)
      let state = useCanvasStore.getState()
      expect(state.isConnected).toBe(true)
      
      store.setConnectionStatus(false)
      state = useCanvasStore.getState()
      expect(state.isConnected).toBe(false)
    })
  })

  describe('Store Persistence', () => {
    it('should maintain state between updates', () => {
      const store = useCanvasStore.getState()
      
      // Set various state properties
      store.addElement(mockStickyNote)
      store.selectElement(mockStickyNote.id)
      store.setCamera({ x: 50, y: 50, zoom: 1.2 })
      store.setTool({ type: 'circle' })
      const initialGrid = useCanvasStore.getState().isGridVisible
      store.toggleGrid()
      
      // Verify all state is maintained
      const state = useCanvasStore.getState()
      expect(state.elements).toHaveLength(1)
      expect(state.selectedElementIds).toContain(mockStickyNote.id)
      expect(state.camera).toEqual({ x: 50, y: 50, zoom: 1.2 })
      expect(state.tool.type).toBe('circle')
      expect(state.isGridVisible).toBe(!initialGrid) // Toggled from initial state
    })
  })
})

describe('Canvas Actions', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useCanvasStore.getState()
    store.setElements([])
    store.clearSelection()
    store.setTool({ type: 'select' })
  })

  describe('Element Operations', () => {
    it('should create elements through actions', () => {
      const { createElement } = useCanvasActions()
      
      const element = createElement('sticky_note', { x: 100, y: 100 })
      
      const state = useCanvasStore.getState()
      expect(state.elements).toHaveLength(1)
      expect(state.elements[0].type).toBe('sticky_note')
      expect(element).toBeDefined()
    })

    it('should duplicate selected elements', () => {
      const store = useCanvasStore.getState()
      const { duplicateSelected } = useCanvasActions()
      
      store.addElement(mockStickyNote)
      store.selectElement(mockStickyNote.id)
      
      duplicateSelected()
      
      const state = useCanvasStore.getState()
      expect(state.elements).toHaveLength(2)
      expect(state.elements[1].type).toBe(mockStickyNote.type)
      expect(state.elements[1].id).not.toBe(mockStickyNote.id)
    })

    it('should move elements by delta', () => {
      const store = useCanvasStore.getState()
      const { moveElements } = useCanvasActions()
      
      store.addElement(mockStickyNote)
      
      moveElements([mockStickyNote.id], { x: 50, y: 50 })
      
      const state = useCanvasStore.getState()
      expect(state.elements[0].position).toEqual({ 
        x: mockStickyNote.position.x + 50, 
        y: mockStickyNote.position.y + 50 
      })
    })

    it('should delete selected elements', () => {
      const store = useCanvasStore.getState()
      const { deleteSelected } = useCanvasActions()
      
      store.addElement(mockStickyNote)
      store.addElement(mockRectangle)
      store.selectElement(mockStickyNote.id)
      
      deleteSelected()
      
      const state = useCanvasStore.getState()
      expect(state.elements).toHaveLength(1)
      expect(state.elements[0].id).toBe(mockRectangle.id)
      expect(state.selectedElementIds).toHaveLength(0)
    })

    it('should select all elements', () => {
      const store = useCanvasStore.getState()
      const { selectAll } = useCanvasActions()
      
      store.addElement(mockStickyNote)
      store.addElement(mockRectangle)
      
      selectAll()
      
      const state = useCanvasStore.getState()
      expect(state.selectedElementIds).toHaveLength(2)
      expect(state.selectedElementIds).toContain(mockStickyNote.id)
      expect(state.selectedElementIds).toContain(mockRectangle.id)
    })
  })
})

// Canvas actions hook
function useCanvasActions() {
  const store = useCanvasStore.getState()
  
  return {
    createElement: (type: string, position: { x: number, y: number }) => {
      const element: CanvasElement = {
        id: `element-${Date.now()}`,
        type: type as any,
        boardId: 'test-board',
        position,
        size: { width: 200, height: 150 },
        rotation: 0,
        layerIndex: store.elements.length,
        createdBy: 'test-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isVisible: true,
        isLocked: false,
        content: type === 'sticky_note' ? {
          text: '',
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#000000',
          backgroundColor: '#FEF08A'
        } : undefined,
        style: type === 'rectangle' ? {
          fill: '#E5E7EB',
          stroke: '#374151',
          strokeWidth: 2,
          opacity: 1
        } : undefined
      } as CanvasElement
      
      store.addElement(element)
      return element
    },
    
    duplicateSelected: () => {
      const state = useCanvasStore.getState()
      const selectedElements = state.elements.filter(el => 
        state.selectedElementIds.includes(el.id)
      )
      
      selectedElements.forEach(el => {
        const duplicate = {
          ...el,
          id: `${el.id}-copy-${Date.now()}`,
          position: {
            x: el.position.x + 20,
            y: el.position.y + 20
          }
        }
        store.addElement(duplicate)
      })
    },
    
    moveElements: (ids: string[], delta: { x: number, y: number }) => {
      ids.forEach(id => {
        const element = useCanvasStore.getState().elements.find(el => el.id === id)
        if (element) {
          store.updateElement(id, {
            position: {
              x: element.position.x + delta.x,
              y: element.position.y + delta.y
            }
          })
        }
      })
    },
    
    deleteSelected: () => {
      const state = useCanvasStore.getState()
      state.selectedElementIds.forEach(id => store.removeElement(id))
    },
    
    selectAll: () => {
      const state = useCanvasStore.getState()
      store.setSelectedElements(state.elements.map(el => el.id))
    }
  }
}