import React from 'react'
import { render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Whiteboard } from '../Whiteboard'
import { AuthProvider } from '@/context/AuthContext'

// Mock the canvas engine
jest.mock('@/lib/canvas-engine', () => ({
  CanvasEngine: jest.fn().mockImplementation(() => ({
    getCanvas: jest.fn(() => ({
      getElement: jest.fn(() => {
        const canvas = document.createElement('canvas')
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        return canvas
      }),
      renderAll: jest.fn(),
      setDimensions: jest.fn()
    })),
    getCamera: jest.fn(() => ({ x: 0, y: 0, zoom: 1 })),
    dispose: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  }))
}))

// Mock the store
const mockStoreState = {
  isGridVisible: false,
  isLoading: false,
  camera: { x: 0, y: 0, zoom: 1 },
  tool: { type: 'select' },
  elements: [],
  selectedElementIds: [],
  collaborators: new Map(),
  isConnected: false,
  setTool: jest.fn(),
  clearSelection: jest.fn(),
  addElement: jest.fn(),
  updateElement: jest.fn(),
  removeElement: jest.fn(),
  setSelectedElements: jest.fn()
}

jest.mock('@/store/useCanvasStore', () => ({
  useCanvasStore: Object.assign(
    jest.fn(() => mockStoreState),
    {
      getState: jest.fn(() => mockStoreState)
    }
  ),
  useCanvasActions: jest.fn(() => ({
    createElement: jest.fn(),
    duplicateElements: jest.fn(),
    moveElements: jest.fn(),
    deleteSelectedElements: jest.fn(),
    selectAll: jest.fn()
  }))
}))

// Mock hooks
jest.mock('@/hooks/useCanvas', () => ({
  useCanvas: jest.fn(() => ({
    canvasRef: { current: document.createElement('canvas') },
    isInitialized: true,
    engine: {
      getCanvas: jest.fn(() => ({
        getElement: jest.fn(() => {
          const canvas = document.createElement('canvas')
          canvas.style.width = '100%'
          canvas.style.height = '100%'
          return canvas
        }),
        renderAll: jest.fn(),
        setDimensions: jest.fn()
      })),
      getCamera: jest.fn(() => ({ x: 0, y: 0, zoom: 1 })),
      dispose: jest.fn(),
      on: jest.fn(),
      off: jest.fn()
    }
  }))
}))

jest.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn()
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

// Test helper to wrap component with required providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  )
}

