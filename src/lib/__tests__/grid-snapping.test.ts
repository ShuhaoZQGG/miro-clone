import { GridSnapping } from '../grid-snapping'

describe('GridSnapping', () => {
  let gridSnapping: GridSnapping

  beforeEach(() => {
    gridSnapping = new GridSnapping()
  })

  describe('snapToGrid', () => {
    it('should snap coordinates to grid with default size', () => {
      expect(gridSnapping.snapToGrid(23, 47)).toEqual({ x: 20, y: 50 })
      expect(gridSnapping.snapToGrid(18, 12)).toEqual({ x: 20, y: 10 })
      expect(gridSnapping.snapToGrid(5, 95)).toEqual({ x: 10, y: 100 })
    })

    it('should snap to nearest grid point', () => {
      expect(gridSnapping.snapToGrid(24, 26)).toEqual({ x: 20, y: 30 })
      expect(gridSnapping.snapToGrid(25, 25)).toEqual({ x: 30, y: 30 })
      expect(gridSnapping.snapToGrid(15, 14)).toEqual({ x: 20, y: 10 })
    })

    it('should handle negative coordinates', () => {
      expect(gridSnapping.snapToGrid(-23, -47)).toEqual({ x: -20, y: -50 })
      expect(gridSnapping.snapToGrid(-5, -95)).toEqual({ x: -10, y: -100 })
    })

    it('should handle exact grid points', () => {
      expect(gridSnapping.snapToGrid(20, 40)).toEqual({ x: 20, y: 40 })
      expect(gridSnapping.snapToGrid(0, 0)).toEqual({ x: 0, y: 0 })
      expect(gridSnapping.snapToGrid(100, 200)).toEqual({ x: 100, y: 200 })
    })
  })

  describe('setGridSize', () => {
    it('should update grid size', () => {
      gridSnapping.setGridSize(25)
      expect(gridSnapping.getGridSize()).toBe(25)
      
      expect(gridSnapping.snapToGrid(23, 47)).toEqual({ x: 25, y: 50 })
      expect(gridSnapping.snapToGrid(12, 37)).toEqual({ x: 0, y: 25 })
    })

    it('should handle small grid sizes', () => {
      gridSnapping.setGridSize(5)
      expect(gridSnapping.snapToGrid(12, 18)).toEqual({ x: 10, y: 20 })
      expect(gridSnapping.snapToGrid(3, 7)).toEqual({ x: 5, y: 5 })
    })

    it('should handle large grid sizes', () => {
      gridSnapping.setGridSize(50)
      expect(gridSnapping.snapToGrid(23, 76)).toEqual({ x: 0, y: 100 })
      expect(gridSnapping.snapToGrid(40, 30)).toEqual({ x: 50, y: 50 })
    })

    it('should enforce minimum grid size', () => {
      gridSnapping.setGridSize(0)
      expect(gridSnapping.getGridSize()).toBe(1)
      
      gridSnapping.setGridSize(-10)
      expect(gridSnapping.getGridSize()).toBe(1)
    })
  })

  describe('setEnabled', () => {
    it('should disable snapping when set to false', () => {
      gridSnapping.setEnabled(false)
      expect(gridSnapping.isEnabled()).toBe(false)
      
      // Should return original coordinates when disabled
      expect(gridSnapping.snapToGrid(23, 47)).toEqual({ x: 23, y: 47 })
      expect(gridSnapping.snapToGrid(5, 95)).toEqual({ x: 5, y: 95 })
    })

    it('should enable snapping when set to true', () => {
      gridSnapping.setEnabled(false)
      gridSnapping.setEnabled(true)
      expect(gridSnapping.isEnabled()).toBe(true)
      
      // Should snap when enabled
      expect(gridSnapping.snapToGrid(23, 47)).toEqual({ x: 20, y: 50 })
    })
  })

  describe('snapRectangle', () => {
    it('should snap all corners of rectangle', () => {
      const rect = {
        x: 23,
        y: 47,
        width: 58,
        height: 33,
      }
      
      const snapped = gridSnapping.snapRectangle(rect)
      
      expect(snapped).toEqual({
        x: 20,
        y: 50,
        width: 60,
        height: 30,
      })
    })

    it('should maintain minimum dimensions', () => {
      const rect = {
        x: 19,
        y: 19,
        width: 2,
        height: 2,
      }
      
      const snapped = gridSnapping.snapRectangle(rect)
      
      expect(snapped.width).toBeGreaterThanOrEqual(10)
      expect(snapped.height).toBeGreaterThanOrEqual(10)
    })

    it('should handle rectangles when snapping is disabled', () => {
      gridSnapping.setEnabled(false)
      
      const rect = {
        x: 23,
        y: 47,
        width: 58,
        height: 33,
      }
      
      const snapped = gridSnapping.snapRectangle(rect)
      expect(snapped).toEqual(rect)
    })
  })

  describe('snapDistance', () => {
    it('should snap distance to grid increments', () => {
      expect(gridSnapping.snapDistance(23)).toBe(20)
      expect(gridSnapping.snapDistance(47)).toBe(50)
      expect(gridSnapping.snapDistance(15)).toBe(20)
      expect(gridSnapping.snapDistance(25)).toBe(30)
    })

    it('should handle negative distances', () => {
      expect(gridSnapping.snapDistance(-23)).toBe(-20)
      expect(gridSnapping.snapDistance(-47)).toBe(-50)
    })

    it('should return original distance when disabled', () => {
      gridSnapping.setEnabled(false)
      expect(gridSnapping.snapDistance(23)).toBe(23)
      expect(gridSnapping.snapDistance(-47)).toBe(-47)
    })
  })

  describe('getSnapOffset', () => {
    it('should calculate offset needed to snap to grid', () => {
      expect(gridSnapping.getSnapOffset(23, 47)).toEqual({ dx: -3, dy: 3 })
      expect(gridSnapping.getSnapOffset(18, 12)).toEqual({ dx: 2, dy: -2 })
      expect(gridSnapping.getSnapOffset(25, 25)).toEqual({ dx: 5, dy: 5 })
    })

    it('should return zero offset for grid-aligned points', () => {
      expect(gridSnapping.getSnapOffset(20, 40)).toEqual({ dx: 0, dy: 0 })
      expect(gridSnapping.getSnapOffset(0, 0)).toEqual({ dx: 0, dy: 0 })
    })

    it('should return zero offset when disabled', () => {
      gridSnapping.setEnabled(false)
      expect(gridSnapping.getSnapOffset(23, 47)).toEqual({ dx: 0, dy: 0 })
    })
  })

  describe('snapDelta', () => {
    it('should snap movement deltas to grid', () => {
      const from = { x: 20, y: 40 }
      const to = { x: 43, y: 67 }
      
      const snapped = gridSnapping.snapDelta(from, to)
      
      expect(snapped).toEqual({ dx: 20, dy: 30 })
    })

    it('should prevent tiny movements', () => {
      const from = { x: 20, y: 40 }
      const to = { x: 22, y: 43 }
      
      const snapped = gridSnapping.snapDelta(from, to)
      
      expect(snapped).toEqual({ dx: 0, dy: 0 })
    })

    it('should allow free movement when disabled', () => {
      gridSnapping.setEnabled(false)
      
      const from = { x: 20, y: 40 }
      const to = { x: 23, y: 47 }
      
      const snapped = gridSnapping.snapDelta(from, to)
      
      expect(snapped).toEqual({ dx: 3, dy: 7 })
    })
  })

  describe('drawGrid', () => {
    it('should draw grid on canvas', () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = 200
      canvas.height = 200
      
      const strokeSpy = jest.spyOn(ctx, 'stroke')
      const beginPathSpy = jest.spyOn(ctx, 'beginPath')
      
      gridSnapping.drawGrid(ctx, canvas.width, canvas.height)
      
      expect(beginPathSpy).toHaveBeenCalled()
      expect(strokeSpy).toHaveBeenCalled()
      expect(ctx.strokeStyle).toBe('#e5e7eb')
      expect(ctx.lineWidth).toBe(0.5)
    })

    it('should not draw when disabled', () => {
      gridSnapping.setEnabled(false)
      
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      const strokeSpy = jest.spyOn(ctx, 'stroke')
      
      gridSnapping.drawGrid(ctx, canvas.width, canvas.height)
      
      expect(strokeSpy).not.toHaveBeenCalled()
    })

    it('should handle custom grid appearance', () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      gridSnapping.drawGrid(ctx, 200, 200, {
        color: '#ff0000',
        lineWidth: 2,
        opacity: 0.5,
      })
      
      expect(ctx.strokeStyle).toBe('#ff0000')
      expect(ctx.lineWidth).toBe(2)
      expect(ctx.globalAlpha).toBe(0.5)
    })
  })
})