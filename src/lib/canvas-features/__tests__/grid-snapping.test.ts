import { GridSnappingManager } from '../grid-snapping'
import { Position } from '@/types'

describe('GridSnappingManager', () => {
  let manager: GridSnappingManager

  beforeEach(() => {
    manager = new GridSnappingManager()
  })

  describe('Grid Configuration', () => {
    it('should initialize with default grid size', () => {
      expect(manager.getGridSize()).toBe(20)
      expect(manager.isEnabled()).toBe(false)
    })

    it('should update grid size', () => {
      manager.setGridSize(50)
      expect(manager.getGridSize()).toBe(50)
    })

    it('should enable and disable snapping', () => {
      manager.enable()
      expect(manager.isEnabled()).toBe(true)

      manager.disable()
      expect(manager.isEnabled()).toBe(false)
    })

    it('should toggle snapping state', () => {
      const initialState = manager.isEnabled()
      manager.toggle()
      expect(manager.isEnabled()).toBe(!initialState)
    })

    it('should set snap threshold', () => {
      manager.setSnapThreshold(10)
      expect(manager.getSnapThreshold()).toBe(10)
    })
  })

  describe('Position Snapping', () => {
    beforeEach(() => {
      manager.enable()
      manager.setGridSize(20)
    })

    it('should snap position to nearest grid point', () => {
      const position: Position = { x: 23, y: 37 }
      const snapped = manager.snapPosition(position)

      expect(snapped.x).toBe(20)
      expect(snapped.y).toBe(40)
    })

    it('should snap to exact grid points', () => {
      const position: Position = { x: 40, y: 60 }
      const snapped = manager.snapPosition(position)

      expect(snapped.x).toBe(40)
      expect(snapped.y).toBe(60)
    })

    it('should handle negative positions', () => {
      const position: Position = { x: -23, y: -37 }
      const snapped = manager.snapPosition(position)

      expect(snapped.x).toBe(-20)
      expect(snapped.y).toBe(-40)
    })

    it('should not snap when disabled', () => {
      manager.disable()
      const position: Position = { x: 23, y: 37 }
      const snapped = manager.snapPosition(position)

      expect(snapped.x).toBe(23)
      expect(snapped.y).toBe(37)
    })

    it('should snap with custom grid size', () => {
      manager.setGridSize(25)
      const position: Position = { x: 23, y: 37 }
      const snapped = manager.snapPosition(position)

      expect(snapped.x).toBe(25)
      expect(snapped.y).toBe(25)
    })
  })

  describe('Size Snapping', () => {
    beforeEach(() => {
      manager.enable()
      manager.setGridSize(20)
    })

    it('should snap size to grid', () => {
      const size = { width: 53, height: 87 }
      const snapped = manager.snapSize(size)

      expect(snapped.width).toBe(60)
      expect(snapped.height).toBe(80)
    })

    it('should maintain minimum size', () => {
      const size = { width: 5, height: 3 }
      const snapped = manager.snapSize(size)

      expect(snapped.width).toBe(20)
      expect(snapped.height).toBe(20)
    })

    it('should not snap size when disabled', () => {
      manager.disable()
      const size = { width: 53, height: 87 }
      const snapped = manager.snapSize(size)

      expect(snapped.width).toBe(53)
      expect(snapped.height).toBe(87)
    })
  })

  describe('Smart Snapping', () => {
    beforeEach(() => {
      manager.enable()
      manager.setGridSize(20)
      manager.setSnapThreshold(5)
    })

    it('should snap only when within threshold', () => {
      // Within threshold - should snap
      const position1: Position = { x: 23, y: 18 }
      const snapped1 = manager.smartSnap(position1)
      expect(snapped1.x).toBe(20)
      expect(snapped1.y).toBe(20)

      // Outside threshold - should not snap
      const position2: Position = { x: 26, y: 14 }
      const snapped2 = manager.smartSnap(position2)
      expect(snapped2.x).toBe(26)
      expect(snapped2.y).toBe(14)
    })

    it('should provide snap indicators', () => {
      const position: Position = { x: 23, y: 18 }
      const result = manager.getSnapIndicators(position)

      expect(result.snapped).toBe(true)
      expect(result.snapPoints).toEqual({ x: 20, y: 20 })
      expect(result.distance).toEqual({ x: 3, y: 2 })
    })
  })

  describe('Alignment Guides', () => {
    beforeEach(() => {
      manager.enable()
    })

    it('should detect alignment with other elements', () => {
      const currentElement = {
        position: { x: 98, y: 100 },
        size: { width: 100, height: 50 },
      }

      const otherElements = [
        {
          position: { x: 200, y: 100 },
          size: { width: 100, height: 50 },
        },
        {
          position: { x: 100, y: 200 },
          size: { width: 100, height: 50 },
        },
      ]

      const guides = manager.getAlignmentGuides(currentElement, otherElements)

      expect(guides.horizontal).toContain(100) // Top alignment
      expect(guides.vertical).toContain(100) // Left alignment
    })

    it('should snap to alignment guides', () => {
      const position: Position = { x: 98, y: 102 }
      const guides = {
        horizontal: [100],
        vertical: [100],
      }

      const snapped = manager.snapToGuides(position, guides, 5)

      expect(snapped.x).toBe(100)
      expect(snapped.y).toBe(100)
    })
  })

  describe('Grid Visualization', () => {
    it('should generate grid lines for canvas', () => {
      manager.setGridSize(50)
      const canvasSize = { width: 200, height: 150 }
      const lines = manager.getGridLines(canvasSize)

      // Should have 4 vertical lines (0, 50, 100, 150, 200)
      expect(lines.vertical).toHaveLength(5)
      expect(lines.vertical).toContain(0)
      expect(lines.vertical).toContain(50)
      expect(lines.vertical).toContain(100)
      expect(lines.vertical).toContain(150)
      expect(lines.vertical).toContain(200)

      // Should have 3 horizontal lines (0, 50, 100, 150)
      expect(lines.horizontal).toHaveLength(4)
      expect(lines.horizontal).toContain(0)
      expect(lines.horizontal).toContain(50)
      expect(lines.horizontal).toContain(100)
      expect(lines.horizontal).toContain(150)
    })

    it('should handle offset for panned view', () => {
      manager.setGridSize(20)
      const canvasSize = { width: 100, height: 100 }
      const offset = { x: 10, y: 15 }
      const lines = manager.getGridLines(canvasSize, offset)

      // Lines should be offset
      expect(lines.vertical[0]).toBe(-10)
      expect(lines.horizontal[0]).toBe(-15)
    })
  })
})