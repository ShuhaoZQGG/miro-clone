import { act } from '@testing-library/react'

export class RAFMock {
  private callbacks: Map<number, FrameRequestCallback> = new Map()
  private nextId = 1
  private time = 0

  requestAnimationFrame = (callback: FrameRequestCallback): number => {
    const id = this.nextId++
    this.callbacks.set(id, callback)
    return id
  }

  cancelAnimationFrame = (id: number): void => {
    this.callbacks.delete(id)
  }

  step = (deltaTime: number = 16): void => {
    this.time += deltaTime
    const currentCallbacks = Array.from(this.callbacks.entries())
    this.callbacks.clear()
    
    currentCallbacks.forEach(([_, callback]) => {
      callback(this.time)
    })
  }

  flush = (duration: number = 1000): void => {
    const steps = Math.ceil(duration / 16)
    for (let i = 0; i < steps; i++) {
      this.step(16)
    }
  }

  reset = (): void => {
    this.callbacks.clear()
    this.time = 0
    this.nextId = 1
  }
}

export const setupRAFMock = () => {
  const rafMock = new RAFMock()
  
  beforeEach(() => {
    global.requestAnimationFrame = rafMock.requestAnimationFrame as any
    global.cancelAnimationFrame = rafMock.cancelAnimationFrame as any
  })

  afterEach(() => {
    rafMock.reset()
  })

  return rafMock
}

export const waitForAnimationFrame = async (frames: number = 1) => {
  for (let i = 0; i < frames; i++) {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 16))
    })
  }
}

export const createMockCanvas = () => {
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
    wrapperEl: document.createElement('div'),
    selection: true,
    hoverCursor: 'pointer',
    moveCursor: 'grab',
    defaultCursor: 'default',
    requestRenderAll: jest.fn(),
    calcViewportBoundaries: jest.fn(),
    zoomToPoint: jest.fn(),
    _objects: [],
    isDragging: false,
    lastPosX: 0,
    lastPosY: 0
  }
  
  return { mockCanvas, mockCanvasElement }
}

export const createMockPerformanceObserver = () => {
  const observers: any[] = []
  
  class MockPerformanceObserver {
    private _callback: PerformanceObserverCallback
    
    constructor(callback: PerformanceObserverCallback) {
      this._callback = callback
      observers.push(this)
    }
    
    observe(options: any) {}
    disconnect() {
      const index = observers.indexOf(this)
      if (index > -1) {
        observers.splice(index, 1)
      }
    }
    takeRecords() { return [] }
    
    get callback() { return this._callback }
  }
  
  global.PerformanceObserver = MockPerformanceObserver as any
  
  return {
    triggerEntry: (entry: any) => {
      observers.forEach((observer: any) => {
        observer.callback(
          { getEntries: () => [entry], getEntriesByType: () => [entry], getEntriesByName: () => [] } as any,
          observer
        )
      })
    },
    observers
  }
}