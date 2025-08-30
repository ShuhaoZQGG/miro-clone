import { LayerManager } from '@/lib/layer-manager'
import { CanvasElement } from '@/types'

describe('LayerManager - Element Layering', () => {
  let layerManager: LayerManager
  let mockCanvas: any
  let mockElements: CanvasElement[]

  beforeEach(() => {
    // Mock fabric objects
    const mockFabricObjects = [
      { elementId: 'element-1' },
      { elementId: 'element-2' },
      { elementId: 'element-3' },
    ]
    
    // Mock canvas
    mockCanvas = {
      getObjects: jest.fn().mockReturnValue(mockFabricObjects),
      bringToFront: jest.fn(),
      sendToBack: jest.fn(),
      bringForward: jest.fn(),
      sendBackwards: jest.fn(),
      moveTo: jest.fn(),
      renderAll: jest.fn(),
      clear: jest.fn(),
      add: jest.fn(),
    }

    // Create mock elements
    mockElements = [
      {
        id: 'element-1',
        type: 'rectangle',
        layerIndex: 0,
        boardId: 'board-123',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        rotation: 0,
        createdBy: 'user-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'element-2',
        type: 'circle',
        layerIndex: 1,
        boardId: 'board-123',
        position: { x: 50, y: 50 },
        size: { width: 100, height: 100 },
        rotation: 0,
        createdBy: 'user-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'element-3',
        type: 'text',
        layerIndex: 2,
        boardId: 'board-123',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 50 },
        rotation: 0,
        createdBy: 'user-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ] as CanvasElement[]

    layerManager = new LayerManager(mockCanvas, mockElements)
  })

  describe('moveToFront', () => {
    it('should move element to front (highest layer)', () => {
      const result = layerManager.moveToFront('element-1')

      expect(result).toBe(true)
      expect(mockElements[0].layerIndex).toBe(2) // Should be highest
      expect(mockCanvas.bringToFront).toHaveBeenCalled()
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })

    it('should adjust other element layer indices', () => {
      layerManager.moveToFront('element-1')

      // Element 1 should be at index 2
      expect(mockElements[0].layerIndex).toBe(2)
      // Other elements should shift down
      expect(mockElements[1].layerIndex).toBe(0)
      expect(mockElements[2].layerIndex).toBe(1)
    })

    it('should return false for non-existent element', () => {
      const result = layerManager.moveToFront('non-existent')

      expect(result).toBe(false)
      expect(mockCanvas.bringToFront).not.toHaveBeenCalled()
    })

    it('should handle element already at front', () => {
      const result = layerManager.moveToFront('element-3')

      expect(result).toBe(true)
      expect(mockElements[2].layerIndex).toBe(2) // Should stay at highest
    })
  })

  describe('moveToBack', () => {
    it('should move element to back (lowest layer)', () => {
      const result = layerManager.moveToBack('element-3')

      expect(result).toBe(true)
      expect(mockElements[2].layerIndex).toBe(0) // Should be lowest
      expect(mockCanvas.sendToBack).toHaveBeenCalled()
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })

    it('should adjust other element layer indices', () => {
      layerManager.moveToBack('element-3')

      // Element 3 should be at index 0
      expect(mockElements[2].layerIndex).toBe(0)
      // Other elements should shift up
      expect(mockElements[0].layerIndex).toBe(1)
      expect(mockElements[1].layerIndex).toBe(2)
    })

    it('should return false for non-existent element', () => {
      const result = layerManager.moveToBack('non-existent')

      expect(result).toBe(false)
      expect(mockCanvas.sendToBack).not.toHaveBeenCalled()
    })

    it('should handle element already at back', () => {
      const result = layerManager.moveToBack('element-1')

      expect(result).toBe(true)
      expect(mockElements[0].layerIndex).toBe(0) // Should stay at lowest
    })
  })

  describe('moveUp', () => {
    it('should move element up one layer', () => {
      const result = layerManager.moveUp('element-1')

      expect(result).toBe(true)
      expect(mockElements[0].layerIndex).toBe(1)
      expect(mockElements[1].layerIndex).toBe(0)
      expect(mockCanvas.bringForward).toHaveBeenCalled()
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })

    it('should not move element if already at top', () => {
      const result = layerManager.moveUp('element-3')

      expect(result).toBe(false)
      expect(mockElements[2].layerIndex).toBe(2) // Should stay at top
      expect(mockCanvas.bringForward).not.toHaveBeenCalled()
    })

    it('should swap layer indices with element above', () => {
      layerManager.moveUp('element-2')

      expect(mockElements[1].layerIndex).toBe(2)
      expect(mockElements[2].layerIndex).toBe(1)
    })

    it('should return false for non-existent element', () => {
      const result = layerManager.moveUp('non-existent')

      expect(result).toBe(false)
      expect(mockCanvas.bringForward).not.toHaveBeenCalled()
    })
  })

  describe('moveDown', () => {
    it('should move element down one layer', () => {
      const result = layerManager.moveDown('element-3')

      expect(result).toBe(true)
      expect(mockElements[2].layerIndex).toBe(1)
      expect(mockElements[1].layerIndex).toBe(2)
      expect(mockCanvas.sendBackwards).toHaveBeenCalled()
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })

    it('should not move element if already at bottom', () => {
      const result = layerManager.moveDown('element-1')

      expect(result).toBe(false)
      expect(mockElements[0].layerIndex).toBe(0) // Should stay at bottom
      expect(mockCanvas.sendBackwards).not.toHaveBeenCalled()
    })

    it('should swap layer indices with element below', () => {
      layerManager.moveDown('element-2')

      expect(mockElements[1].layerIndex).toBe(0)
      expect(mockElements[0].layerIndex).toBe(1)
    })

    it('should return false for non-existent element', () => {
      const result = layerManager.moveDown('non-existent')

      expect(result).toBe(false)
      expect(mockCanvas.sendBackwards).not.toHaveBeenCalled()
    })
  })

  describe('moveToLayer', () => {
    it('should move element to specific layer index', () => {
      const result = layerManager.moveToLayer('element-1', 2)

      expect(result).toBe(true)
      expect(mockElements[0].layerIndex).toBe(2)
      expect(mockCanvas.moveTo).toHaveBeenCalledWith(expect.anything(), 2)
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })

    it('should adjust other elements when moving to occupied layer', () => {
      layerManager.moveToLayer('element-1', 1)

      // Element 1 moves to layer 1
      expect(mockElements[0].layerIndex).toBe(1)
      // Element 2 (previously at layer 1) should adjust
      expect(mockElements[1].layerIndex).not.toBe(1)
    })

    it('should clamp to valid range', () => {
      const result = layerManager.moveToLayer('element-1', 10)

      expect(result).toBe(true)
      expect(mockElements[0].layerIndex).toBe(2) // Max valid index
    })

    it('should handle negative layer index', () => {
      const result = layerManager.moveToLayer('element-1', -1)

      expect(result).toBe(true)
      expect(mockElements[0].layerIndex).toBe(0) // Min valid index
    })

    it('should return false for non-existent element', () => {
      const result = layerManager.moveToLayer('non-existent', 1)

      expect(result).toBe(false)
      expect(mockCanvas.moveTo).not.toHaveBeenCalled()
    })
  })

  describe('getLayerOrder', () => {
    it('should return elements sorted by layer index', () => {
      const order = layerManager.getLayerOrder()

      expect(order).toHaveLength(3)
      expect(order[0].id).toBe('element-1') // Layer 0
      expect(order[1].id).toBe('element-2') // Layer 1
      expect(order[2].id).toBe('element-3') // Layer 2
    })

    it('should update after layer changes', () => {
      layerManager.moveToFront('element-1')
      const order = layerManager.getLayerOrder()

      expect(order[2].id).toBe('element-1') // Now at top
    })
  })

  describe('swapLayers', () => {
    it('should swap layers between two elements', () => {
      const result = layerManager.swapLayers('element-1', 'element-3')

      expect(result).toBe(true)
      expect(mockElements[0].layerIndex).toBe(2)
      expect(mockElements[2].layerIndex).toBe(0)
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })

    it('should return false if either element does not exist', () => {
      const result = layerManager.swapLayers('element-1', 'non-existent')

      expect(result).toBe(false)
      expect(mockElements[0].layerIndex).toBe(0) // Unchanged
    })

    it('should handle swapping same element', () => {
      const result = layerManager.swapLayers('element-1', 'element-1')

      expect(result).toBe(true)
      expect(mockElements[0].layerIndex).toBe(0) // Unchanged
    })
  })

  describe('normalizeLayerIndices', () => {
    it('should normalize layer indices to be sequential', () => {
      // Mess up the indices
      mockElements[0].layerIndex = 5
      mockElements[1].layerIndex = 10
      mockElements[2].layerIndex = 3

      layerManager.normalizeLayerIndices()

      expect(mockElements[2].layerIndex).toBe(0) // Was 3, now 0
      expect(mockElements[0].layerIndex).toBe(1) // Was 5, now 1
      expect(mockElements[1].layerIndex).toBe(2) // Was 10, now 2
    })

    it('should maintain relative order when normalizing', () => {
      mockElements[0].layerIndex = 100
      mockElements[1].layerIndex = 200
      mockElements[2].layerIndex = 300

      layerManager.normalizeLayerIndices()

      expect(mockElements[0].layerIndex).toBe(0)
      expect(mockElements[1].layerIndex).toBe(1)
      expect(mockElements[2].layerIndex).toBe(2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty elements array', () => {
      const emptyLayerManager = new LayerManager(mockCanvas, [])
      
      expect(emptyLayerManager.moveUp('any-id')).toBe(false)
      expect(emptyLayerManager.getLayerOrder()).toEqual([])
    })

    it('should handle single element', () => {
      const singleLayerManager = new LayerManager(mockCanvas, [mockElements[0]])
      
      expect(singleLayerManager.moveUp('element-1')).toBe(false)
      expect(singleLayerManager.moveDown('element-1')).toBe(false)
      expect(singleLayerManager.moveToFront('element-1')).toBe(true)
      expect(singleLayerManager.moveToBack('element-1')).toBe(true)
    })

    it('should handle duplicate layer indices gracefully', () => {
      // Create duplicate indices
      mockElements[0].layerIndex = 1
      mockElements[1].layerIndex = 1
      mockElements[2].layerIndex = 1

      layerManager.normalizeLayerIndices()

      // Should resolve to unique indices
      expect(new Set([
        mockElements[0].layerIndex,
        mockElements[1].layerIndex,
        mockElements[2].layerIndex
      ]).size).toBe(3)
    })
  })
})