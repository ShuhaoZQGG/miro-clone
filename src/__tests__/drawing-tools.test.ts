import { ElementManager } from '@/lib/element-manager'

// Mock Fabric.js
jest.mock('fabric', () => ({
  fabric: {
    Ellipse: jest.fn().mockImplementation(() => ({
      set: jest.fn().mockReturnThis(),
      setCoords: jest.fn(),
      on: jest.fn(),
      toObject: jest.fn().mockReturnValue({}),
      canvas: null,
    })),
    Line: jest.fn().mockImplementation(() => ({
      set: jest.fn().mockReturnThis(),
      setCoords: jest.fn(),
      on: jest.fn(),
      toObject: jest.fn().mockReturnValue({}),
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

describe('Drawing Tools - Advanced Shapes', () => {
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

  describe('createEllipse', () => {
    it('should create an ellipse with default properties', () => {
      const position = { x: 150, y: 100 }
      const ellipse = elementManager.createEllipse(position)

      expect(ellipse).toBeDefined()
      expect(ellipse.type).toBe('ellipse')
      expect(ellipse.position).toEqual(position)
      expect(ellipse.size).toEqual({ width: 200, height: 100 })
      expect(ellipse.style.fill).toBe('#E5E7EB')
      expect(ellipse.style.stroke).toBe('#374151')
      expect(ellipse.style.strokeWidth).toBe(2)
      expect(ellipse.style.opacity).toBe(1)
      expect(ellipse.boardId).toBe('board-123')
      expect(ellipse.rotation).toBe(0)
    })

    it('should create an ellipse with custom style', () => {
      const position = { x: 25, y: 50 }
      const style = {
        fill: '#FF6B6B',
        stroke: '#C92A2A',
        strokeWidth: 3,
        opacity: 0.8
      }

      const ellipse = elementManager.createEllipse(position, style)

      expect(ellipse.style).toEqual(style)
      expect(ellipse.style.fill).toBe('#FF6B6B')
      expect(ellipse.style.strokeWidth).toBe(3)
    })

    it('should create an ellipse with custom size', () => {
      const position = { x: 0, y: 0 }
      const size = { width: 300, height: 150 }

      const ellipse = elementManager.createEllipse(position, undefined, size)

      expect(ellipse.size).toEqual(size)
    })

    it('should add ellipse to canvas', () => {
      elementManager.createEllipse({ x: 10, y: 20 })

      expect(mockCanvas.add).toHaveBeenCalled()
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })

    it('should handle different width and height for ellipse', () => {
      const position = { x: 0, y: 0 }
      const size = { width: 200, height: 100 }

      const ellipse = elementManager.createEllipse(position, undefined, size)

      // Ellipse should maintain different width and height (unlike circle)
      expect(ellipse.size.width).toBe(200)
      expect(ellipse.size.height).toBe(100)
    })
  })

  describe('createLine', () => {
    it('should create a line with default properties', () => {
      const startPoint = { x: 100, y: 100 }
      const endPoint = { x: 200, y: 200 }
      
      const line = elementManager.createLine(startPoint, endPoint)
      
      expect(line).toBeDefined()
      expect(line.type).toBe('line')
      expect(line.startPoint).toEqual(startPoint)
      expect(line.endPoint).toEqual(endPoint)
      expect(line.style.stroke).toBe('#000000')
      expect(line.style.strokeWidth).toBe(2)
      expect(line.boardId).toBe('board-123')
    })

    it('should create a line with custom style', () => {
      const startPoint = { x: 50, y: 50 }
      const endPoint = { x: 150, y: 150 }
      const style = {
        stroke: '#FF0000',
        strokeWidth: 4,
        strokeDasharray: '10,5'
      }
      
      const line = elementManager.createLine(startPoint, endPoint, style)
      
      expect(line.style).toMatchObject(style)
      expect(line.style.stroke).toBe('#FF0000')
      expect(line.style.strokeWidth).toBe(4)
    })

    it('should calculate correct position and size for line', () => {
      const startPoint = { x: 200, y: 100 }
      const endPoint = { x: 100, y: 200 }
      
      const line = elementManager.createLine(startPoint, endPoint)
      
      // Position should be at the minimum x,y
      expect(line.position.x).toBe(100)
      expect(line.position.y).toBe(100)
      // Size should be the width and height of the bounding box
      expect(line.size.width).toBe(100)
      expect(line.size.height).toBe(100)
    })

    it('should handle horizontal line', () => {
      const startPoint = { x: 100, y: 100 }
      const endPoint = { x: 300, y: 100 }
      
      const line = elementManager.createLine(startPoint, endPoint)
      
      expect(line.position.y).toBe(100)
      expect(line.size.width).toBe(200)
      expect(line.size.height).toBe(0)
    })

    it('should handle vertical line', () => {
      const startPoint = { x: 100, y: 100 }
      const endPoint = { x: 100, y: 300 }
      
      const line = elementManager.createLine(startPoint, endPoint)
      
      expect(line.position.x).toBe(100)
      expect(line.size.width).toBe(0)
      expect(line.size.height).toBe(200)
    })

    it('should add line to canvas', () => {
      elementManager.createLine({ x: 0, y: 0 }, { x: 100, y: 100 })

      expect(mockCanvas.add).toHaveBeenCalled()
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })
  })

  describe('Fabric.js Integration for New Drawing Tools', () => {
    it('should create corresponding Fabric objects for ellipses', () => {
      const fabricModule = await import('fabric')
      const { fabric } = fabricModule
      
      elementManager.createEllipse({ x: 100, y: 200 })

      expect(fabric.Ellipse).toHaveBeenCalled()
    })

    it('should create corresponding Fabric objects for lines', () => {
      const fabricModule = await import('fabric')
      const { fabric } = fabricModule
      
      elementManager.createLine({ x: 100, y: 100 }, { x: 200, y: 200 })

      expect(fabric.Line).toHaveBeenCalled()
    })
  })
})