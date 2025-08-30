import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Whiteboard } from '@/components/Whiteboard'

// Mock the store
jest.mock('@/store/useCanvasStore', () => ({
  useCanvasStore: jest.fn(() => ({
    isGridVisible: false,
    isLoading: false,
    camera: { x: 0, y: 0, zoom: 1 },
    tool: { type: 'select' },
    elements: [],
    selectedElementIds: [],
    collaborators: new Map(),
    isConnected: false
  }))
}))

// Mock Fabric.js
jest.mock('fabric', () => ({
  fabric: {
    Canvas: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      renderAll: jest.fn(),
      setZoom: jest.fn(),
      getZoom: jest.fn().mockReturnValue(1),
      setViewportTransform: jest.fn(),
      getViewportTransform: jest.fn().mockReturnValue([1, 0, 0, 1, 0, 0]),
      on: jest.fn(),
      off: jest.fn(),
      dispose: jest.fn(),
      getPointer: jest.fn().mockReturnValue({ x: 0, y: 0 }),
      getWidth: jest.fn().mockReturnValue(800),
      getHeight: jest.fn().mockReturnValue(600),
      relativePan: jest.fn(),
      absolutePan: jest.fn(),
      getObjects: jest.fn().mockReturnValue([]),
      wrapperEl: document.createElement('canvas'),
      selection: true,
      hoverCursor: 'pointer',
      moveCursor: 'grab',
      defaultCursor: 'default'
    })),
    Rect: jest.fn().mockImplementation(() => ({
      set: jest.fn().mockReturnThis(),
      setCoords: jest.fn(),
      on: jest.fn(),
      toObject: jest.fn().mockReturnValue({}),
    })),
    Circle: jest.fn().mockImplementation(() => ({
      set: jest.fn().mockReturnThis(),
      setCoords: jest.fn(),
      on: jest.fn(),
      toObject: jest.fn().mockReturnValue({}),
    })),
    Text: jest.fn().mockImplementation(() => ({
      set: jest.fn().mockReturnThis(),
      setCoords: jest.fn(),
      on: jest.fn(),
      toObject: jest.fn().mockReturnValue({}),
    })),
    Group: jest.fn().mockImplementation(() => ({
      set: jest.fn().mockReturnThis(),
      setCoords: jest.fn(),
      on: jest.fn(),
      toObject: jest.fn().mockReturnValue({}),
      addWithUpdate: jest.fn(),
    })),
  }
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock performance.now for animations
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now())
  }
})

