// RAF Mock for consistent test timing
export class RAFMock {
  private callbacks: Map<number, FrameRequestCallback> = new Map()
  private nextId = 1
  private time = 0
  private frameTime = 16.67 // ~60fps
  
  constructor() {
    this.reset()
  }
  
  reset(): void {
    this.callbacks.clear()
    this.nextId = 1
    this.time = 0
  }
  
  requestAnimationFrame(callback: FrameRequestCallback): number {
    const id = this.nextId++
    this.callbacks.set(id, callback)
    return id
  }
  
  cancelAnimationFrame(id: number): void {
    this.callbacks.delete(id)
  }
  
  // Flush a specific number of frames
  flush(frames = 1): void {
    for (let i = 0; i < frames; i++) {
      this.time += this.frameTime
      
      // Copy callbacks to avoid issues with callbacks that schedule new frames
      const currentCallbacks = new Map(this.callbacks)
      this.callbacks.clear()
      
      currentCallbacks.forEach(callback => {
        try {
          callback(this.time)
        } catch (error) {
          console.error('Error in RAF callback:', error)
        }
      })
    }
  }
  
  // Advance time by a specific amount and flush all pending frames
  advanceTime(ms: number): void {
    const frames = Math.ceil(ms / this.frameTime)
    this.flush(frames)
  }
  
  // Get current virtual time
  getTime(): number {
    return this.time
  }
  
  // Set frame time for testing different frame rates
  setFrameTime(ms: number): void {
    this.frameTime = ms
  }
  
  // Check if there are pending callbacks
  hasPendingCallbacks(): boolean {
    return this.callbacks.size > 0
  }
  
  // Get number of pending callbacks
  getPendingCallbackCount(): number {
    return this.callbacks.size
  }
  
  // Install mock globally
  install(): void {
    ;(global as any).requestAnimationFrame = this.requestAnimationFrame.bind(this)
    ;(global as any).cancelAnimationFrame = this.cancelAnimationFrame.bind(this)
  }
  
  // Restore original RAF
  uninstall(): void {
    delete (global as any).requestAnimationFrame
    delete (global as any).cancelAnimationFrame
  }
}

// Singleton instance for easy use in tests
export const rafMock = new RAFMock()

// Helper function to setup RAF mock for a test suite
export function setupRAFMock(): RAFMock {
  const mock = new RAFMock()
  
  beforeEach(() => {
    mock.reset()
    mock.install()
  })
  
  afterEach(() => {
    mock.uninstall()
  })
  
  return mock
}

// Helper to wait for animation frames in tests
export async function waitForAnimationFrames(count = 1): Promise<void> {
  return new Promise(resolve => {
    let remaining = count
    
    function frame() {
      remaining--
      if (remaining > 0) {
        requestAnimationFrame(frame)
      } else {
        resolve()
      }
    }
    
    requestAnimationFrame(frame)
  })
}

// Performance.now() mock for consistent timing
export class PerformanceMock {
  private time = 0
  
  now(): number {
    return this.time
  }
  
  advance(ms: number): void {
    this.time += ms
  }
  
  reset(): void {
    this.time = 0
  }
  
  install(): void {
    ;(global as any).performance = {
      now: this.now.bind(this)
    }
  }
  
  uninstall(): void {
    delete (global as any).performance
  }
}

export const performanceMock = new PerformanceMock()

// Combined mock for RAF and performance timing
export class AnimationTimingMock {
  private rafMock: RAFMock
  private performanceMock: PerformanceMock
  
  constructor() {
    this.rafMock = new RAFMock()
    this.performanceMock = new PerformanceMock()
  }
  
  install(): void {
    this.rafMock.install()
    this.performanceMock.install()
  }
  
  uninstall(): void {
    this.rafMock.uninstall()
    this.performanceMock.uninstall()
  }
  
  reset(): void {
    this.rafMock.reset()
    this.performanceMock.reset()
  }
  
  // Advance both time and frames together
  advance(ms: number): void {
    this.performanceMock.advance(ms)
    this.rafMock.advanceTime(ms)
  }
  
  // Flush specific number of frames
  flushFrames(count: number): void {
    const frameTime = 16.67
    this.performanceMock.advance(frameTime * count)
    this.rafMock.flush(count)
  }
}

export const animationTimingMock = new AnimationTimingMock()