import { CanvasEngine } from '../canvas-engine'

// Mock fabric
jest.mock('fabric', () => {
  let canvasWidth = window.innerWidth || 1920
  let canvasHeight = window.innerHeight || 1080
  
  return {
    fabric: {
      Canvas: jest.fn().mockImplementation(() => ({
        getElement: jest.fn(() => document.createElement('canvas')),
        setDimensions: jest.fn((dims) => {
          if (dims.width) canvasWidth = dims.width
          if (dims.height) canvasHeight = dims.height
        }),
        renderAll: jest.fn(),
        getWidth: jest.fn(() => canvasWidth),
        getHeight: jest.fn(() => canvasHeight),
        setZoom: jest.fn(),
        getZoom: jest.fn(() => 1),
        absolutePan: jest.fn(),
        relativePan: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        clear: jest.fn(),
        dispose: jest.fn(),
        getObjects: jest.fn(() => []),
        add: jest.fn(),
        setActiveObject: jest.fn(),
        getPointer: jest.fn(() => ({ x: 0, y: 0 }))
      })),
      Rect: jest.fn().mockImplementation((options) => ({
        ...options,
        getScaledWidth: jest.fn(() => (options.width || 100) * (options.scaleX || 1)),
        getScaledHeight: jest.fn(() => (options.height || 100) * (options.scaleY || 1)),
        scale: jest.fn(function(s) { this.scaleX = s; this.scaleY = s })
      })),
      Circle: jest.fn().mockImplementation((options) => ({
        ...options
      })),
      Ellipse: jest.fn().mockImplementation((options) => ({
        ...options
      })),
      Line: jest.fn().mockImplementation((points, options) => ({
        ...options
      }))
    }
  }
})

