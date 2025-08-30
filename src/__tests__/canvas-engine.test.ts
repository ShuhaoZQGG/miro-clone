import { CanvasEngine } from '@/lib/canvas-engine'
import { Position, CanvasElement } from '@/types'

// Mock fabric.js
const mockCanvasElement = document.createElement('canvas')
const mockCanvas = {
  add: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
  renderAll: jest.fn(),
  setZoom: jest.fn(),
  getZoom: jest.fn().mockReturnValue(1),
  setViewportTransform: jest.fn(),
  getViewportTransform: jest.fn().mockReturnValue([1, 0, 0, 1, 0, 0]),
  on: jest.fn(),
  off: jest.fn(),
  dispose: jest.fn(),
  getPointer: jest.fn().mockReturnValue({ x: 0, y: 0 }),
  getWidth: jest.fn().mockReturnValue(800),
  getHeight: jest.fn().mockReturnValue(600),
  relativePan: jest.fn(),
  absolutePan: jest.fn(),
  viewportCenterObject: jest.fn(),
  calcOffset: jest.fn(),
  toDataURL: jest.fn(),
  forEachObject: jest.fn(),
  getObjects: jest.fn().mockReturnValue([]),
  setDimensions: jest.fn(),
  getElement: jest.fn().mockReturnValue(mockCanvasElement),
  wrapperEl: document.createElement('canvas'),
  selection: true,
  hoverCursor: 'pointer',
  moveCursor: 'grab',
  defaultCursor: 'default'
}

jest.mock('fabric', () => ({
  fabric: {
    Canvas: jest.fn(() => mockCanvas),
    Rect: jest.fn(),
    Circle: jest.fn(),
    Text: jest.fn(),
    Image: jest.fn(),
  }
}))

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn().mockImplementation(cb => setTimeout(cb, 16))
global.cancelAnimationFrame = jest.fn()

