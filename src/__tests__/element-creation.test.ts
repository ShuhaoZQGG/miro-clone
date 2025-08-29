import { ElementManager } from '@/lib/element-manager'
import { CanvasElement, StickyNoteElement, ShapeElement, TextElement, ElementType } from '@/types'

// Mock Fabric.js
jest.mock('fabric', () => ({
  fabric: {
    Rect: jest.fn().mockImplementation(() => ({
      set: jest.fn().mockReturnThis(),
      setCoords: jest.fn(),
      on: jest.fn(),
      toObject: jest.fn().mockReturnValue({}),
      canvas: null,
    })),
    Circle: jest.fn().mockImplementation(() => ({
      set: jest.fn().mockReturnThis(),
      setCoords: jest.fn(),
      on: jest.fn(),
      toObject: jest.fn().mockReturnValue({}),
      canvas: null,
    })),
    Text: jest.fn().mockImplementation(() => ({
      set: jest.fn().mockReturnThis(),
      setCoords: jest.fn(),
      on: jest.fn(),
      toObject: jest.fn().mockReturnValue({}),
      canvas: null,
    })),
    Group: jest.fn().mockImplementation(() => ({
      set: jest.fn().mockReturnThis(),
      setCoords: jest.fn(),
      on: jest.fn(),
      toObject: jest.fn().mockReturnValue({}),
      addWithUpdate: jest.fn(),
      canvas: null,
    })),
    Canvas: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      remove: jest.fn(),
      renderAll: jest.fn(),
      getObjects: jest.fn().mockReturnValue([]),
      discardActiveObject: jest.fn(),
      setActiveObject: jest.fn(),
      getActiveObject: jest.fn(),
      getActiveObjects: jest.fn().mockReturnValue([]),
      requestRenderAll: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    })),
  }
}))

