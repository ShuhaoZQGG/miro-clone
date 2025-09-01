import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Whiteboard } from '../Whiteboard'
import { ImageUploadManager } from '@/lib/canvas-features/image-upload'

// Mock the dependencies
jest.mock('@/hooks/useCanvas', () => ({
  useCanvas: jest.fn(() => ({
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
    exportCanvas: jest.fn(),
    canvasEngine: {
      getCanvas: () => ({
        add: jest.fn(),
        renderAll: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        getWidth: jest.fn(() => 800),
        getHeight: jest.fn(() => 600)
      })
    }
  }))
}))

jest.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn()
}))

jest.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: jest.fn(() => ({
    isConnected: false,
    users: [],
    connect: jest.fn(),
    disconnect: jest.fn(),
    sendCursorPosition: jest.fn(),
    sendOperation: jest.fn(),
    sendSelection: jest.fn(),
    onOperation: jest.fn(),
    onCursorUpdate: jest.fn(),
    onSelectionUpdate: jest.fn()
  }))
}))

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    isAuthenticated: false
  }))
}))

jest.mock('@/store/useCanvasStore', () => ({
  useCanvasStore: jest.fn(() => ({
    isGridVisible: false,
    isLoading: false,
    tool: 'select',
    camera: { x: 0, y: 0, zoom: 1 },
    elements: [],
    selectedElementIds: [],
    isConnected: false,
    toggleGrid: jest.fn(),
    setTool: jest.fn(),
    addElement: jest.fn()
  }))
}))

