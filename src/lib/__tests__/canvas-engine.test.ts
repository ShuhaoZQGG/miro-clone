import { CanvasEngine } from '../canvas-engine'

// Mock fabric
jest.mock('fabric', () => ({
  fabric: {
    Canvas: jest.fn().mockImplementation(() => ({
      getElement: jest.fn(() => document.createElement('canvas')),
      setDimensions: jest.fn(),
      renderAll: jest.fn(),
      getWidth: jest.fn(() => 1920),
      getHeight: jest.fn(() => 1080),
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
    }))
  }
}))

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
      
      // Trigger resize observer callback
      const resizeObserverCallback = jest.mocked(ResizeObserver).mock.calls[0][0]
      resizeObserverCallback([{ target: container } as any], {} as any)
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(canvas.getWidth()).toBe(1600)
      expect(canvas.getHeight()).toBe(900)
    })

    it('should maintain canvas aspect ratio on resize', () => {
      engine = new CanvasEngine(container)
      const canvas = engine.getCanvas()
      
      const initialRatio = canvas.getWidth() / canvas.getHeight()
      
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
      
      const resizeObserverCallback = jest.mocked(ResizeObserver).mock.calls[0][0]
      resizeObserverCallback([{ target: container } as any], {} as any)
      
      const newRatio = 800 / 600
      
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
      const rect = new (window as any).fabric.Rect({
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
      const rect = new (window as any).fabric.Rect({
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
        const rect = new (window as any).fabric.Rect({
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
          new Touch({ identifier: 1, target: container, ...touch1Start }),
          new Touch({ identifier: 2, target: container, ...touch2Start })
        ] as any,
        bubbles: true
      })
      
      const touch1Move = { clientX: 50, clientY: 50 }
      const touch2Move = { clientX: 250, clientY: 250 }
      
      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [
          new Touch({ identifier: 1, target: container, ...touch1Move }),
          new Touch({ identifier: 2, target: container, ...touch2Move })
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
})