describe('Whiteboard Full-Screen Tests', () => {
  beforeEach(() => {
    // Reset viewport size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1080
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Full-Screen Canvas Layout', () => {
    it('should render canvas container with full viewport dimensions', () => {
      const { container } = renderWithProviders(
        <Whiteboard
          boardId="test-board"
        />
      )
      
      const canvasContainer = container.querySelector('.canvas-container')
      expect(canvasContainer).toBeInTheDocument()
      
      // Check for full-screen styling
      const styles = window.getComputedStyle(canvasContainer as Element)
      expect(styles.position).toBe('fixed')
      // Check individual properties instead of inset shorthand (better jsdom compatibility)
      expect(styles.top).toBe('0px')
      expect(styles.right).toBe('0px')
      expect(styles.bottom).toBe('0px')
      expect(styles.left).toBe('0px')
    })

    it('should apply fixed positioning with inset-0', () => {
      const { container } = renderWithProviders(
        <Whiteboard
          boardId="test-board"
        />
      )
      
      const canvasContainer = container.querySelector('.canvas-container')
      const styles = window.getComputedStyle(canvasContainer as Element)
      
      // Verify fixed positioning
      expect(styles.position).toBe('fixed')
      expect(styles.top).toBe('0px')
      expect(styles.right).toBe('0px')
      expect(styles.bottom).toBe('0px')
      expect(styles.left).toBe('0px')
    })

    it('should have no gaps or margins around canvas', () => {
      const { container } = renderWithProviders(
        <Whiteboard
          boardId="test-board"
        />
      )
      
      const canvasContainer = container.querySelector('.canvas-container')
      const styles = window.getComputedStyle(canvasContainer as Element)
      
      expect(styles.margin).toBe('0px')
      expect(styles.padding).toBe('0px')
    })

    it('should fill 100% of viewport width and height', () => {
      const { container } = renderWithProviders(
        <Whiteboard
          boardId="test-board"
        />
      )
      
      const canvasContainer = container.querySelector('.canvas-container')
      const styles = window.getComputedStyle(canvasContainer as Element)
      
      expect(styles.width).toBe('100%')
      expect(styles.height).toBe('100%')
    })

    it('should have correct z-index layering', () => {
      const { container } = renderWithProviders(
        <Whiteboard
          boardId="test-board"
        />
      )
      
      const canvasContainer = container.querySelector('.canvas-container')
      const toolbar = container.querySelector('.toolbar')
      
      const canvasZIndex = window.getComputedStyle(canvasContainer as Element).zIndex
      const toolbarZIndex = toolbar ? window.getComputedStyle(toolbar).zIndex : '0'
      
      // Canvas should be base layer
      expect(parseInt(canvasZIndex) || 0).toBeLessThan(parseInt(toolbarZIndex) || 100)
    })
  })

  describe('Responsive Behavior', () => {
    it('should adapt to viewport size changes', async () => {
      const { container } = renderWithProviders(
        <Whiteboard
          boardId="test-board"
        />
      )
      
      // Initial size
      const canvasContainer = container.querySelector('.canvas-container')
      expect(canvasContainer).toBeInTheDocument()
      
      // Change viewport size
      window.innerWidth = 1280
      window.innerHeight = 720
      
      // Trigger resize event
      window.dispatchEvent(new Event('resize'))
      
      await waitFor(() => {
        // Canvas should still fill viewport
        const styles = window.getComputedStyle(canvasContainer as Element)
        expect(styles.width).toBe('100%')
        expect(styles.height).toBe('100%')
      })
    })

    it('should maintain full-screen on orientation change', async () => {
      const { container } = renderWithProviders(
        <Whiteboard
          boardId="test-board"
        />
      )
      
      const canvasContainer = container.querySelector('.canvas-container')
      
      // Simulate portrait orientation
      window.innerWidth = 768
      window.innerHeight = 1024
      window.dispatchEvent(new Event('orientationchange'))
      
      await waitFor(() => {
        const styles = window.getComputedStyle(canvasContainer as Element)
        expect(styles.position).toBe('fixed')
        expect(styles.width).toBe('100%')
        expect(styles.height).toBe('100%')
      })
      
      // Simulate landscape orientation
      window.innerWidth = 1024
      window.innerHeight = 768
      window.dispatchEvent(new Event('orientationchange'))
      
      await waitFor(() => {
        const styles = window.getComputedStyle(canvasContainer as Element)
        expect(styles.position).toBe('fixed')
        expect(styles.width).toBe('100%')
        expect(styles.height).toBe('100%')
      })
    })
  })

  describe('Canvas Performance', () => {
    it('should enable GPU acceleration styles', () => {
      const { container } = renderWithProviders(
        <Whiteboard
          boardId="test-board"
        />
      )
      
      const canvas = container.querySelector('canvas')
      if (canvas) {
        const styles = window.getComputedStyle(canvas)
        expect(styles.willChange).toBe('transform')
        expect(styles.transform).toContain('translateZ')
      }
    })

    it('should use hardware acceleration hints', () => {
      const { container } = renderWithProviders(
        <Whiteboard
          boardId="test-board"
        />
      )
      
      const canvasContainer = container.querySelector('.canvas-container')
      const styles = window.getComputedStyle(canvasContainer as Element)
      
      // Check for performance optimization styles
      expect(styles.backfaceVisibility || styles.webkitBackfaceVisibility).toBe('hidden')
    })
  })
})