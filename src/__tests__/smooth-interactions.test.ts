import { CanvasEngine } from '@/lib/canvas-engine'

// Mock fabric
jest.mock('fabric', () => ({
  fabric: {
    Canvas: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      off: jest.fn(),
      getElement: jest.fn(() => {
        const canvas = document.createElement('canvas')
        return canvas
      }),
      renderAll: jest.fn(),
      requestRenderAll: jest.fn(),
      setDimensions: jest.fn(),
      getPointer: jest.fn(() => ({ x: 100, y: 100 })),
      setViewportTransform: jest.fn(),
      getViewportTransform: jest.fn(() => [1, 0, 0, 1, 0, 0]),
      getWidth: jest.fn(() => 1920),
      getHeight: jest.fn(() => 1080),
      selection: true,
      hoverCursor: 'pointer',
      moveCursor: 'grab',
      defaultCursor: 'default',
      add: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      getObjects: jest.fn(() => []),
      dispose: jest.fn(),
      renderOnAddRemove: false,
      skipOffscreen: true
    })),
    Rect: jest.fn().mockImplementation(() => ({
      set: jest.fn(),
      setCoords: jest.fn()
    })),
    Circle: jest.fn().mockImplementation(() => ({
      set: jest.fn(),
      setCoords: jest.fn()
    })),
    Line: jest.fn().mockImplementation(() => ({
      set: jest.fn(),
      setCoords: jest.fn()
    })),
    Group: jest.fn().mockImplementation(() => ({
      set: jest.fn(),
      setCoords: jest.fn(),
      addWithUpdate: jest.fn()
    })),
    Textbox: jest.fn().mockImplementation(() => ({
      set: jest.fn(),
      setCoords: jest.fn()
    }))
  }
}))

// Mock performance.now()
const mockPerformanceNow = jest.fn()
global.performance.now = mockPerformanceNow

// Mock requestAnimationFrame
let rafCallbacks: FrameRequestCallback[] = []
let rafId = 0

global.requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
  rafCallbacks.push(callback)
  return ++rafId
})

global.cancelAnimationFrame = jest.fn((_id: number) => {
  // Remove callback if exists
})

