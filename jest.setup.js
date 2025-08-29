import '@testing-library/jest-dom'

// Mock Intersection Observer
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = jest.fn()

// Mock fabric.js for tests
jest.mock('fabric', () => ({
  fabric: {
    Canvas: jest.fn(() => ({
      add: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      renderAll: jest.fn(),
      setZoom: jest.fn(),
      getZoom: jest.fn(),
      setViewportTransform: jest.fn(),
      getViewportTransform: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      dispose: jest.fn(),
    })),
    Rect: jest.fn(),
    Circle: jest.fn(),
    Text: jest.fn(),
    Image: jest.fn(),
    Path: jest.fn(),
  },
}))

// Mock WebSocket
global.WebSocket = class WebSocket {
  constructor(url) {
    this.url = url
    this.readyState = WebSocket.CONNECTING
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      if (this.onopen) this.onopen()
    }, 0)
  }
  
  send(data) {
    // Mock send
  }
  
  close() {
    this.readyState = WebSocket.CLOSED
    if (this.onclose) this.onclose()
  }
}

WebSocket.CONNECTING = 0
WebSocket.OPEN = 1
WebSocket.CLOSING = 2
WebSocket.CLOSED = 3