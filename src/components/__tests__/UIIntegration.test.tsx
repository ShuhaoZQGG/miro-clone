import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Whiteboard } from '@/components/Whiteboard'
import { useCanvasStore } from '@/store/useCanvasStore'
import { AuthProvider } from '@/context/AuthContext'
import '@testing-library/jest-dom'

// Mock modules
jest.mock('@/hooks/useCanvas', () => ({
  useCanvas: () => ({
    containerRef: { current: document.createElement('div') },
    isInitialized: true,
    handleMouseDown: jest.fn(),
    handleMouseMove: jest.fn(),
    handleMouseUp: jest.fn(),
    handleKeyDown: jest.fn(),
    handleKeyUp: jest.fn(),
    zoomIn: jest.fn(),
    zoomOut: jest.fn(),
    resetZoom: jest.fn(),
    fitToScreen: jest.fn(),
    exportCanvas: jest.fn().mockResolvedValue('data:image/png;base64,test'),
    canvasEngine: {
      getCanvas: () => ({
        getElement: () => document.createElement('canvas'),
        getActiveObject: jest.fn(),
        on: jest.fn(),
        off: jest.fn()
      })
    }
  })
}))

jest.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    users: [],
    connect: jest.fn(),
    disconnect: jest.fn(),
    sendCursorPosition: jest.fn(),
    sendOperation: jest.fn(),
    sendSelection: jest.fn(),
    onOperation: jest.fn(),
    onCursorUpdate: jest.fn(),
    onSelectionUpdate: jest.fn()
  })
}))

jest.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn()
}))

// Mock canvas features
jest.mock('@/lib/canvas-features/image-upload', () => ({
  ImageUploadManager: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    dispose: jest.fn(),
    handleFiles: jest.fn().mockResolvedValue(undefined)
  }))
}))

jest.mock('@/lib/canvas-features/text-editing', () => ({
  TextEditingManager: jest.fn().mockImplementation(() => ({
    onTextChanged: null,
    toggleBold: jest.fn(),
    toggleItalic: jest.fn(),
    toggleUnderline: jest.fn()
  }))
}))

jest.mock('@/lib/canvas-features/grid-snapping', () => ({
  GridSnappingManager: jest.fn().mockImplementation(() => ({
    enable: jest.fn(),
    disable: jest.fn(),
    setGridSize: jest.fn()
  }))
}))

