import { ImageUploadHandler } from '../image-upload'
import { ImageElement } from '@/types'

describe('ImageUploadHandler', () => {
  let handler: ImageUploadHandler
  let mockOnImageAdd: jest.Mock
  let mockFile: File
  let mockFileReaderInstance: any

  beforeEach(() => {
    handler = new ImageUploadHandler()
    mockOnImageAdd = jest.fn()
    mockFile = new File(['test'], 'test.png', { type: 'image/png' })
    
    // Mock FileReader
    mockFileReaderInstance = {
      readAsDataURL: jest.fn(),
      result: 'data:image/png;base64,test',
      onload: null as any,
      onerror: null as any,
    }
    
    global.FileReader = jest.fn(() => mockFileReaderInstance) as any
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:test-url')
    
    // Mock Image constructor
    global.Image = jest.fn(() => ({
      onload: null,
      onerror: null,
      naturalWidth: 300,
      naturalHeight: 200,
      set src(value: string) {
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 0)
      },
    })) as any
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('validateFile', () => {
    it('should accept valid image files', () => {
      const validFiles = [
        new File([''], 'test.png', { type: 'image/png' }),
        new File([''], 'test.jpg', { type: 'image/jpeg' }),
        new File([''], 'test.gif', { type: 'image/gif' }),
        new File([''], 'test.webp', { type: 'image/webp' }),
      ]

      validFiles.forEach(file => {
        expect(() => handler.validateFile(file)).not.toThrow()
      })
    })

    it('should reject non-image files', () => {
      const invalidFile = new File([''], 'test.txt', { type: 'text/plain' })
      expect(() => handler.validateFile(invalidFile)).toThrow('Invalid file type')
    })

    it('should reject files larger than 10MB', () => {
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.png', { 
        type: 'image/png' 
      })
      expect(() => handler.validateFile(largeFile)).toThrow('File size exceeds 10MB')
    })
  })

  describe('processImage', () => {
    it('should process image and return data URL', async () => {
      const promise = handler.processImage(mockFile)
      
      // Trigger onload callback
      setTimeout(() => {
        mockFileReaderInstance.onload({ target: { result: 'data:image/png;base64,test' } })
      }, 0)
      
      const result = await promise
      expect(result).toBe('data:image/png;base64,test')
    })

    it('should handle file read errors', async () => {
      mockFileReaderInstance.readAsDataURL = jest.fn(() => {
        setTimeout(() => {
          mockFileReaderInstance.onerror(new Error('Read failed'))
        }, 0)
      })

      await expect(handler.processImage(mockFile)).rejects.toThrow()
    })
  })

  describe('handleImageUpload', () => {
    it('should handle single image upload', async () => {
      const promise = handler.handleImageUpload(mockFile, mockOnImageAdd)
      
      // Trigger onload
      setTimeout(() => {
        mockFileReaderInstance.onload({ target: { result: 'data:image/png;base64,test' } })
      }, 0)
      
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockOnImageAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'image',
          src: 'data:image/png;base64,test',
          width: expect.any(Number),
          height: expect.any(Number),
        })
      )
    })

    it('should handle multiple image uploads', async () => {
      const files = [
        new File([''], 'test1.png', { type: 'image/png' }),
        new File([''], 'test2.jpg', { type: 'image/jpeg' }),
      ]
      
      for (const file of files) {
        const promise = handler.handleImageUpload(file, mockOnImageAdd)
        setTimeout(() => {
          mockFileReaderInstance.onload({ 
            target: { result: `data:image;base64,test` } 
          })
        }, 0)
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      
      expect(mockOnImageAdd).toHaveBeenCalledTimes(2)
    })
  })

  describe('handleDrop', () => {
    it('should handle dropped images', async () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        clientX: 100,
        clientY: 200,
        dataTransfer: {
          files: [mockFile],
        },
      } as unknown as DragEvent

      const promise = handler.handleDrop(mockEvent, mockOnImageAdd)
      
      setTimeout(() => {
        mockFileReaderInstance.onload({ target: { result: 'data:image/png;base64,test' } })
      }, 0)
      
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockOnImageAdd).toHaveBeenCalled()
    })

    it('should ignore non-image drops', async () => {
      const textFile = new File([''], 'test.txt', { type: 'text/plain' })
      const mockEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          files: [textFile],
        },
      } as unknown as DragEvent

      await handler.handleDrop(mockEvent, mockOnImageAdd)
      
      expect(mockOnImageAdd).not.toHaveBeenCalled()
    })
  })

  describe('handlePaste', () => {
    it('should handle pasted images from clipboard', async () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        clipboardData: {
          items: [
            {
              kind: 'file',
              type: 'image/png',
              getAsFile: () => mockFile,
            },
          ],
        },
      } as unknown as ClipboardEvent

      const promise = handler.handlePaste(mockEvent, mockOnImageAdd)
      
      setTimeout(() => {
        mockFileReaderInstance.onload({ target: { result: 'data:image/png;base64,test' } })
      }, 0)
      
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockOnImageAdd).toHaveBeenCalled()
    })
  })
})