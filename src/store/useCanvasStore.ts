import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { CanvasElement, Tool, Camera, Position, UserPresence } from '@/types'

interface CanvasState {
  // Canvas state
  elements: CanvasElement[]
  selectedElementIds: string[]
  camera: Camera
  tool: Tool
  
  // UI state
  isGridVisible: boolean
  snapToGrid: boolean
  isLoading: boolean
  
  // Collaboration
  collaborators: Map<string, UserPresence>
  isConnected: boolean
  
  // Actions
  setElements: (elements: CanvasElement[]) => void
  addElement: (element: CanvasElement) => void
  updateElement: (id: string, updates: Partial<CanvasElement>) => void
  removeElement: (id: string) => void
  setSelectedElements: (ids: string[]) => void
  selectElement: (id: string) => void
  deselectElement: (id: string) => void
  clearSelection: () => void
  
  setCamera: (camera: Camera) => void
  updateCamera: (updates: Partial<Camera>) => void
  
  setTool: (tool: Tool) => void
  
  toggleGrid: () => void
  toggleSnapToGrid: () => void
  setIsLoading: (loading: boolean) => void
  
  // Collaboration actions
  setCollaborators: (collaborators: Map<string, UserPresence>) => void
  updateCollaborator: (userId: string, presence: Partial<UserPresence>) => void
  removeCollaborator: (userId: string) => void
  setConnectionStatus: (connected: boolean) => void
}

export const useCanvasStore = create<CanvasState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    elements: [],
    selectedElementIds: [],
    camera: { x: 0, y: 0, zoom: 1 },
    tool: { type: 'select' },
    
    isGridVisible: true,
    snapToGrid: false,
    isLoading: false,
    
    collaborators: new Map(),
    isConnected: false,
    
    // Element actions
    setElements: (elements) => set({ elements }),
    
    addElement: (element) => set((state) => ({
      elements: [...state.elements, element]
    })),
    
    updateElement: (id, updates) => set((state) => ({
      elements: state.elements.map(element =>
        element.id === id 
          ? { ...element, ...updates, updatedAt: new Date().toISOString() }
          : element
      )
    })),
    
    removeElement: (id) => set((state) => ({
      elements: state.elements.filter(element => element.id !== id),
      selectedElementIds: state.selectedElementIds.filter(selectedId => selectedId !== id)
    })),
    
    // Selection actions
    setSelectedElements: (ids) => set({ selectedElementIds: ids }),
    
    selectElement: (id) => set((state) => {
      if (!state.selectedElementIds.includes(id)) {
        return { selectedElementIds: [...state.selectedElementIds, id] }
      }
      return state
    }),
    
    deselectElement: (id) => set((state) => ({
      selectedElementIds: state.selectedElementIds.filter(selectedId => selectedId !== id)
    })),
    
    clearSelection: () => set({ selectedElementIds: [] }),
    
    // Camera actions
    setCamera: (camera) => set({ camera }),
    
    updateCamera: (updates) => set((state) => ({
      camera: { ...state.camera, ...updates }
    })),
    
    // Tool actions
    setTool: (tool) => set({ tool }),
    
    // UI actions
    toggleGrid: () => set((state) => ({ isGridVisible: !state.isGridVisible })),
    
    toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
    
    setIsLoading: (isLoading) => set({ isLoading }),
    
    // Collaboration actions
    setCollaborators: (collaborators) => set({ collaborators }),
    
    updateCollaborator: (userId, presence) => set((state) => {
      const newCollaborators = new Map(state.collaborators)
      const existingPresence = newCollaborators.get(userId)
      if (existingPresence) {
        newCollaborators.set(userId, { ...existingPresence, ...presence })
      } else {
        newCollaborators.set(userId, {
          userId,
          isActive: true,
          lastSeen: new Date().toISOString(),
          ...presence
        })
      }
      return { collaborators: newCollaborators }
    }),
    
    removeCollaborator: (userId) => set((state) => {
      const newCollaborators = new Map(state.collaborators)
      newCollaborators.delete(userId)
      return { collaborators: newCollaborators }
    }),
    
    setConnectionStatus: (isConnected) => set({ isConnected })
  }))
)

// Selectors for easier access to derived state
export const useSelectedElements = () => useCanvasStore((state) => 
  state.elements.filter(element => state.selectedElementIds.includes(element.id))
)

export const useElementById = (id: string) => useCanvasStore((state) =>
  state.elements.find(element => element.id === id)
)

export const useVisibleElements = () => useCanvasStore((state) => {
  // This could be enhanced with viewport culling
  return state.elements.filter(element => element.isVisible !== false)
})

// Action helpers
export const useCanvasActions = () => {
  const store = useCanvasStore()
  
  return {
    createElement: (element: CanvasElement) => {
      store.addElement(element)
    },
    
    duplicateElements: (elementIds: string[]) => {
      const elements = store.elements.filter(el => elementIds.includes(el.id))
      const duplicatedElements = elements.map(element => ({
        ...element,
        id: `${element.id}_copy_${Date.now()}`,
        position: {
          x: element.position.x + 20,
          y: element.position.y + 20
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
      
      duplicatedElements.forEach(element => store.addElement(element))
      store.setSelectedElements(duplicatedElements.map(el => el.id))
    },
    
    moveElements: (elementIds: string[], delta: Position) => {
      elementIds.forEach(id => {
        const element = store.elements.find(el => el.id === id)
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
    
    deleteSelectedElements: () => {
      const { selectedElementIds } = store
      selectedElementIds.forEach(id => store.removeElement(id))
    },
    
    selectAll: () => {
      const allElementIds = store.elements.map(el => el.id)
      store.setSelectedElements(allElementIds)
    }
  }
}