describe('Image Upload Integration', () => {
  let mockCanvas: any
  let imageUploadManager: ImageUploadManager

  beforeEach(() => {
    mockCanvas = {
      add: jest.fn(),
      renderAll: jest.fn(),
      getWidth: jest.fn(() => 800),
      getHeight: jest.fn(() => 600),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }
    
    imageUploadManager = new ImageUploadManager(mockCanvas)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Toolbar Integration', () => {
    it('should display image upload button in toolbar', () => {
      render(<Whiteboard boardId="test-board" />)
      
      const uploadButton = screen.getByTestId('image-upload-button')
      expect(uploadButton).toBeInTheDocument()
      expect(uploadButton).toHaveAttribute('aria-label', 'Upload Image')
    })

    it('should show tooltip on hover', async () => {
      render(<Whiteboard boardId="test-board" />)
      
      const uploadButton = screen.getByTestId('image-upload-button')
      fireEvent.mouseEnter(uploadButton)
      
      await waitFor(() => {
        expect(screen.getByText('Upload Image (or drag & drop)')).toBeInTheDocument()
      })
    })

    it('should open file dialog when upload button is clicked', () => {
      render(<Whiteboard boardId="test-board" />)
      
      const uploadButton = screen.getByTestId('image-upload-button')
      const fileInput = screen.getByTestId('image-file-input') as HTMLInputElement
      
      const clickSpy = jest.spyOn(fileInput, 'click')
      fireEvent.click(uploadButton)
      
      expect(clickSpy).toHaveBeenCalled()
    })
  })

  describe('File Input Integration', () => {
    it('should have hidden file input with correct attributes', () => {
      render(<Whiteboard boardId="test-board" />)
      
      const fileInput = screen.getByTestId('image-file-input') as HTMLInputElement
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveClass('hidden')
      expect(fileInput).toHaveAttribute('type', 'file')
      expect(fileInput).toHaveAttribute('accept', 'image/*')
      expect(fileInput).toHaveAttribute('multiple')
    })

    it('should handle file selection through file input', async () => {
      render(<Whiteboard boardId="test-board" />)
      
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const fileInput = screen.getByTestId('image-file-input') as HTMLInputElement
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        // Check that the image was added to canvas
        expect(mockCanvas.add).toHaveBeenCalled()
      })
    })
  })

  describe('Drag and Drop Integration', () => {
    it('should show drop zone overlay when dragging over canvas', () => {
      render(<Whiteboard boardId="test-board" />)
      
      const canvas = screen.getByTestId('canvas-container')
      
      const dragEvent = new Event('dragenter', { bubbles: true })
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: {
          types: ['Files'],
          files: []
        }
      })
      
      fireEvent(canvas, dragEvent)
      
      const dropZone = screen.getByTestId('drop-zone-overlay')
      expect(dropZone).toBeInTheDocument()
      expect(dropZone).toHaveTextContent('Drop images here')
    })

    it('should hide drop zone overlay when drag leaves', () => {
      render(<Whiteboard boardId="test-board" />)
      
      const canvas = screen.getByTestId('canvas-container')
      
      // Enter drag
      const dragEnterEvent = new Event('dragenter', { bubbles: true })
      Object.defineProperty(dragEnterEvent, 'dataTransfer', {
        value: {
          types: ['Files'],
          files: []
        }
      })
      fireEvent(canvas, dragEnterEvent)
      
      // Leave drag
      const dragLeaveEvent = new Event('dragleave', { bubbles: true })
      fireEvent(canvas, dragLeaveEvent)
      
      const dropZone = screen.queryByTestId('drop-zone-overlay')
      expect(dropZone).not.toBeInTheDocument()
    })

    it('should handle dropped images', async () => {
      render(<Whiteboard boardId="test-board" />)
      
      const canvas = screen.getByTestId('canvas-container')
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      
      const dropEvent = new Event('drop', { bubbles: true })
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [file],
          types: ['Files']
        }
      })
      
      fireEvent(canvas, dropEvent)
      
      await waitFor(() => {
        expect(mockCanvas.add).toHaveBeenCalled()
      })
    })
  })

  describe('Clipboard Integration', () => {
    it('should handle paste event with image', async () => {
      render(<Whiteboard boardId="test-board" />)
      
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        clipboardData: new DataTransfer()
      })
      
      Object.defineProperty(pasteEvent.clipboardData, 'files', {
        value: [file]
      })
      
      document.dispatchEvent(pasteEvent)
      
      await waitFor(() => {
        expect(mockCanvas.add).toHaveBeenCalled()
      })
    })

    it('should ignore paste event without images', () => {
      render(<Whiteboard boardId="test-board" />)
      
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        clipboardData: new DataTransfer()
      })
      
      Object.defineProperty(pasteEvent.clipboardData, 'files', {
        value: []
      })
      
      document.dispatchEvent(pasteEvent)
      
      expect(mockCanvas.add).not.toHaveBeenCalled()
    })
  })

  describe('Visual Feedback', () => {
    it('should show loading state during upload', async () => {
      render(<Whiteboard boardId="test-board" />)
      
      const file = new File(['test'], 'large.png', { type: 'image/png' })
      const fileInput = screen.getByTestId('image-file-input') as HTMLInputElement
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })
      
      fireEvent.change(fileInput)
      
      // Should show loading indicator
      expect(screen.getByTestId('upload-loading')).toBeInTheDocument()
      
      await waitFor(() => {
        // Loading should be removed after upload
        expect(screen.queryByTestId('upload-loading')).not.toBeInTheDocument()
      })
    })

    it.skip('should show error toast for invalid files', async () => {
      // TODO: Implement error toast component
      render(<Whiteboard boardId="test-board" />)
      
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const fileInput = screen.getByTestId('image-file-input') as HTMLInputElement
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument()
      })
    })

    it.skip('should show error toast for oversized files', async () => {
      // TODO: Implement error toast component
      render(<Whiteboard boardId="test-board" />)
      
      // Create a file larger than 10MB
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.png', { 
        type: 'image/png' 
      })
      const fileInput = screen.getByTestId('image-file-input') as HTMLInputElement
      
      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(screen.getByText(/File size exceeds 10MB/i)).toBeInTheDocument()
      })
    })
  })

  describe('WebSocket Sync', () => {
    it('should send image creation event through WebSocket', async () => {
      const mockSendOperation = jest.fn()
      const useWebSocket = require('@/hooks/useWebSocket').useWebSocket
      useWebSocket.mockReturnValue({
        isConnected: true,
        users: [],
        connect: jest.fn(),
        disconnect: jest.fn(),
        sendCursorPosition: jest.fn(),
        sendOperation: mockSendOperation,
        sendSelection: jest.fn(),
        onOperation: jest.fn(),
        onCursorUpdate: jest.fn(),
        onSelectionUpdate: jest.fn()
      })
      
      render(<Whiteboard boardId="test-board" />)
      
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const fileInput = screen.getByTestId('image-file-input') as HTMLInputElement
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(mockSendOperation).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'create',
            element: expect.objectContaining({
              type: 'image'
            })
          })
        )
      })
    })
  })
})