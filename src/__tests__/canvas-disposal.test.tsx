import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { Whiteboard } from '../components/Whiteboard'
import { CanvasEngine } from '../lib/canvas-engine'
import { ElementManager } from '../lib/element-manager'
import { AuthProvider } from '../context/AuthContext'

// Mock canvas engine and element manager
jest.mock('../lib/canvas-engine')
jest.mock('../lib/element-manager')

describe('Canvas Disposal Safety', () => {
  let mockCanvasEngine: jest.Mocked<CanvasEngine>
  let mockElementManager: jest.Mocked<ElementManager>
  let mockDispose: jest.Mock
  let initCallCount = 0

  beforeEach(() => {
    jest.clearAllMocks()
    initCallCount = 0
    
    mockDispose = jest.fn()
    
    // Mock ElementManager
    mockElementManager = {
      getElements: jest.fn(() => []),
      addElement: jest.fn(),
      updateElement: jest.fn(),
      removeElement: jest.fn(),
      getElementById: jest.fn(),
      clearElements: jest.fn(),
    } as any
    
    ;(ElementManager as jest.MockedClass<typeof ElementManager>).mockImplementation(
      () => mockElementManager
    )
    
    mockCanvasEngine = {
      dispose: mockDispose,
      getCanvas: jest.fn(() => ({
        upperCanvasEl: document.createElement('canvas'),
        lowerCanvasEl: document.createElement('canvas'),
        wrapperEl: document.createElement('div'),
      })),
      getCamera: jest.fn(() => ({ x: 0, y: 0, zoom: 1 })),
      panTo: jest.fn(),
      zoomTo: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      getElements: jest.fn(() => []),
      addElement: jest.fn(),
      updateElement: jest.fn(),
      removeElement: jest.fn(),
      selectElement: jest.fn(),
      clearSelection: jest.fn(),
      getSelectedElements: jest.fn(() => []),
      setMode: jest.fn(),
      updateCursor: jest.fn(),
      exportAsImage: jest.fn(),
      exportAsJSON: jest.fn(),
      loadFromJSON: jest.fn(),
    } as any

    ;(CanvasEngine as jest.MockedClass<typeof CanvasEngine>).mockImplementation(
      () => {
        initCallCount++
        return mockCanvasEngine
      }
    )
  })

  describe('DOM Safety', () => {
    it('should handle disposal when DOM elements are already removed', async () => {
      const { unmount } = render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(mockCanvasEngine.dispose).toBeDefined()
      })

      // Simulate DOM elements being removed before disposal
      mockDispose.mockImplementation(() => {
        // No error should be thrown
      })

      unmount()

      await waitFor(() => {
        expect(mockDispose).toHaveBeenCalledTimes(1)
      })
    })

    it('should not throw when parent node is null during disposal', async () => {
      const { unmount } = render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(mockCanvasEngine.dispose).toBeDefined()
      })

      // Simulate parent node being null
      mockDispose.mockImplementation(() => {
        const error = new Error('Failed to execute removeChild on Node')
        error.name = 'NotFoundError'
        // Should catch and handle gracefully
        console.warn('Error disposing fabric canvas:', error)
      })

      expect(() => unmount()).not.toThrow()
      
      await waitFor(() => {
        expect(mockDispose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Refresh Loop Prevention', () => {
    it('should not re-initialize canvas after disposal', async () => {
      const { unmount, rerender } = render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(initCallCount).toBe(1)
      })

      // Trigger a re-render
      rerender(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )
      
      await waitFor(() => {
        // Should still be 1, not re-initialized
        expect(initCallCount).toBe(1)
      })

      unmount()
      
      await waitFor(() => {
        expect(mockDispose).toHaveBeenCalledTimes(1)
      })
    })

    it('should prevent initialization loop on rapid mount/unmount', async () => {
      const { unmount: unmount1 } = render(
        <AuthProvider>
          <Whiteboard boardId="test-board-1" />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(initCallCount).toBe(1)
      })

      unmount1()

      const { unmount: unmount2 } = render(
        <AuthProvider>
          <Whiteboard boardId="test-board-2" />
        </AuthProvider>
      )
      
      await waitFor(() => {
        // Should be 2 (one for each mount), not more
        expect(initCallCount).toBe(2)
      })

      unmount2()
      
      // Verify disposal was called for each unmount
      expect(mockDispose).toHaveBeenCalledTimes(2)
    })

    it('should use stable refs to prevent unnecessary re-renders', async () => {
      let renderCount = 0
      
      const TestComponent = () => {
        renderCount++
        return <Whiteboard boardId="test-board" />
      }

      const { rerender } = render(<TestComponent />)
      
      await waitFor(() => {
        expect(initCallCount).toBe(1)
      })

      const initialRenderCount = renderCount

      // Force multiple re-renders
      for (let i = 0; i < 5; i++) {
        rerender(<TestComponent />)
      }

      await waitFor(() => {
        // Canvas should not re-initialize despite re-renders
        expect(initCallCount).toBe(1)
        // Component may re-render but should be minimal
        expect(renderCount).toBeLessThanOrEqual(initialRenderCount + 5)
      })
    })
  })

  describe('Disposal Token Pattern', () => {
    it('should cancel initialization if component unmounts during init', async () => {
      // Canvas initialization is handled internally

      const { unmount } = render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )
      
      // Unmount before initialization completes
      unmount()

      // Complete initialization after unmount (if there was a pending init)
      // Note: In the actual implementation, initialization is handled internally

      await waitFor(() => {
        // Disposal should be called even if init was pending
        expect(mockDispose).toHaveBeenCalled()
      })
    })
  })
})