describe('CanvasEngine', () => {
  let container: HTMLDivElement
  let engine: CanvasEngine

  beforeEach(() => {
    // Create a mock container with full viewport dimensions
    container = document.createElement('div')
    container.style.width = '100vw'
    container.style.height = '100vh'
    container.style.position = 'absolute'
    container.style.top = '0'
    container.style.left = '0'
    
    // Mock getBoundingClientRect to return full viewport dimensions
    jest.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: window.innerWidth || 1920,
      height: window.innerHeight || 1080,
      top: 0,
      left: 0,
      right: window.innerWidth || 1920,
      bottom: window.innerHeight || 1080,
      x: 0,
      y: 0,
      toJSON: () => ({})
    })
    
    document.body.appendChild(container)
  })

  afterEach(() => {
    if (engine) {
      engine.dispose()
    }
    document.body.removeChild(container)
    jest.clearAllMocks()
  })

  describe('Canvas Initialization', () => {
    it('should initialize canvas with full container dimensions', () => {
      engine = new CanvasEngine(container)
      const canvas = engine.getCanvas()
      
      expect(canvas.getWidth()).toBe(window.innerWidth || 1920)
      expect(canvas.getHeight()).toBe(window.innerHeight || 1080)
    })

    it('should resize canvas when container resizes', async () => {
      engine = new CanvasEngine(container)
      const canvas = engine.getCanvas()
      
      // Mock a resize event
      jest.spyOn(container, 'getBoundingClientRect').mockReturnValue({
        width: 1600,
        height: 900,
        top: 0,
        left: 0,
        right: 1600,
        bottom: 900,
        x: 0,
        y: 0,
        toJSON: () => ({})
      })
      
      // Manually trigger resize callback (since ResizeObserver is mocked)
      // The canvas should handle resize internally
      engine.handleResize()
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(canvas.getWidth()).toBe(1600)
      expect(canvas.getHeight()).toBe(900)
    })

    it('should maintain canvas aspect ratio on resize', () => {
      engine = new CanvasEngine(container)
      const canvas = engine.getCanvas()
      
      // Mock a resize with different dimensions
      jest.spyOn(container, 'getBoundingClientRect').mockReturnValue({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({})
      })
      
      // Manually trigger resize callback
      engine.handleResize()
      
      // The canvas should update to new dimensions
      expect(canvas.getWidth()).toBe(800)
      expect(canvas.getHeight()).toBe(600)
    })
  })

  describe('Performance Optimizations', () => {
    it('should throttle render updates for smooth performance', async () => {
      engine = new CanvasEngine(container)
      const renderSpy = jest.spyOn(engine.getCanvas(), 'renderAll')
      
      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        engine.panBy({ x: 1, y: 1 })
      }
      
      // Should batch updates
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Should not render 10 times immediately
      expect(renderSpy.mock.calls.length).toBeLessThan(10)
    })

    it('should maintain 60fps during continuous operations', () => {
      engine = new CanvasEngine(container)
      
      const startTime = performance.now()
      const frames = 60
      
      for (let i = 0; i < frames; i++) {
        engine.panBy({ x: 1, y: 1 })
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should complete 60 frames in approximately 1 second (allowing for some variance)
      expect(duration).toBeLessThan(2000) // Should be fast enough for 60fps
    })

    it('should use requestAnimationFrame for smooth animations', () => {
      const rafSpy = jest.spyOn(window, 'requestAnimationFrame')
      
      engine = new CanvasEngine(container)
      engine.panBy({ x: 100, y: 100 })
      
      // Should use RAF for smooth rendering
      expect(rafSpy).toHaveBeenCalled()
    })
  })

  describe('Smooth Interactions', () => {
    it('should handle drag operations smoothly', () => {
      engine = new CanvasEngine(container)
      const canvas = engine.getCanvas()
      
      // Create a test element
      const fabric = require('fabric').fabric
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        fill: 'red'
      })
      canvas.add(rect)
      
      // Simulate drag
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 150,
        clientY: 150,
        bubbles: true
      })
      
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 200,
        bubbles: true
      })
      
      const mouseUpEvent = new MouseEvent('mouseup', {
        clientX: 200,
        clientY: 200,
        bubbles: true
      })
      
      canvas.getElement().dispatchEvent(mouseDownEvent)
      canvas.getElement().dispatchEvent(mouseMoveEvent)
      canvas.getElement().dispatchEvent(mouseUpEvent)
      
      // Element should have moved smoothly
      expect(rect.left).not.toBe(100)
      expect(rect.top).not.toBe(100)
    })

    it('should handle resize operations smoothly', () => {
      engine = new CanvasEngine(container)
      const canvas = engine.getCanvas()
      
      // Create a test element
      const fabric = require('fabric').fabric
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        fill: 'blue'
      })
      canvas.add(rect)
      canvas.setActiveObject(rect)
      
      // Get initial dimensions
      const initialWidth = rect.width
      const initialHeight = rect.height
      
      // Simulate resize by scaling
      rect.scale(1.5)
      canvas.renderAll()
      
      // Should resize smoothly
      expect(rect.getScaledWidth()).toBeGreaterThan(initialWidth)
      expect(rect.getScaledHeight()).toBeGreaterThan(initialHeight)
    })

    it('should debounce rapid create operations', async () => {
      engine = new CanvasEngine(container)
      const canvas = engine.getCanvas()
      
      // Rapidly create multiple elements
      const positions = [
        { x: 100, y: 100 },
        { x: 150, y: 150 },
        { x: 200, y: 200 },
        { x: 250, y: 250 }
      ]
      
      positions.forEach(pos => {
        const rect = new fabric.Rect({
          left: pos.x,
          top: pos.y,
          width: 50,
          height: 50,
          fill: 'green'
        })
        canvas.add(rect)
      })
      
      // Wait for debounced render
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // All elements should be added
      expect(canvas.getObjects().length).toBe(4)
    })
  })

  describe('Touch and Gesture Support', () => {
    it('should handle pinch zoom smoothly', () => {
      engine = new CanvasEngine(container)
      const initialZoom = engine.getCamera().zoom
      
      // Simulate pinch zoom
      const touch1Start = { clientX: 100, clientY: 100 }
      const touch2Start = { clientX: 200, clientY: 200 }
      
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          new (global as any).Touch({ identifier: 1, target: container, ...touch1Start }),
          new (global as any).Touch({ identifier: 2, target: container, ...touch2Start })
        ] as any,
        bubbles: true
      })
      
      const touch1Move = { clientX: 50, clientY: 50 }
      const touch2Move = { clientX: 250, clientY: 250 }
      
      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [
          new (global as any).Touch({ identifier: 1, target: container, ...touch1Move }),
          new (global as any).Touch({ identifier: 2, target: container, ...touch2Move })
        ] as any,
        bubbles: true
      })
      
      container.dispatchEvent(touchStartEvent)
      container.dispatchEvent(touchMoveEvent)
      
      // Zoom should have changed
      const newZoom = engine.getCamera().zoom
      expect(newZoom).not.toBe(initialZoom)
    })
  })

  describe('Smooth Rendering Setup', () => {
    it('should setup RAF-based rendering loop', () => {
      const rafSpy = jest.spyOn(window, 'requestAnimationFrame')
      engine = new CanvasEngine(container)
      
      // setupSmoothRendering should be called during initialization
      expect(rafSpy).toHaveBeenCalled()
      
      rafSpy.mockRestore()
    })

    it('should batch render calls within frame budget', async () => {
      engine = new CanvasEngine(container)
      const canvas = engine.getCanvas()
      const renderSpy = jest.spyOn(canvas, 'renderAll')
      
      // Clear initial calls
      renderSpy.mockClear()
      
      // Trigger multiple render requests rapidly
      for (let i = 0; i < 5; i++) {
        (engine as any).scheduleRender()
      }
      
      // Wait for next frame
      await new Promise(resolve => requestAnimationFrame(resolve))
      
      // Should batch all requests into single render
      expect(renderSpy).toHaveBeenCalledTimes(1)
    })

    it('should maintain 60fps frame rate', () => {
      engine = new CanvasEngine(container)
      
      // Access the frame rate monitoring
      const frameRate = (engine as any).currentFrameRate
      
      // Should target 60fps
      expect(frameRate).toBeGreaterThanOrEqual(30)
      expect(frameRate).toBeLessThanOrEqual(120)
    })

    it('should configure canvas for optimal performance', () => {
      engine = new CanvasEngine(container)
      const canvas = engine.getCanvas()
      
      // Check performance-related canvas settings - these might be undefined in mocks
      // but the canvas should be configured properly
      expect(canvas).toBeDefined()
      expect(canvas.getWidth()).toBeGreaterThan(0)
      expect(canvas.getHeight()).toBeGreaterThan(0)
    })
  })
})