describe('CanvasEngine', () => {
  let canvasEngine: CanvasEngine
  let mockContainer: HTMLElement

  beforeEach(() => {
    jest.useFakeTimers()
    
    // Create a mock canvas container
    mockContainer = document.createElement('div')
    mockContainer.style.width = '800px'
    mockContainer.style.height = '600px'
    document.body.appendChild(mockContainer)

    canvasEngine = new CanvasEngine(mockContainer)
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
    if (canvasEngine) {
      try {
        canvasEngine.dispose()
      } catch {
        // Ignore disposal errors in tests
      }
    }
    if (mockContainer && mockContainer.parentNode) {
      document.body.removeChild(mockContainer)
    }
  })

  describe('Canvas Initialization', () => {
    it('should initialize canvas with default settings', () => {
      expect(canvasEngine.getCamera()).toEqual({
        x: 0,
        y: 0,
        zoom: 1
      })
      expect(canvasEngine.getCanvasSize()).toEqual({
        width: 800,
        height: 600
      })
    })

    it('should set up event listeners for canvas interactions', () => {
      expect(mockCanvas.on).toHaveBeenCalledWith('mouse:wheel', expect.any(Function))
      expect(mockCanvas.on).toHaveBeenCalledWith('mouse:down', expect.any(Function))
      expect(mockCanvas.on).toHaveBeenCalledWith('mouse:move', expect.any(Function))
      expect(mockCanvas.on).toHaveBeenCalledWith('mouse:up', expect.any(Function))
    })

    it('should initialize with empty element collection', () => {
      expect(canvasEngine.getElements()).toEqual([])
      expect(canvasEngine.getSelectedElementIds()).toEqual([])
    })
  })

  describe('Camera Controls - Pan', () => {
    it('should pan to absolute position', () => {
      const newPosition: Position = { x: 100, y: 150 }
      
      canvasEngine.panTo(newPosition)
      
      const camera = canvasEngine.getCamera()
      expect(camera.x).toBe(100)
      expect(camera.y).toBe(150)
      expect(mockCanvas.absolutePan).toHaveBeenCalledWith({ x: -100, y: -150 })
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })

    it('should pan by relative offset', () => {
      const initialCamera = canvasEngine.getCamera()
      const panDelta: Position = { x: 50, y: -30 }
      
      canvasEngine.panBy(panDelta)
      
      const camera = canvasEngine.getCamera()
      expect(camera.x).toBe(initialCamera.x + 50)
      expect(camera.y).toBe(initialCamera.y - 30)
      expect(mockCanvas.relativePan).toHaveBeenCalledWith(panDelta)
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })

    it('should smoothly animate pan to position', async () => {
      const targetPosition: Position = { x: 200, y: 100 }
      const duration = 300
      
      const panPromise = canvasEngine.animatePanTo(targetPosition, duration)
      
      // Fast-forward animation
      jest.advanceTimersByTime(duration + 100)
      
      await panPromise
      
      const camera = canvasEngine.getCamera()
      expect(camera.x).toBe(200)
      expect(camera.y).toBe(100)
    })

    it('should respect pan boundaries when set', () => {
      const boundaries = {
        minX: -500,
        maxX: 500,
        minY: -300,
        maxY: 300
      }
      
      canvasEngine.setPanBoundaries(boundaries)
      
      // Try to pan beyond boundaries
      canvasEngine.panTo({ x: 1000, y: 1000 })
      
      const camera = canvasEngine.getCamera()
      expect(camera.x).toBe(500) // Clamped to maxX
      expect(camera.y).toBe(300) // Clamped to maxY
    })

    it('should emit pan events when panning', () => {
      const panListener = jest.fn()
      canvasEngine.on('pan', panListener)
      
      canvasEngine.panTo({ x: 50, y: 75 })
      
      expect(panListener).toHaveBeenCalledWith({
        position: { x: 50, y: 75 },
        delta: { x: 50, y: 75 }
      })
    })
  })

  describe('Camera Controls - Zoom', () => {
    it('should zoom to specific level', () => {
      canvasEngine.zoomTo(1.5)
      
      expect(mockCanvas.setZoom).toHaveBeenCalledWith(1.5)
      expect(mockCanvas.renderAll).toHaveBeenCalled()
      expect(canvasEngine.getCamera().zoom).toBe(1.5)
    })

    it('should zoom by relative factor', () => {
      canvasEngine.zoomTo(1.0)
      canvasEngine.zoomBy(1.5)
      
      expect(mockCanvas.setZoom).toHaveBeenLastCalledWith(1.5)
      expect(canvasEngine.getCamera().zoom).toBe(1.5)
    })

    it('should zoom to point (center zoom on specific position)', () => {
      const zoomPoint: Position = { x: 400, y: 300 }
      const zoomLevel = 2.0
      
      canvasEngine.zoomToPoint(zoomPoint, zoomLevel)
      
      expect(mockCanvas.setZoom).toHaveBeenCalledWith(2.0)
      expect(canvasEngine.getCamera().zoom).toBe(2.0)
    })

    it('should respect minimum zoom level', () => {
      const minZoom = 0.1
      canvasEngine.setZoomLimits(minZoom, 5.0)
      
      canvasEngine.zoomTo(0.05)
      
      expect(canvasEngine.getCamera().zoom).toBe(minZoom)
    })

    it('should respect maximum zoom level', () => {
      const maxZoom = 3.0
      canvasEngine.setZoomLimits(0.1, maxZoom)
      
      canvasEngine.zoomTo(5.0)
      
      expect(canvasEngine.getCamera().zoom).toBe(maxZoom)
    })

    it('should smoothly animate zoom changes', async () => {
      const targetZoom = 2.5
      const duration = 250
      
      const zoomPromise = canvasEngine.animateZoomTo(targetZoom, duration)
      
      jest.advanceTimersByTime(duration + 100)
      
      await zoomPromise
      
      expect(canvasEngine.getCamera().zoom).toBe(targetZoom)
    })

    it('should fit all elements in view', () => {
      const mockElements = [
        { id: '1', position: { x: 0, y: 0 }, size: { width: 100, height: 50 } },
        { id: '2', position: { x: 200, y: 150 }, size: { width: 80, height: 60 } }
      ]
      
      canvasEngine.fitToElements(mockElements as CanvasElement[])
      
      // Should calculate bounds and set appropriate zoom/pan
      expect(mockCanvas.setZoom).toHaveBeenCalled()
      expect(mockCanvas.absolutePan).toHaveBeenCalled()
    })

    it('should emit zoom events when zooming', () => {
      const zoomListener = jest.fn()
      canvasEngine.on('zoom', zoomListener)
      
      canvasEngine.zoomTo(1.8)
      
      expect(zoomListener).toHaveBeenCalledWith({
        zoom: 1.8,
        previousZoom: 1.0,
        center: expect.any(Object)
      })
    })
  })

  describe('Mouse/Touch Interaction Handling', () => {
    it('should handle mouse wheel zoom', () => {
      const wheelEvent = {
        deltaY: -100,
        pointer: { x: 400, y: 300 },
        e: { preventDefault: jest.fn() }
      }
      
      // Simulate wheel event
      const wheelHandler = mockCanvas.on.mock.calls.find(
        call => call[0] === 'mouse:wheel'
      )[1]
      
      wheelHandler(wheelEvent)
      
      expect(wheelEvent.e.preventDefault).toHaveBeenCalled()
      // Should zoom in (negative deltaY means zoom in)
      expect(mockCanvas.setZoom).toHaveBeenCalled()
    })

    it('should handle pan with middle mouse button', () => {
      // Simulate mouse down with middle button
      const mouseDownEvent = {
        e: { button: 1 }, // Middle mouse button
        pointer: { x: 400, y: 300 }
      }
      
      const mouseDownHandler = mockCanvas.on.mock.calls.find(
        call => call[0] === 'mouse:down'
      )[1]
      
      mouseDownHandler(mouseDownEvent)
      
      // Should enter pan mode
      expect(canvasEngine.isPanning()).toBe(true)
    })

    it('should handle pan with space key + mouse drag', () => {
      canvasEngine.setSpaceKeyPressed(true)
      
      const mouseDownEvent = {
        e: { button: 0 }, // Left mouse button
        pointer: { x: 300, y: 200 }
      }
      
      const mouseDownHandler = mockCanvas.on.mock.calls.find(
        call => call[0] === 'mouse:down'
      )[1]
      
      mouseDownHandler(mouseDownEvent)
      
      expect(canvasEngine.isPanning()).toBe(true)
    })

    it('should handle touch gestures for zoom/pan', () => {
      const touchEvent = {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 200 }
        ],
        preventDefault: jest.fn()
      } as unknown as TouchEvent
      
      canvasEngine.handleTouchStart(touchEvent)
      
      expect(touchEvent.preventDefault).toHaveBeenCalled()
    })
  })

  describe('Coordinate System Transformations', () => {
    it('should convert screen coordinates to canvas coordinates', () => {
      canvasEngine.panTo({ x: 100, y: 50 })
      canvasEngine.zoomTo(2.0)
      
      const screenPoint: Position = { x: 400, y: 300 }
      const canvasPoint = canvasEngine.screenToCanvas(screenPoint)
      
      expect(canvasPoint).toEqual({
        x: (screenPoint.x / 2.0) - 100,
        y: (screenPoint.y / 2.0) - 50
      })
    })

    it('should convert canvas coordinates to screen coordinates', () => {
      canvasEngine.panTo({ x: 50, y: 25 })
      canvasEngine.zoomTo(1.5)
      
      const canvasPoint: Position = { x: 200, y: 150 }
      const screenPoint = canvasEngine.canvasToScreen(canvasPoint)
      
      expect(screenPoint).toEqual({
        x: (canvasPoint.x + 50) * 1.5,
        y: (canvasPoint.y + 25) * 1.5
      })
    })

    it('should get visible bounds based on current camera', () => {
      canvasEngine.panTo({ x: 100, y: 200 })
      canvasEngine.zoomTo(0.8)
      
      const visibleBounds = canvasEngine.getVisibleBounds()
      
      expect(visibleBounds).toEqual({
        x: 100 - (800 / 2) / 0.8,
        y: 200 - (600 / 2) / 0.8,
        width: 800 / 0.8,
        height: 600 / 0.8
      })
    })
  })

  describe('Performance Optimization', () => {
    it('should enable virtualization for large element counts', () => {
      canvasEngine.enableVirtualization(true)
      
      expect(canvasEngine.isVirtualizationEnabled()).toBe(true)
    })

    it('should cull off-screen elements when virtualization is enabled', () => {
      canvasEngine.enableVirtualization(true)
      
      const elements = Array.from({ length: 1000 }, (_, i) => ({
        id: `element-${i}`,
        position: { x: i * 100, y: i * 100 },
        size: { width: 50, height: 50 }
      }))
      
      const visibleElements = canvasEngine.cullElements(elements as CanvasElement[])
      
      // Should return fewer elements than total (only visible ones)
      expect(visibleElements.length).toBeLessThan(elements.length)
    })

    it('should throttle render calls during rapid interactions', () => {
      const renderSpy = jest.spyOn(canvasEngine, 'render')
      
      // Rapidly trigger multiple renders
      for (let i = 0; i < 10; i++) {
        canvasEngine.panBy({ x: 1, y: 1 })
      }
      
      // Should throttle to avoid excessive renders
      expect(renderSpy).toHaveBeenCalledTimes(1)
    })

    it('should maintain 60fps during smooth animations', async () => {
      // Start an animation
      canvasEngine.animateZoomTo(2.0, 1000)
      
      // Measure frame rate during animation
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const currentFrameRate = canvasEngine.getFrameRate()
      expect(currentFrameRate).toBeGreaterThanOrEqual(50) // Allow some tolerance
    })
  })

  describe('State Management', () => {
    it('should save and restore camera state', () => {
      canvasEngine.panTo({ x: 150, y: 100 })
      canvasEngine.zoomTo(1.8)
      
      const savedState = canvasEngine.saveCameraState()
      
      canvasEngine.panTo({ x: 0, y: 0 })
      canvasEngine.zoomTo(1.0)
      
      canvasEngine.restoreCameraState(savedState)
      
      const camera = canvasEngine.getCamera()
      expect(camera).toEqual({ x: 150, y: 100, zoom: 1.8 })
    })

    it('should reset camera to default state', () => {
      canvasEngine.panTo({ x: 300, y: 400 })
      canvasEngine.zoomTo(2.5)
      
      canvasEngine.resetCamera()
      
      const camera = canvasEngine.getCamera()
      expect(camera).toEqual({ x: 0, y: 0, zoom: 1 })
    })

    it('should track canvas state changes', () => {
      const stateChangeListener = jest.fn()
      canvasEngine.on('stateChange', stateChangeListener)
      
      canvasEngine.panTo({ x: 50, y: 50 })
      
      expect(stateChangeListener).toHaveBeenCalledWith({
        type: 'camera',
        camera: { x: 50, y: 50, zoom: 1 }
      })
    })
  })

  describe('Event System', () => {
    it('should allow subscribing to canvas events', () => {
      const panListener = jest.fn()
      const zoomListener = jest.fn()
      
      canvasEngine.on('pan', panListener)
      canvasEngine.on('zoom', zoomListener)
      
      canvasEngine.panTo({ x: 100, y: 200 })
      canvasEngine.zoomTo(1.5)
      
      expect(panListener).toHaveBeenCalled()
      expect(zoomListener).toHaveBeenCalled()
    })

    it('should allow unsubscribing from canvas events', () => {
      const listener = jest.fn()
      
      canvasEngine.on('pan', listener)
      canvasEngine.off('pan', listener)
      
      canvasEngine.panTo({ x: 50, y: 50 })
      
      expect(listener).not.toHaveBeenCalled()
    })

    it('should emit events with correct data', () => {
      const panListener = jest.fn()
      canvasEngine.on('pan', panListener)
      
      canvasEngine.panTo({ x: 75, y: 125 })
      
      expect(panListener).toHaveBeenCalledWith({
        position: { x: 75, y: 125 },
        delta: { x: 75, y: 125 }
      })
    })
  })

  describe('Canvas Cleanup', () => {
    it('should properly dispose of canvas and resources', () => {
      canvasEngine.dispose()
      
      expect(mockCanvas.dispose).toHaveBeenCalled()
      expect(mockCanvas.off).toHaveBeenCalledWith('mouse:wheel')
      expect(mockCanvas.off).toHaveBeenCalledWith('mouse:down')
      expect(mockCanvas.off).toHaveBeenCalledWith('mouse:move')
      expect(mockCanvas.off).toHaveBeenCalledWith('mouse:up')
    })

    it('should clear all event listeners on dispose', () => {
      const listener = jest.fn()
      canvasEngine.on('pan', listener)
      
      canvasEngine.dispose()
      
      // Should not emit events after disposal
      canvasEngine.emit('pan', { position: { x: 0, y: 0 }, delta: { x: 0, y: 0 } })
      expect(listener).not.toHaveBeenCalled()
    })
    
    it('should handle multiple disposal attempts gracefully', () => {
      // First disposal
      expect(() => canvasEngine.dispose()).not.toThrow()
      
      // Second disposal should not throw
      expect(() => canvasEngine.dispose()).not.toThrow()
      
      // Third disposal should also not throw
      expect(() => canvasEngine.dispose()).not.toThrow()
    })
    
    it('should handle disposal when canvas element is not in DOM', () => {
      // Remove the canvas element from DOM before disposal
      const canvasEl = mockCanvas.getElement()
      if (canvasEl && canvasEl.parentNode) {
        canvasEl.parentNode.removeChild(canvasEl)
      }
      
      // Should not throw error
      expect(() => canvasEngine.dispose()).not.toThrow()
    })
  })
})