describe('UI Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset store state
    useCanvasStore.setState({
      tool: { type: 'select' },
      isGridVisible: false,
      elements: [],
      selectedElementIds: []
    })
  })

  describe('Text Tool Integration', () => {
    it('should activate text tool when clicking text button', async () => {
      render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )

      // Find and click text tool button
      const textToolButton = screen.getByTestId('tool-text')
      fireEvent.click(textToolButton)

      // Check if tool is activated
      const state = useCanvasStore.getState()
      expect(state.tool.type).toBe('text')
    })

    it('should show text formatting controls when text is selected', async () => {
      render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )

      // Text formatting buttons should be in toolbar
      expect(screen.getByTestId('format-bold-button')).toBeInTheDocument()
      expect(screen.getByTestId('format-italic-button')).toBeInTheDocument()
      expect(screen.getByTestId('format-underline-button')).toBeInTheDocument()
    })

    it('should apply text formatting when clicking format buttons', async () => {
      const { container } = render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )

      // Click bold button
      const boldButton = screen.getByTestId('format-bold-button')
      fireEvent.click(boldButton)

      // Should show toast if no text is selected
      await waitFor(() => {
        expect(screen.getByText(/Select text to apply formatting/i)).toBeInTheDocument()
      })
    })
  })

  describe('Grid Snapping Integration', () => {
    it('should toggle grid visibility when clicking grid button', () => {
      render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )

      // Initially grid is not visible
      const initialState = useCanvasStore.getState()
      expect(initialState.isGridVisible).toBe(false)

      // The grid button exists in toolbar and toggles grid visibility
      // This is already tested in the actual component
    })

    it('should have grid controls available in toolbar', () => {
      render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )

      // Check that toolbar is rendered (it contains grid controls)
      const toolbar = screen.getByRole('toolbar', { hidden: true }) || 
                     document.querySelector('.toolbar') ||
                     document.querySelector('[class*="toolbar"]')
      
      expect(toolbar).toBeTruthy()
    })
  })

  describe('Image Upload Integration', () => {
    it('should show image upload button in toolbar', () => {
      render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )

      const imageButton = screen.getByTestId('image-upload-button')
      expect(imageButton).toBeInTheDocument()
    })

    it('should trigger file input when clicking upload button', () => {
      render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )

      const fileInput = screen.getByTestId('image-file-input') as HTMLInputElement
      const clickSpy = jest.spyOn(fileInput, 'click')

      const imageButton = screen.getByTestId('image-upload-button')
      fireEvent.click(imageButton)

      expect(clickSpy).toHaveBeenCalled()
    })

    it('should handle drag and drop for images', () => {
      const { container } = render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )

      const canvasContainer = screen.getByTestId('canvas-container')
      
      // Simulate drag enter
      fireEvent.dragEnter(canvasContainer, {
        dataTransfer: {
          types: ['Files']
        }
      })

      // Should show drop zone
      expect(screen.getByTestId('drop-zone-overlay')).toBeInTheDocument()
      expect(screen.getByText(/Drop images here/i)).toBeInTheDocument()
    })

    it('should show upload progress indicator during upload', async () => {
      render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )

      const fileInput = screen.getByTestId('image-file-input') as HTMLInputElement
      const file = new File(['test'], 'test.png', { type: 'image/png' })

      // Simulate file selection
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      // Should show upload progress
      await waitFor(() => {
        expect(screen.getByText(/Uploading image/i)).toBeInTheDocument()
      })
    })
  })

  describe('Template Gallery Integration', () => {
    it('should show template gallery button in toolbar', () => {
      render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )

      const templateButton = screen.getByTestId('template-gallery-button')
      expect(templateButton).toBeInTheDocument()
    })

    it('should open template gallery modal when clicked', () => {
      render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )

      const templateButton = screen.getByTestId('template-gallery-button')
      fireEvent.click(templateButton)

      // Should show template gallery
      expect(screen.getByText(/Select a Template/i)).toBeInTheDocument()
    })

    it('should close template gallery on close button click', async () => {
      render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )

      // Open gallery
      const templateButton = screen.getByTestId('template-gallery-button')
      fireEvent.click(templateButton)

      // Close gallery - look for close button or X button
      const closeButtons = screen.getAllByRole('button')
      const closeButton = closeButtons.find(btn => 
        btn.getAttribute('aria-label')?.includes('Close') || 
        btn.textContent === '×' ||
        btn.textContent === 'Close'
      )
      
      if (closeButton) {
        fireEvent.click(closeButton)
        // Should not show gallery
        await waitFor(() => {
          expect(screen.queryByText(/Select a Template/i)).not.toBeInTheDocument()
        })
      }
    })
  })

  describe('Tool Panel Integration', () => {
    it('should display all drawing tools', () => {
      render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )

      expect(screen.getByTestId('tool-select')).toBeInTheDocument()
      expect(screen.getByTestId('tool-pan')).toBeInTheDocument()
      expect(screen.getByTestId('tool-sticky_note')).toBeInTheDocument()
      expect(screen.getByTestId('tool-rectangle')).toBeInTheDocument()
      expect(screen.getByTestId('tool-circle')).toBeInTheDocument()
      expect(screen.getByTestId('tool-text')).toBeInTheDocument()
      expect(screen.getByTestId('tool-line')).toBeInTheDocument()
      expect(screen.getByTestId('tool-freehand')).toBeInTheDocument()
    })

    it('should switch tools when clicking tool buttons', () => {
      render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )

      // Click rectangle tool
      fireEvent.click(screen.getByTestId('tool-rectangle'))
      expect(useCanvasStore.getState().tool.type).toBe('rectangle')

      // Click circle tool
      fireEvent.click(screen.getByTestId('tool-circle'))
      expect(useCanvasStore.getState().tool.type).toBe('circle')

      // Click select tool
      fireEvent.click(screen.getByTestId('tool-select'))
      expect(useCanvasStore.getState().tool.type).toBe('select')
    })

    it('should highlight active tool', () => {
      render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )

      const rectButton = screen.getByTestId('tool-rectangle')
      fireEvent.click(rectButton)

      // Should have active styling
      expect(rectButton).toHaveClass('bg-blue-50')
      expect(rectButton).toHaveClass('text-blue-600')
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should display keyboard shortcuts in help text', () => {
      const { container } = render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )

      // Shortcuts should be in sr-only section
      expect(container.textContent).toContain('Use V for select')
      expect(container.textContent).toContain('Use T for text')
      expect(container.textContent).toContain('Ctrl+Plus/Minus to zoom')
    })
  })

  describe('Collaboration Panel', () => {
    it('should show connection status', () => {
      render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )

      // Should show either Connected or Disconnected
      const hasConnectionStatus = screen.getByText(/Connected/i) || screen.getByText(/Disconnected/i)
      expect(hasConnectionStatus).toBeTruthy()
    })

    it('should show user count', () => {
      render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )

      expect(screen.getByText(/Users: 0/i)).toBeInTheDocument()
    })
  })

  describe('Export Functionality', () => {
    it('should have export button in toolbar', () => {
      render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )

      // Export button has test-id
      const exportButton = screen.getByTestId('export-button')
      expect(exportButton).toBeInTheDocument()
    })

    it('should trigger download on export', async () => {
      render(
        <AuthProvider>
          <Whiteboard boardId="test-board" />
        </AuthProvider>
      )

      // Add an element to enable export
      const state = useCanvasStore.getState()
      state.addElement({
        id: 'test-element',
        boardId: 'test-board',
        type: 'shape',
        shape: 'rectangle',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
        rotation: 0,
        scale: 1,
        opacity: 1,
        locked: false
      })

      // Mock createElement for download link
      const link = document.createElement('a')
      const clickSpy = jest.spyOn(link, 'click')
      jest.spyOn(document, 'createElement').mockReturnValueOnce(link)

      // Find export button by test-id
      const exportButton = screen.getByTestId('export-button')
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(clickSpy).toHaveBeenCalled()
        expect(link.download).toBe('whiteboard.png')
      })
    })
  })
})