describe('ElementManager - Element Creation', () => {
  let elementManager: ElementManager
  let mockCanvas: any

  beforeEach(() => {
    // Create mock canvas
    mockCanvas = {
      add: jest.fn(),
      remove: jest.fn(),
      renderAll: jest.fn(),
      getObjects: jest.fn().mockReturnValue([]),
      discardActiveObject: jest.fn(),
      setActiveObject: jest.fn(),
      getActiveObject: jest.fn(),
      getActiveObjects: jest.fn().mockReturnValue([]),
      requestRenderAll: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    }

    elementManager = new ElementManager(mockCanvas, 'board-123')
    jest.clearAllMocks()
  })

  describe('createStickyNote', () => {
    it('should create a sticky note with default properties', () => {
      const position = { x: 100, y: 200 }
      const stickyNote = elementManager.createStickyNote(position)

      expect(stickyNote).toBeDefined()
      expect(stickyNote.type).toBe('sticky_note')
      expect(stickyNote.position).toEqual(position)
      expect(stickyNote.size).toEqual({ width: 200, height: 150 })
      expect(stickyNote.content.text).toBe('')
      expect(stickyNote.content.backgroundColor).toBe('#FEF08A') // Default yellow
      expect(stickyNote.boardId).toBe('board-123')
      expect(stickyNote.layerIndex).toBeGreaterThanOrEqual(0)
      expect(stickyNote.rotation).toBe(0)
      expect(stickyNote.isVisible).toBe(true)
      expect(stickyNote.isLocked).toBe(false)
    })

    it('should create a sticky note with custom content', () => {
      const position = { x: 50, y: 75 }
      const content = {
        text: 'My custom note',
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#333333',
        backgroundColor: '#FFB6C1'
      }

      const stickyNote = elementManager.createStickyNote(position, content)

      expect(stickyNote.content).toEqual(content)
      expect(stickyNote.content.text).toBe('My custom note')
      expect(stickyNote.content.backgroundColor).toBe('#FFB6C1')
    })

    it('should create a sticky note with custom size', () => {
      const position = { x: 0, y: 0 }
      const size = { width: 250, height: 180 }

      const stickyNote = elementManager.createStickyNote(position, undefined, size)

      expect(stickyNote.size).toEqual(size)
    })

    it('should generate unique IDs for multiple sticky notes', () => {
      const note1 = elementManager.createStickyNote({ x: 0, y: 0 })
      const note2 = elementManager.createStickyNote({ x: 100, y: 100 })

      expect(note1.id).toBeDefined()
      expect(note2.id).toBeDefined()
      expect(note1.id).not.toBe(note2.id)
    })

    it('should add sticky note to canvas', () => {
      const position = { x: 10, y: 20 }
      const stickyNote = elementManager.createStickyNote(position)

      expect(mockCanvas.add).toHaveBeenCalled()
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })

    it('should set creation timestamps', () => {
      const before = new Date()
      const stickyNote = elementManager.createStickyNote({ x: 0, y: 0 })
      const after = new Date()

      const createdAt = new Date(stickyNote.createdAt)
      
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
      expect(stickyNote.updatedAt).toBe(stickyNote.createdAt)
    })

    it('should handle text that exceeds sticky note bounds', () => {
      const longText = 'This is a very long text that should be properly handled within the sticky note boundaries and not overflow'
      const content = { text: longText }

      const stickyNote = elementManager.createStickyNote({ x: 0, y: 0 }, content)

      expect(stickyNote.content.text).toBe(longText)
      // Should still create the element successfully
      expect(stickyNote.type).toBe('sticky_note')
    })
  })

  describe('createRectangle', () => {
    it('should create a rectangle with default properties', () => {
      const position = { x: 150, y: 100 }
      const rectangle = elementManager.createRectangle(position)

      expect(rectangle).toBeDefined()
      expect(rectangle.type).toBe('rectangle')
      expect(rectangle.position).toEqual(position)
      expect(rectangle.size).toEqual({ width: 200, height: 100 })
      expect(rectangle.style.fill).toBe('#E5E7EB') // Default gray fill
      expect(rectangle.style.stroke).toBe('#374151')
      expect(rectangle.style.strokeWidth).toBe(2)
      expect(rectangle.style.opacity).toBe(1)
      expect(rectangle.boardId).toBe('board-123')
      expect(rectangle.rotation).toBe(0)
    })

    it('should create a rectangle with custom style', () => {
      const position = { x: 25, y: 50 }
      const style = {
        fill: '#FF6B6B',
        stroke: '#C92A2A',
        strokeWidth: 3,
        opacity: 0.8
      }

      const rectangle = elementManager.createRectangle(position, style)

      expect(rectangle.style).toEqual(style)
      expect(rectangle.style.fill).toBe('#FF6B6B')
      expect(rectangle.style.strokeWidth).toBe(3)
    })

    it('should create a rectangle with custom size', () => {
      const position = { x: 0, y: 0 }
      const size = { width: 300, height: 150 }

      const rectangle = elementManager.createRectangle(position, undefined, size)

      expect(rectangle.size).toEqual(size)
    })

    it('should generate unique IDs for multiple rectangles', () => {
      const rect1 = elementManager.createRectangle({ x: 0, y: 0 })
      const rect2 = elementManager.createRectangle({ x: 100, y: 100 })

      expect(rect1.id).not.toBe(rect2.id)
    })

    it('should add rectangle to canvas', () => {
      const rectangle = elementManager.createRectangle({ x: 10, y: 20 })

      expect(mockCanvas.add).toHaveBeenCalled()
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })

    it('should create rectangle with minimum size constraints', () => {
      const tinySize = { width: 1, height: 1 }
      const rectangle = elementManager.createRectangle({ x: 0, y: 0 }, undefined, tinySize)

      expect(rectangle.size.width).toBeGreaterThanOrEqual(10) // Minimum width
      expect(rectangle.size.height).toBeGreaterThanOrEqual(10) // Minimum height
    })
  })

  describe('createCircle', () => {
    it('should create a circle with default properties', () => {
      const position = { x: 200, y: 150 }
      const circle = elementManager.createCircle(position)

      expect(circle).toBeDefined()
      expect(circle.type).toBe('circle')
      expect(circle.position).toEqual(position)
      expect(circle.size).toEqual({ width: 100, height: 100 }) // Circles are square
      expect(circle.style.fill).toBe('#E5E7EB')
      expect(circle.style.stroke).toBe('#374151')
      expect(circle.style.strokeWidth).toBe(2)
      expect(circle.style.opacity).toBe(1)
      expect(circle.boardId).toBe('board-123')
    })

    it('should create a circle with custom style', () => {
      const position = { x: 75, y: 125 }
      const style = {
        fill: '#4ECDC4',
        stroke: '#26A69A',
        strokeWidth: 4,
        opacity: 0.9
      }

      const circle = elementManager.createCircle(position, style)

      expect(circle.style).toEqual(style)
    })

    it('should create a circle with custom radius (size)', () => {
      const position = { x: 0, y: 0 }
      const size = { width: 150, height: 150 }

      const circle = elementManager.createCircle(position, undefined, size)

      expect(circle.size).toEqual(size)
    })

    it('should enforce square dimensions for circles', () => {
      const position = { x: 0, y: 0 }
      const nonSquareSize = { width: 100, height: 200 }

      const circle = elementManager.createCircle(position, undefined, nonSquareSize)

      // Should use the smaller dimension to keep it a circle
      expect(circle.size.width).toBe(circle.size.height)
      expect(circle.size.width).toBe(100)
    })

    it('should add circle to canvas', () => {
      const circle = elementManager.createCircle({ x: 30, y: 40 })

      expect(mockCanvas.add).toHaveBeenCalled()
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })

    it('should create circle with minimum radius constraints', () => {
      const tinySize = { width: 5, height: 5 }
      const circle = elementManager.createCircle({ x: 0, y: 0 }, undefined, tinySize)

      expect(circle.size.width).toBeGreaterThanOrEqual(20) // Minimum diameter
      expect(circle.size.height).toBeGreaterThanOrEqual(20)
    })
  })

  describe('createText', () => {
    it('should create a text element with default properties', () => {
      const position = { x: 300, y: 200 }
      const text = elementManager.createText(position)

      expect(text).toBeDefined()
      expect(text.type).toBe('text')
      expect(text.position).toEqual(position)
      expect(text.content.text).toBe('Text')
      expect(text.content.fontSize).toBe(18)
      expect(text.content.fontFamily).toBe('Inter, sans-serif')
      expect(text.content.fontWeight).toBe('normal')
      expect(text.content.color).toBe('#000000')
      expect(text.content.textAlign).toBe('left')
      expect(text.boardId).toBe('board-123')
    })

    it('should create a text element with custom content', () => {
      const position = { x: 100, y: 150 }
      const content = {
        text: 'Custom text content',
        fontSize: 24,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        color: '#FF4757',
        textAlign: 'center' as const
      }

      const textElement = elementManager.createText(position, content)

      expect(textElement.content).toEqual(content)
      expect(textElement.content.text).toBe('Custom text content')
      expect(textElement.content.fontSize).toBe(24)
      expect(textElement.content.textAlign).toBe('center')
    })

    it('should calculate text size based on content', () => {
      const shortText = elementManager.createText({ x: 0, y: 0 }, { text: 'Hi' })
      const longText = elementManager.createText({ x: 0, y: 0 }, { 
        text: 'This is a much longer text that should have different dimensions' 
      })

      expect(longText.size.width).toBeGreaterThan(shortText.size.width)
    })

    it('should add text element to canvas', () => {
      const textElement = elementManager.createText({ x: 50, y: 60 })

      expect(mockCanvas.add).toHaveBeenCalled()
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })

    it('should handle empty text content', () => {
      const emptyTextElement = elementManager.createText({ x: 0, y: 0 }, { text: '' })

      expect(emptyTextElement.content.text).toBe('')
      expect(emptyTextElement.type).toBe('text')
    })

    it('should handle multiline text', () => {
      const multilineText = 'Line 1\nLine 2\nLine 3'
      const textElement = elementManager.createText({ x: 0, y: 0 }, { text: multilineText })

      expect(textElement.content.text).toBe(multilineText)
      // Height should be greater for multiline text
      expect(textElement.size.height).toBeGreaterThan(20) // Single line height
    })
  })

  describe('Element Management', () => {
    it('should add created elements to internal collection', () => {
      const stickyNote = elementManager.createStickyNote({ x: 0, y: 0 })
      const rectangle = elementManager.createRectangle({ x: 100, y: 100 })
      const circle = elementManager.createCircle({ x: 200, y: 200 })

      const elements = elementManager.getElements()

      expect(elements).toHaveLength(3)
      expect(elements).toContain(stickyNote)
      expect(elements).toContain(rectangle)
      expect(elements).toContain(circle)
    })

    it('should assign incremental layer indices', () => {
      const element1 = elementManager.createStickyNote({ x: 0, y: 0 })
      const element2 = elementManager.createRectangle({ x: 0, y: 0 })
      const element3 = elementManager.createCircle({ x: 0, y: 0 })

      expect(element1.layerIndex).toBe(0)
      expect(element2.layerIndex).toBe(1)
      expect(element3.layerIndex).toBe(2)
    })

    it('should set consistent creation metadata', () => {
      const element = elementManager.createStickyNote({ x: 0, y: 0 })

      expect(element.createdBy).toBe('user-123') // Should be set by auth system
      expect(element.createdAt).toBeDefined()
      expect(element.updatedAt).toBe(element.createdAt)
      expect(element.isVisible).toBe(true)
      expect(element.isLocked).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid position coordinates', () => {
      const invalidPositions = [
        { x: NaN, y: 100 },
        { x: 100, y: NaN },
        { x: Infinity, y: 100 },
        { x: -Infinity, y: 100 }
      ]

      invalidPositions.forEach(position => {
        expect(() => {
          elementManager.createStickyNote(position)
        }).not.toThrow()
      })
    })

    it('should handle negative size values', () => {
      const negativeSize = { width: -100, height: -50 }
      
      const element = elementManager.createRectangle({ x: 0, y: 0 }, undefined, negativeSize)
      
      expect(element.size.width).toBeGreaterThan(0)
      expect(element.size.height).toBeGreaterThan(0)
    })

    it('should handle canvas addition failure gracefully', () => {
      mockCanvas.add.mockImplementation(() => {
        throw new Error('Canvas add failed')
      })

      expect(() => {
        elementManager.createStickyNote({ x: 0, y: 0 })
      }).not.toThrow()
    })
  })

  describe('Fabric.js Integration', () => {
    it('should create corresponding Fabric objects for sticky notes', () => {
      const { fabric } = require('fabric')
      
      elementManager.createStickyNote({ x: 100, y: 200 })

      expect(fabric.Group).toHaveBeenCalled()
      expect(fabric.Rect).toHaveBeenCalled()
      expect(fabric.Text).toHaveBeenCalled()
    })

    it('should create corresponding Fabric objects for rectangles', () => {
      const { fabric } = require('fabric')
      
      elementManager.createRectangle({ x: 100, y: 200 })

      expect(fabric.Rect).toHaveBeenCalled()
    })

    it('should create corresponding Fabric objects for circles', () => {
      const { fabric } = require('fabric')
      
      elementManager.createCircle({ x: 100, y: 200 })

      expect(fabric.Circle).toHaveBeenCalled()
    })

    it('should create corresponding Fabric objects for text', () => {
      const { fabric } = require('fabric')
      
      elementManager.createText({ x: 100, y: 200 })

      expect(fabric.Text).toHaveBeenCalled()
    })

    it('should set proper Fabric object properties', () => {
      const { fabric } = require('fabric')
      const mockSetCoords = jest.fn()
      const mockOn = jest.fn()
      
      fabric.Rect.mockImplementation(() => ({
        set: jest.fn().mockReturnThis(),
        setCoords: mockSetCoords,
        on: mockOn,
        toObject: jest.fn().mockReturnValue({}),
      }))

      elementManager.createRectangle({ x: 100, y: 200 })

      expect(fabric.Rect).toHaveBeenCalled()
      expect(mockSetCoords).toHaveBeenCalled()
      expect(mockOn).toHaveBeenCalledWith('modified', expect.any(Function))
    })
  })

  describe('Performance', () => {
    it('should handle creation of multiple elements efficiently', () => {
      const startTime = performance.now()
      
      for (let i = 0; i < 100; i++) {
        elementManager.createStickyNote({ x: i * 10, y: i * 10 })
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
      expect(elementManager.getElements()).toHaveLength(100)
    })

    it('should not cause memory leaks with rapid element creation', () => {
      const initialElementCount = elementManager.getElements().length
      
      // Create and track elements
      for (let i = 0; i < 50; i++) {
        elementManager.createRectangle({ x: i, y: i })
      }
      
      expect(elementManager.getElements()).toHaveLength(initialElementCount + 50)
    })
  })
})