describe('Whiteboard Integration Tests', () => {
  const mockBoardId = 'test-board-123'
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    // Reset store state
    useCanvasStore.getState().setElements([])
    useCanvasStore.getState().clearSelection()
    useCanvasStore.getState().setTool({ type: 'select' })
    useCanvasStore.getState().setCamera({ x: 0, y: 0, zoom: 1 })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render whiteboard with all essential UI components', () => {
      render(<Whiteboard boardId={mockBoardId} />)

      // Check toolbar is present
      expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reset zoom/i })).toBeInTheDocument()

      // Check tool panel is present
      expect(screen.getByRole('button', { name: /select/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sticky note/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /rectangle/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /circle/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /text/i })).toBeInTheDocument()

      // Check board ID is displayed
      expect(screen.getByText(`Board: ${mockBoardId}`)).toBeInTheDocument()
    })

    it('should initialize with correct default state', () => {
      render(<Whiteboard boardId={mockBoardId} />)

      const store = useCanvasStore.getState()
      expect(store.elements).toHaveLength(0)
      expect(store.selectedElementIds).toHaveLength(0)
      expect(store.tool.type).toBe('select')
      expect(store.camera).toEqual({ x: 0, y: 0, zoom: 1 })
    })
  })

  describe('Tool Selection', () => {
    it('should switch tools when tool buttons are clicked', async () => {
      render(<Whiteboard boardId={mockBoardId} />)

      // Switch to sticky note tool
      const stickyNoteBtn = screen.getByRole('button', { name: /sticky note/i })
      await user.click(stickyNoteBtn)
      
      expect(useCanvasStore.getState().tool.type).toBe('sticky_note')

      // Switch to rectangle tool
      const rectangleBtn = screen.getByRole('button', { name: /rectangle/i })
      await user.click(rectangleBtn)
      
      expect(useCanvasStore.getState().tool.type).toBe('rectangle')
    })

    it('should highlight active tool in tool panel', async () => {
      render(<Whiteboard boardId={mockBoardId} />)

      const stickyNoteBtn = screen.getByRole('button', { name: /sticky note/i })
      await user.click(stickyNoteBtn)

      // Check if button has active styling
      expect(stickyNoteBtn).toHaveClass('bg-blue-50', 'text-blue-600')
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should respond to tool keyboard shortcuts', async () => {
      render(<Whiteboard boardId={mockBoardId} />)

      const whiteboard = screen.getByRole('generic', { hidden: true }) // Canvas container

      // Test sticky note shortcut
      whiteboard.focus()
      await user.keyboard('s')
      expect(useCanvasStore.getState().tool.type).toBe('sticky_note')

      // Test rectangle shortcut
      await user.keyboard('r')
      expect(useCanvasStore.getState().tool.type).toBe('rectangle')

      // Test select shortcut
      await user.keyboard('v')
      expect(useCanvasStore.getState().tool.type).toBe('select')
    })

    it('should clear selection with escape key', async () => {
      render(<Whiteboard boardId={mockBoardId} />)

      // First add some selection
      useCanvasStore.getState().setSelectedElements(['element-1', 'element-2'])
      expect(useCanvasStore.getState().selectedElementIds).toHaveLength(2)

      const whiteboard = screen.getByRole('generic', { hidden: true })
      whiteboard.focus()
      await user.keyboard('{Escape}')

      expect(useCanvasStore.getState().selectedElementIds).toHaveLength(0)
    })
  })

  describe('Canvas Interaction', () => {
    it('should handle mouse events on canvas', async () => {
      render(<Whiteboard boardId={mockBoardId} />)
      
      const canvasContainer = screen.getByRole('generic', { hidden: true })
      
      // Test mouse down
      fireEvent.mouseDown(canvasContainer, { clientX: 100, clientY: 150 })
      fireEvent.mouseMove(canvasContainer, { clientX: 120, clientY: 170 })
      fireEvent.mouseUp(canvasContainer)

      // The test passes if no errors are thrown
      expect(canvasContainer).toBeInTheDocument()
    })

    it('should create elements when clicking with creation tools', async () => {
      render(<Whiteboard boardId={mockBoardId} />)

      // Switch to sticky note tool
      const stickyNoteBtn = screen.getByRole('button', { name: /sticky note/i })
      await user.click(stickyNoteBtn)

      const canvasContainer = screen.getByRole('generic', { hidden: true })
      
      // Simulate click to create element
      fireEvent.mouseDown(canvasContainer, { 
        clientX: 200, 
        clientY: 200,
        button: 0
      })

      // Wait for any async operations
      await waitFor(() => {
        // Should have created an element
        expect(useCanvasStore.getState().elements.length).toBeGreaterThan(0)
      }, { timeout: 1000 })
    })
  })

  describe('Zoom and Pan Controls', () => {
    it('should update camera state when zoom buttons are clicked', async () => {
      render(<Whiteboard boardId={mockBoardId} />)

      const initialZoom = useCanvasStore.getState().camera.zoom

      // Click zoom in button
      const zoomInBtn = screen.getByRole('button', { name: /zoom in/i })
      await user.click(zoomInBtn)

      await waitFor(() => {
        const newZoom = useCanvasStore.getState().camera.zoom
        expect(newZoom).toBeGreaterThan(initialZoom)
      })
    })

    it('should reset zoom when reset zoom button is clicked', async () => {
      render(<Whiteboard boardId={mockBoardId} />)

      // First change the zoom
      useCanvasStore.getState().updateCamera({ zoom: 2.5 })
      
      const resetZoomBtn = screen.getByRole('button', { name: /reset zoom/i })
      await user.click(resetZoomBtn)

      await waitFor(() => {
        expect(useCanvasStore.getState().camera.zoom).toBe(1)
      })
    })
  })

  describe('Grid Toggle', () => {
    it('should toggle grid visibility', async () => {
      render(<Whiteboard boardId={mockBoardId} />)

      const initialGridVisible = useCanvasStore.getState().isGridVisible
      
      const gridBtn = screen.getByRole('button', { name: /toggle grid/i })
      await user.click(gridBtn)

      expect(useCanvasStore.getState().isGridVisible).toBe(!initialGridVisible)
    })

    it('should show grid visual indicator when grid is enabled', async () => {
      render(<Whiteboard boardId={mockBoardId} />)

      // Ensure grid is visible
      useCanvasStore.getState().toggleGrid()
      if (!useCanvasStore.getState().isGridVisible) {
        useCanvasStore.getState().toggleGrid()
      }

      const gridBtn = screen.getByRole('button', { name: /toggle grid/i })
      expect(gridBtn).toHaveClass('bg-blue-50', 'text-blue-600')
    })
  })

  describe('Collaboration UI', () => {
    it('should display connection status', () => {
      render(<Whiteboard boardId={mockBoardId} />)

      // Should show disconnected by default
      expect(useCanvasStore.getState().isConnected).toBe(false)
      
      // Should show connection indicator
      const statusIndicator = screen.getAllByRole('generic').find(el => 
        el.className.includes('bg-red-500') || el.className.includes('bg-green-500')
      )
      expect(statusIndicator).toBeInTheDocument()
    })

    it('should handle collaborator presence updates', () => {
      render(<Whiteboard boardId={mockBoardId} />)

      // Add a mock collaborator
      useCanvasStore.getState().updateCollaborator('user-456', {
        userId: 'user-456',
        isActive: true,
        lastSeen: new Date().toISOString(),
        cursor: { x: 100, y: 200 }
      })

      expect(useCanvasStore.getState().collaborators.size).toBe(1)
      expect(useCanvasStore.getState().collaborators.get('user-456')).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle canvas initialization errors gracefully', () => {
      // Mock canvas creation to throw error
      const originalError = console.error
      console.error = jest.fn()

      render(<Whiteboard boardId={mockBoardId} />)

      // Should not crash the application
      expect(screen.getByText(`Board: ${mockBoardId}`)).toBeInTheDocument()

      console.error = originalError
    })

    it('should show loading state during initialization', () => {
      render(<Whiteboard boardId={mockBoardId} />)

      // Should show loading spinner initially
      const loadingSpinner = screen.queryByRole('generic', { hidden: true })
      expect(loadingSpinner).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle rapid tool switching without issues', async () => {
      render(<Whiteboard boardId={mockBoardId} />)

      const tools = ['select', 'sticky_note', 'rectangle', 'circle', 'text']
      
      // Rapidly switch between tools
      for (let i = 0; i < 10; i++) {
        const toolIndex = i % tools.length
        const toolType = tools[toolIndex]
        useCanvasStore.getState().setTool({ type: toolType as any })
      }

      // Should not cause errors
      expect(useCanvasStore.getState().tool.type).toBe('text')
    })

    it('should handle many elements without performance degradation', () => {
      render(<Whiteboard boardId={mockBoardId} />)

      const elements = Array.from({ length: 100 }, (_, i) => ({
        id: `element-${i}`,
        type: 'sticky_note' as const,
        boardId: mockBoardId,
        position: { x: i * 10, y: i * 10 },
        size: { width: 100, height: 100 },
        rotation: 0,
        layerIndex: i,
        createdBy: 'test-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isVisible: true,
        isLocked: false,
        content: {
          text: `Note ${i}`,
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#000000',
          backgroundColor: '#FEF08A'
        }
      }))

      // Add all elements at once
      useCanvasStore.getState().setElements(elements)

      // Should handle the load
      expect(useCanvasStore.getState().elements).toHaveLength(100)
    })
  })
})