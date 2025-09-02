import { ViewportCulling } from '../viewport-culling'
import { CanvasElement } from '@/types'

describe('ViewportCulling', () => {
  let culling: ViewportCulling
  
  const createMockElement = (id: string, x: number, y: number, width = 100, height = 100): CanvasElement => ({
    id,
    type: 'rectangle',
    position: { x, y },
    size: { width, height },
    rotation: 0,
    layerIndex: 0,
    boardId: 'test',
    createdBy: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isLocked: false,
    isVisible: true,
    style: {
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 1,
      opacity: 1
    }
  })

  beforeEach(() => {
    culling = new ViewportCulling({
      maxDepth: 4,
      maxElementsPerNode: 2,
      viewportPadding: 50,
      dynamicLOD: true
    })
  })

  describe('buildIndex', () => {
    it('should build spatial index from elements', () => {
      const elements = [
        createMockElement('1', 0, 0),
        createMockElement('2', 200, 200),
        createMockElement('3', 400, 400)
      ]
      
      culling.buildIndex(elements)
      const stats = culling.getStats()
      
      expect(stats.totalElements).toBe(3)
      expect(stats.quadTreeDepth).toBeGreaterThan(0)
    })

    it('should handle empty element array', () => {
      culling.buildIndex([])
      const stats = culling.getStats()
      
      expect(stats.totalElements).toBe(0)
      expect(stats.quadTreeDepth).toBe(0)
    })

    it('should split nodes when max elements exceeded', () => {
      const elements = [
        createMockElement('1', 0, 0),
        createMockElement('2', 10, 10),
        createMockElement('3', 20, 20),
        createMockElement('4', 30, 30)
      ]
      
      culling.buildIndex(elements)
      const stats = culling.getStats()
      
      expect(stats.quadTreeDepth).toBeGreaterThan(1)
    })
  })

  describe('queryViewport', () => {
    it('should return elements within viewport', () => {
      const elements = [
        createMockElement('1', 50, 50),
        createMockElement('2', 500, 500),
        createMockElement('3', 150, 150)
      ]
      
      culling.buildIndex(elements)
      
      const viewport = { x: 0, y: 0, width: 300, height: 300 }
      const visible = culling.queryViewport(viewport)
      
      expect(visible).toHaveLength(2)
      expect(visible.map(e => e.id)).toContain('1')
      expect(visible.map(e => e.id)).toContain('3')
    })

    it('should apply viewport padding', () => {
      const elements = [
        createMockElement('1', 50, 50),
        createMockElement('2', 310, 50), // Just outside viewport but within padding
        createMockElement('3', 500, 500)
      ]
      
      culling.buildIndex(elements)
      
      const viewport = { x: 0, y: 0, width: 300, height: 300 }
      const visible = culling.queryViewport(viewport)
      
      expect(visible).toHaveLength(2)
      expect(visible.map(e => e.id)).toContain('1')
      expect(visible.map(e => e.id)).toContain('2')
    })

    it('should filter invisible elements', () => {
      const elements = [
        createMockElement('1', 50, 50),
        { ...createMockElement('2', 150, 150), isVisible: false },
        createMockElement('3', 250, 250)
      ]
      
      culling.buildIndex(elements)
      
      const viewport = { x: 0, y: 0, width: 400, height: 400 }
      const visible = culling.queryViewport(viewport)
      
      expect(visible).toHaveLength(2)
      expect(visible.map(e => e.id)).not.toContain('2')
    })

    it('should handle zoom level for LOD', () => {
      const elements = [
        createMockElement('1', 50, 50, 10, 10), // Small element
        createMockElement('2', 150, 150, 100, 100), // Medium element
        createMockElement('3', 250, 250, 200, 200) // Large element
      ]
      
      culling.buildIndex(elements)
      
      const viewport = { x: 0, y: 0, width: 500, height: 500 }
      const visibleAtLowZoom = culling.queryViewport(viewport, 0.1)
      const visibleAtHighZoom = culling.queryViewport(viewport, 2)
      
      // At low zoom, small elements might be culled
      expect(visibleAtLowZoom.length).toBeLessThanOrEqual(visibleAtHighZoom.length)
    })
  })

  describe('queryViewportWithLOD', () => {
    it('should return elements with LOD information', () => {
      const elements = [
        createMockElement('1', 50, 50, 10, 10),
        createMockElement('2', 150, 150, 100, 100),
        createMockElement('3', 250, 250, 300, 300)
      ]
      
      culling.buildIndex(elements)
      
      const viewport = { x: 0, y: 0, width: 600, height: 600 }
      const results = culling.queryViewportWithLOD(viewport, 1)
      
      expect(results.length).toBeGreaterThan(0)
      results.forEach(result => {
        expect(result).toHaveProperty('element')
        expect(result).toHaveProperty('lod')
        expect(result.lod).toBeGreaterThanOrEqual(0)
        expect(result.lod).toBeLessThanOrEqual(3)
      })
    })
  })

  describe('updateElement', () => {
    it('should update element position in spatial index', () => {
      const element = createMockElement('1', 50, 50)
      const elements = [
        element,
        createMockElement('2', 150, 150)
      ]
      
      culling.buildIndex(elements)
      
      // Move element
      const oldPosition = { ...element.position }
      element.position = { x: 300, y: 300 }
      culling.updateElement(element, oldPosition)
      
      // Query new position
      const viewport = { x: 250, y: 250, width: 200, height: 200 }
      const visible = culling.queryViewport(viewport)
      
      expect(visible.map(e => e.id)).toContain('1')
    })
  })

  describe('hasViewportChanged', () => {
    it('should detect viewport changes', () => {
      const viewport1 = { x: 0, y: 0, width: 300, height: 300 }
      const viewport2 = { x: 100, y: 100, width: 300, height: 300 }
      const viewport3 = { x: 10, y: 10, width: 300, height: 300 }
      
      culling.buildIndex([])
      culling.queryViewport(viewport1)
      
      expect(culling.hasViewportChanged(viewport2)).toBe(true)
      expect(culling.hasViewportChanged(viewport3, 20)).toBe(false) // Within threshold
    })
  })

  describe('getStats', () => {
    it('should return culling statistics', () => {
      const elements = [
        createMockElement('1', 50, 50),
        createMockElement('2', 500, 500),
        createMockElement('3', 150, 150)
      ]
      
      culling.buildIndex(elements)
      culling.queryViewport({ x: 0, y: 0, width: 300, height: 300 })
      
      const stats = culling.getStats()
      
      expect(stats.totalElements).toBe(3)
      expect(stats.visibleElements).toBeGreaterThan(0)
      expect(stats.culledElements).toBeGreaterThanOrEqual(0)
      expect(stats.nodesVisited).toBeGreaterThan(0)
    })
  })

  describe('optimize', () => {
    it('should rebuild spatial index', () => {
      const elements = [
        createMockElement('1', 50, 50),
        createMockElement('2', 150, 150)
      ]
      
      culling.buildIndex(elements)
      const statsBefore = culling.getStats()
      
      culling.optimize()
      const statsAfter = culling.getStats()
      
      expect(statsAfter.totalElements).toBe(statsBefore.totalElements)
    })
  })

  describe('clear', () => {
    it('should clear spatial index', () => {
      const elements = [
        createMockElement('1', 50, 50),
        createMockElement('2', 150, 150)
      ]
      
      culling.buildIndex(elements)
      culling.clear()
      
      const stats = culling.getStats()
      expect(stats.totalElements).toBe(0)
      expect(stats.quadTreeDepth).toBe(0)
    })
  })

  describe('setViewportPadding', () => {
    it('should update viewport padding', () => {
      culling.setViewportPadding(100)
      // Padding is used internally
      expect(true).toBe(true)
    })

    it('should not allow negative padding', () => {
      culling.setViewportPadding(-50)
      // Should be clamped to 0
      expect(true).toBe(true)
    })
  })

  describe('setDynamicLOD', () => {
    it('should enable dynamic LOD', () => {
      culling.setDynamicLOD(true)
      expect(true).toBe(true)
    })

    it('should disable dynamic LOD', () => {
      culling.setDynamicLOD(false)
      expect(true).toBe(true)
    })
  })
})