import { ImageUploadManager } from '../image-upload'
import { ImageElement } from '@/types'

// Mock FileReader
class MockFileReader {
  result: string | ArrayBuffer | null = null
  error: any = null
  onload: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null

  readAsDataURL(file: File) {
    setTimeout(() => {
      if (file.type.startsWith('image/')) {
        this.result = 'data:image/png;base64,mockbase64data'
        if (this.onload) {
          this.onload({ target: this })
        }
      } else {
        this.error = new Error('Invalid file type')
        if (this.onerror) {
          this.onerror({ target: this })
        }
      }
    }, 0)
  }
}

// Mock Image
class MockImage {
  width = 100
  height = 100
  src = ''
  onload: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor() {
    setTimeout(() => {
      if (this.src && this.onload) {
        this.onload()
      }
    }, 0)
  }
}

// Replace global objects
;(global as any).FileReader = MockFileReader
;(global as any).Image = MockImage

describe('ImageUploadManager', () => {
  let manager: ImageUploadManager
  let mockCanvas: any
  let mockOnImageAdd: jest.Mock

  beforeEach(() => {
    mockCanvas = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      getBoundingClientRect: jest.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 600
      }))
    }
    mockOnImageAdd = jest.fn()
    manager = new ImageUploadManager(mockCanvas, mockOnImageAdd)
  })

  afterEach(() => {
    manager.cleanup()
  })

  describe('File Validation', () => {
    it('should accept valid image files', async () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' })
      const result = await manager.processFile(file)
      
      expect(result).toBeDefined()
      expect(result.content.url).toContain('data:image')
    })

    it('should reject non-image files', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      
      await expect(manager.processFile(file)).rejects.toThrow('Invalid file type')
    })

    it('should reject files over 10MB', async () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.png', { type: 'image/png' })
      
      await expect(manager.processFile(largeFile)).rejects.toThrow('File size exceeds 10MB limit')
    })

    it('should accept common image formats', async () => {
      const formats = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
      
      for (const format of formats) {
        const file = new File(['content'], 'test', { type: format })
        const result = await manager.processFile(file)
        expect(result).toBeDefined()
      }
    })
  })

  describe('Drag and Drop', () => {
    it('should handle dragover event', () => {
      const event = new Event('dragover')
      event.preventDefault = jest.fn()
      
      // Get the handler that was registered
      const dragoverHandler = mockCanvas.addEventListener.mock.calls.find(
        call => call[0] === 'dragover'
      )?.[1]
      
      dragoverHandler(event)
      
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should process dropped image files', async () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' })
      const event = new Event('drop') as any
      event.preventDefault = jest.fn()
      event.dataTransfer = {
        files: [file]
      }
      event.clientX = 100
      event.clientY = 200
      
      const dropHandler = mockCanvas.addEventListener.mock.calls.find(
        call => call[0] === 'drop'
      )?.[1]
      
      await dropHandler(event)
      
      expect(event.preventDefault).toHaveBeenCalled()
      expect(mockOnImageAdd).toHaveBeenCalled()
      
      const addedImage = mockOnImageAdd.mock.calls[0][0] as ImageElement
      expect(addedImage.type).toBe('image')
      // Position includes offset from getBoundingClientRect
      expect(addedImage.position.x).toBeGreaterThanOrEqual(100)
      expect(addedImage.position.y).toBeGreaterThanOrEqual(200)
    })

    it('should handle multiple dropped files', async () => {
      const files = [
        new File(['content1'], 'test1.png', { type: 'image/png' }),
        new File(['content2'], 'test2.jpg', { type: 'image/jpeg' })
      ]
      
      const event = new Event('drop') as any
      event.preventDefault = jest.fn()
      event.dataTransfer = { files }
      event.clientX = 50
      event.clientY = 50
      
      const dropHandler = mockCanvas.addEventListener.mock.calls.find(
        call => call[0] === 'drop'
      )?.[1]
      
      await dropHandler(event)
      
      // Wait for all async operations
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(mockOnImageAdd).toHaveBeenCalledTimes(2)
    })
  })

  describe('Clipboard Paste', () => {
    it('should handle pasted images', async () => {
      const file = new File(['content'], 'image.png', { type: 'image/png' })
      const event = {
        clipboardData: {
          files: [file]
        }
      } as any
      
      const pasteHandler = mockCanvas.addEventListener.mock.calls.find(
        call => call[0] === 'paste'
      )?.[1]
      
      await pasteHandler(event)
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(mockOnImageAdd).toHaveBeenCalled()
      const addedImage = mockOnImageAdd.mock.calls[0][0] as ImageElement
      expect(addedImage.type).toBe('image')
    })

    it('should ignore non-image clipboard content', async () => {
      const file = new File(['text'], 'text.txt', { type: 'text/plain' })
      const event = {
        clipboardData: {
          files: [file]
        }
      } as any
      
      const pasteHandler = mockCanvas.addEventListener.mock.calls.find(
        call => call[0] === 'paste'
      )?.[1]
      
      await pasteHandler(event)
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(mockOnImageAdd).not.toHaveBeenCalled()
    })
  })

  describe('File Input', () => {
    it('should process files from file input', async () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' })
      const files = [file]
      
      await manager.handleFileInput(files as any)
      
      expect(mockOnImageAdd).toHaveBeenCalled()
      const addedImage = mockOnImageAdd.mock.calls[0][0] as ImageElement
      expect(addedImage.type).toBe('image')
      expect(addedImage.content.url).toContain('data:image')
    })

    it('should handle multiple files from input', async () => {
      const files = [
        new File(['content1'], 'test1.png', { type: 'image/png' }),
        new File(['content2'], 'test2.jpg', { type: 'image/jpeg' })
      ]
      
      await manager.handleFileInput(files as any)
      
      expect(mockOnImageAdd).toHaveBeenCalledTimes(2)
    })
  })

  describe('Image Dimensions', () => {
    it('should detect image dimensions', async () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' })
      const result = await manager.processFile(file)
      
      expect(result.content.originalSize).toEqual({
        width: 100,
        height: 100
      })
      expect(result.size).toEqual({
        width: 100,
        height: 100
      })
    })

    it('should resize large images proportionally', async () => {
      // Mock large image
      const mockLargeImage = new MockImage()
      mockLargeImage.width = 4000
      mockLargeImage.height = 3000
      
      ;(global as any).Image = class {
        width = 4000
        height = 3000
        src = ''
        onload: (() => void) | null = null
        
        constructor() {
          setTimeout(() => {
            if (this.src && this.onload) {
              this.onload()
            }
          }, 0)
        }
      }
      
      const file = new File(['content'], 'large.png', { type: 'image/png' })
      const result = await manager.processFile(file)
      
      // Should resize to max 2048px while maintaining aspect ratio
      expect(result.size.width).toBe(2048)
      expect(result.size.height).toBe(1536) // 3000 * (2048/4000)
      expect(result.content.originalSize).toEqual({
        width: 4000,
        height: 3000
      })
      
      // Restore mock
      ;(global as any).Image = MockImage
    })
  })

  describe('Element Creation', () => {
    it('should create ImageElement with correct structure', async () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' })
      const result = await manager.processFile(file)
      
      expect(result).toMatchObject({
        type: 'image',
        content: {
          url: expect.stringContaining('data:image'),
          originalSize: {
            width: expect.any(Number),
            height: expect.any(Number)
          }
        },
        position: {
          x: expect.any(Number),
          y: expect.any(Number)
        },
        size: {
          width: expect.any(Number),
          height: expect.any(Number)
        },
        rotation: 0,
        layerIndex: 0,
        boardId: 'demo-board',
        createdBy: 'current-user',
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle FileReader errors', async () => {
      // Mock FileReader error
      ;(global as any).FileReader = class {
        onerror: ((event: any) => void) | null = null
        readAsDataURL() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror({ target: { error: new Error('Read error') } })
            }
          }, 0)
        }
      }
      
      const file = new File(['content'], 'test.png', { type: 'image/png' })
      
      await expect(manager.processFile(file)).rejects.toThrow('Read error')
      
      // Restore mock
      ;(global as any).FileReader = MockFileReader
    })

    it('should handle Image loading errors', async () => {
      // Mock Image error
      ;(global as any).Image = class {
        src = ''
        onerror: (() => void) | null = null
        
        constructor() {
          setTimeout(() => {
            if (this.src && this.onerror) {
              this.onerror()
            }
          }, 0)
        }
      }
      
      const file = new File(['content'], 'test.png', { type: 'image/png' })
      
      await expect(manager.processFile(file)).rejects.toThrow('Failed to load image')
      
      // Restore mock
      ;(global as any).Image = MockImage
    })
  })

  describe('Cleanup', () => {
    it('should remove event listeners on cleanup', () => {
      manager.cleanup()
      
      expect(mockCanvas.removeEventListener).toHaveBeenCalledWith(
        'dragover',
        expect.any(Function)
      )
      expect(mockCanvas.removeEventListener).toHaveBeenCalledWith(
        'drop',
        expect.any(Function)
      )
      expect(mockCanvas.removeEventListener).toHaveBeenCalledWith(
        'paste',
        expect.any(Function)
      )
    })
  })
})