describe('Smooth Interactions Tests', () => {
  let container: HTMLElement
  let canvasEngine: CanvasEngine

  beforeEach(() => {
    jest.clearAllMocks()
    rafCallbacks = []
    rafId = 0
    mockPerformanceNow.mockReturnValue(0)
    
    container = document.createElement('div')
    container.style.width = '1920px'
    container.style.height = '1080px'
    document.body.appendChild(container)
    
    canvasEngine = new CanvasEngine(container)
  })

  afterEach(() => {
    canvasEngine.dispose()
    document.body.removeChild(container)
  })

  describe('Frame Rate Management', () => {
    it('should maintain 60fps target frame rate', () => {
      // Simulate frames at 60fps (16.67ms per frame)
      const frameTime = 1000 / 60
      
      for (let i = 0; i < 60; i++) {
        mockPerformanceNow.mockReturnValue(i * frameTime)
        
        // Trigger RAF callbacks
        const callbacks = [...rafCallbacks]
        rafCallbacks = []
        callbacks.forEach(cb => cb(i * frameTime))
      }
      
      // Check that frame rate is approximately 60fps
      const fps = canvasEngine.getCurrentFPS()
      expect(fps).toBeGreaterThanOrEqual(59)
      expect(fps).toBeLessThanOrEqual(61)
    })

    it('should throttle render calls to prevent frame drops', () => {
      // Trigger multiple render requests within same frame
      for (let i = 0; i < 10; i++) {
        canvasEngine.render()
      }
      
      // Should only schedule one render per frame
      expect(requestAnimationFrame).toHaveBeenCalledTimes(1)
    })

    it('should use RAF for smooth animations', () => {
      canvasEngine.startAnimation()
      
      expect(requestAnimationFrame).toHaveBeenCalled()
      
      // Trigger animation frame
      const callbacks = [...rafCallbacks]
      rafCallbacks = []
      callbacks.forEach(cb => cb(16.67))
      
      // Should request next frame
      expect(requestAnimationFrame).toHaveBeenCalledTimes(2)
    })
  })

  describe('Drag Operations', () => {
    it('should provide smooth dragging at 60fps', () => {
      const element = canvasEngine.createElement('rectangle', { x: 100, y: 100 })
      
      // Start drag
      canvasEngine.startDrag(element.id, { x: 100, y: 100 })
      
      // Simulate drag frames at 60fps
      const positions = []
      for (let i = 0; i < 60; i++) {
        const time = i * 16.67
        mockPerformanceNow.mockReturnValue(time)
        
        const newPos = { x: 100 + i * 2, y: 100 + i }
        canvasEngine.updateDrag(newPos)
        positions.push(newPos)
        
        // Trigger RAF
        const callbacks = [...rafCallbacks]
        rafCallbacks = []
        callbacks.forEach(cb => cb(time))
      }
      
      // Should have smooth position updates
      expect(positions.length).toBe(60)
      
      // Check for smooth delta (no jumps)
      for (let i = 1; i < positions.length; i++) {
        const deltaX = positions[i].x - positions[i-1].x
        const deltaY = positions[i].y - positions[i-1].y
        expect(deltaX).toBeLessThanOrEqual(3) // Small increments
        expect(deltaY).toBeLessThanOrEqual(3)
      }
    })

    it('should handle drag momentum physics', () => {
      const element = canvasEngine.createElement('rectangle', { x: 100, y: 100 })
      
      // Start fast drag
      canvasEngine.startDrag(element.id, { x: 100, y: 100 })
      
      // Quick drag motion
      canvasEngine.updateDrag({ x: 200, y: 150 })
      
      // Release with momentum
      canvasEngine.endDrag()
      
      // Should continue moving with deceleration
      let lastPos = { x: 200, y: 150 }
      for (let i = 0; i < 30; i++) {
        const time = i * 16.67
        mockPerformanceNow.mockReturnValue(time)
        
        // Trigger RAF for momentum animation
        const callbacks = [...rafCallbacks]
        rafCallbacks = []
        callbacks.forEach(cb => cb(time))
        
        const currentPos = canvasEngine.getElementPosition(element.id)
        
        // Should have momentum (moving beyond release point)
        if (i < 10) {
          expect(currentPos.x).toBeGreaterThan(lastPos.x)
        }
        
        lastPos = currentPos
      }
    })

    it('should debounce drag events for performance', () => {
      const element = canvasEngine.createElement('rectangle', { x: 100, y: 100 })
      
      canvasEngine.startDrag(element.id, { x: 100, y: 100 })
      
      // Rapid drag updates
      const updateSpy = jest.spyOn(canvasEngine, 'updateElementPosition')
      
      for (let i = 0; i < 100; i++) {
        canvasEngine.updateDrag({ x: 100 + i, y: 100 + i })
      }
      
      // Should batch updates, not call 100 times
      expect(updateSpy).toHaveBeenCalledTimes(1) // Throttled
    })
  })

  describe('Resize Operations', () => {
    it('should provide smooth resizing without flicker', () => {
      const element = canvasEngine.createElement('rectangle', { 
        x: 100, 
        y: 100,
        width: 200,
        height: 150
      })
      
      // Start resize
      canvasEngine.startResize(element.id, 'bottom-right')
      
      // Smooth resize animation
      for (let i = 0; i < 30; i++) {
        const time = i * 16.67
        mockPerformanceNow.mockReturnValue(time)
        
        const newSize = {
          width: 200 + i * 5,
          height: 150 + i * 3
        }
        
        canvasEngine.updateResize(newSize)
        
        // Trigger RAF
        const callbacks = [...rafCallbacks]
        rafCallbacks = []
        callbacks.forEach(cb => cb(time))
      }
      
      // Should maintain aspect ratio if constrained
      const finalSize = canvasEngine.getElementSize(element.id)
      expect(finalSize.width).toBeGreaterThan(200)
      expect(finalSize.height).toBeGreaterThan(150)
    })

    it('should handle resize with aspect ratio constraints', () => {
      const element = canvasEngine.createElement('rectangle', {
        x: 100,
        y: 100,
        width: 200,
        height: 100
      })
      
      // Enable aspect ratio lock
      canvasEngine.setAspectRatioLocked(element.id, true)
      
      canvasEngine.startResize(element.id, 'right')
      canvasEngine.updateResize({ width: 400, height: 100 })
      
      const size = canvasEngine.getElementSize(element.id)
      
      // Height should scale proportionally
      expect(size.width).toBe(400)
      expect(size.height).toBe(200) // Maintains 2:1 ratio
    })

    it('should smooth resize transitions with easing', () => {
      const element = canvasEngine.createElement('rectangle', {
        x: 100,
        y: 100,
        width: 100,
        height: 100
      })
      
      // Animate resize with easing
      canvasEngine.animateResize(element.id, {
        width: 300,
        height: 300,
        duration: 500,
        easing: 'ease-out'
      })
      
      const sizes = []
      
      // Sample animation frames
      for (let i = 0; i <= 30; i++) {
        const time = i * 16.67
        mockPerformanceNow.mockReturnValue(time)
        
        // Trigger RAF
        const callbacks = [...rafCallbacks]
        rafCallbacks = []
        callbacks.forEach(cb => cb(time))
        
        const size = canvasEngine.getElementSize(element.id)
        sizes.push(size)
      }
      
      // Check for smooth progression (ease-out should slow down)
      for (let i = 1; i < sizes.length - 1; i++) {
        const delta1 = sizes[i].width - sizes[i-1].width
        const delta2 = sizes[i+1].width - sizes[i].width
        
        // Later deltas should be smaller (deceleration)
        if (i > sizes.length / 2) {
          expect(delta2).toBeLessThanOrEqual(delta1)
        }
      }
    })
  })

  describe('Element Creation', () => {
    it('should animate element creation smoothly', () => {
      const position = { x: 300, y: 200 }
      
      // Create with animation
      const element = canvasEngine.createElementAnimated('circle', position, {
        radius: 50,
        animationDuration: 300
      })
      
      // Initial state should be scaled down
      let scale = canvasEngine.getElementScale(element.id)
      expect(scale).toBeLessThan(1)
      
      // Animate creation
      for (let i = 0; i <= 18; i++) { // 300ms at 60fps
        const time = i * 16.67
        mockPerformanceNow.mockReturnValue(time)
        
        // Trigger RAF
        const callbacks = [...rafCallbacks]
        rafCallbacks = []
        callbacks.forEach(cb => cb(time))
        
        scale = canvasEngine.getElementScale(element.id)
      }
      
      // Should be fully scaled after animation
      expect(scale).toBeCloseTo(1, 1)
    })

    it('should provide ghost preview during creation', () => {
      // Start creation with preview
      canvasEngine.startElementCreation('rectangle')
      
      // Move preview
      canvasEngine.updateCreationPreview({ x: 200, y: 150 })
      
      // Should render preview without creating actual element
      const preview = canvasEngine.getCreationPreview()
      expect(preview).toBeDefined()
      expect(preview.position).toEqual({ x: 200, y: 150 })
      expect(preview.opacity).toBeLessThan(1) // Ghost effect
      
      // Finish creation
      const element = canvasEngine.finishElementCreation()
      expect(element).toBeDefined()
      
      // Preview should be cleared
      expect(canvasEngine.getCreationPreview()).toBeNull()
    })

    it('should smooth creation drag for shapes', () => {
      // Start drag creation
      canvasEngine.startDragCreation('rectangle', { x: 100, y: 100 })
      
      // Drag to create shape
      const dragPositions = []
      for (let i = 0; i < 30; i++) {
        const time = i * 16.67
        mockPerformanceNow.mockReturnValue(time)
        
        const pos = { x: 100 + i * 10, y: 100 + i * 5 }
        canvasEngine.updateDragCreation(pos)
        dragPositions.push(pos)
        
        // Trigger RAF
        const callbacks = [...rafCallbacks]
        rafCallbacks = []
        callbacks.forEach(cb => cb(time))
      }
      
      // Should show smooth size updates
      const preview = canvasEngine.getCreationPreview()
      expect(preview.width).toBeGreaterThan(0)
      expect(preview.height).toBeGreaterThan(0)
      
      // Finish creation
      const element = canvasEngine.finishDragCreation()
      expect(element).toBeDefined()
    })
  })

  describe('Pan and Zoom', () => {
    it('should provide smooth panning at 60fps', () => {
      // Start pan
      canvasEngine.startPan({ x: 500, y: 300 })
      
      const cameraPositions = []
      
      // Pan smoothly
      for (let i = 0; i < 60; i++) {
        const time = i * 16.67
        mockPerformanceNow.mockReturnValue(time)
        
        const panPos = { x: 500 - i * 5, y: 300 - i * 3 }
        canvasEngine.updatePan(panPos)
        
        // Trigger RAF
        const callbacks = [...rafCallbacks]
        rafCallbacks = []
        callbacks.forEach(cb => cb(time))
        
        const camera = canvasEngine.getCamera()
        cameraPositions.push({ x: camera.x, y: camera.y })
      }
      
      // Check smooth camera movement
      for (let i = 1; i < cameraPositions.length; i++) {
        const deltaX = Math.abs(cameraPositions[i].x - cameraPositions[i-1].x)
        const deltaY = Math.abs(cameraPositions[i].y - cameraPositions[i-1].y)
        
        // Small, consistent increments
        expect(deltaX).toBeLessThanOrEqual(6)
        expect(deltaY).toBeLessThanOrEqual(4)
      }
    })

    it('should provide smooth zoom with center point', () => {
      const zoomCenter = { x: 960, y: 540 }
      
      // Animate zoom
      canvasEngine.animateZoomTo(2.0, 500, zoomCenter)
      
      const zoomLevels = []
      
      // Sample zoom animation
      for (let i = 0; i <= 30; i++) {
        const time = i * 16.67
        mockPerformanceNow.mockReturnValue(time)
        
        // Trigger RAF
        const callbacks = [...rafCallbacks]
        rafCallbacks = []
        callbacks.forEach(cb => cb(time))
        
        const camera = canvasEngine.getCamera()
        zoomLevels.push(camera.zoom)
      }
      
      // Should smoothly increase from 1 to 2
      expect(zoomLevels[0]).toBeCloseTo(1, 1)
      expect(zoomLevels[zoomLevels.length - 1]).toBeCloseTo(2, 1)
      
      // Check smooth progression
      for (let i = 1; i < zoomLevels.length; i++) {
        const delta = zoomLevels[i] - zoomLevels[i-1]
        expect(delta).toBeGreaterThanOrEqual(0) // Always increasing
        expect(delta).toBeLessThan(0.1) // Small increments
      }
    })

    it('should handle pinch zoom gestures smoothly', () => {
      // Simulate pinch gesture
      const touch1Start = { x: 400, y: 300 }
      const touch2Start = { x: 600, y: 300 }
      
      canvasEngine.startPinchZoom([touch1Start, touch2Start])
      
      // Pinch out (zoom in)
      for (let i = 0; i < 30; i++) {
        const time = i * 16.67
        mockPerformanceNow.mockReturnValue(time)
        
        const spread = i * 5
        const touches = [
          { x: 400 - spread, y: 300 },
          { x: 600 + spread, y: 300 }
        ]
        
        canvasEngine.updatePinchZoom(touches)
        
        // Trigger RAF
        const callbacks = [...rafCallbacks]
        rafCallbacks = []
        callbacks.forEach(cb => cb(time))
      }
      
      const camera = canvasEngine.getCamera()
      expect(camera.zoom).toBeGreaterThan(1) // Should zoom in
    })
  })

  describe('Performance Monitoring', () => {
    it('should track frame rate accurately', () => {
      // Simulate varying frame rates
      const frameTimes = [
        16.67, 16.67, 16.67, // 60fps
        33.33, 33.33, // 30fps spike
        16.67, 16.67, 16.67 // Back to 60fps
      ]
      
      let totalTime = 0
      frameTimes.forEach((frameTime) => {
        totalTime += frameTime
        mockPerformanceNow.mockReturnValue(totalTime)
        
        // Trigger frame
        const callbacks = [...rafCallbacks]
        rafCallbacks = []
        callbacks.forEach(cb => cb(totalTime))
        
        canvasEngine.updateFrameStats()
      })
      
      const stats = canvasEngine.getPerformanceStats()
      expect(stats.averageFPS).toBeLessThan(60) // Due to 30fps spike
      expect(stats.minFPS).toBeCloseTo(30, 0)
      expect(stats.maxFPS).toBeCloseTo(60, 0)
    })

    it('should auto-adjust quality for performance', () => {
      // Simulate low frame rate
      for (let i = 0; i < 60; i++) {
        const time = i * 33.33 // 30fps (below target)
        mockPerformanceNow.mockReturnValue(time)
        
        // Trigger RAF
        const callbacks = [...rafCallbacks]
        rafCallbacks = []
        callbacks.forEach(cb => cb(time))
        
        canvasEngine.updateFrameStats()
      }
      
      // Should reduce quality settings
      const quality = canvasEngine.getRenderQuality()
      expect(quality).toBe('reduced') // Auto-adjusted for performance
    })

    it('should batch render operations efficiently', () => {
      const renderSpy = jest.spyOn(canvasEngine.getCanvas(), 'renderAll')
      
      // Multiple operations in same frame
      canvasEngine.createElement('rectangle', { x: 100, y: 100 })
      canvasEngine.createElement('circle', { x: 200, y: 200 })
      canvasEngine.createElement('line', { x1: 0, y1: 0, x2: 100, y2: 100 })
      
      // Should batch into single render
      const callbacks = [...rafCallbacks]
      rafCallbacks = []
      callbacks.forEach(cb => cb(16.67))
      
      expect(renderSpy).toHaveBeenCalledTimes(1) // Single batched render
    })
  })
})