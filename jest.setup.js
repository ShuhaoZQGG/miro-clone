import '@testing-library/jest-dom'

// Mock requestAnimationFrame
let rafCallbacks = []
let rafId = 0

global.requestAnimationFrame = jest.fn((callback) => {
  const id = ++rafId
  rafCallbacks.push({ id, callback })
  return id
})

global.cancelAnimationFrame = jest.fn((id) => {
  rafCallbacks = rafCallbacks.filter(cb => cb.id !== id)
})

// Helper to flush RAF callbacks
global.flushRAF = (frames = 1) => {
  for (let i = 0; i < frames; i++) {
    const callbacks = [...rafCallbacks]
    rafCallbacks = []
    callbacks.forEach(({ callback }) => {
      callback(performance.now())
    })
  }
}

// Mock Touch API
global.Touch = class Touch {
  constructor(init) {
    this.identifier = init.identifier
    this.target = init.target
    this.clientX = init.clientX || 0
    this.clientY = init.clientY || 0
    this.pageX = init.pageX || init.clientX || 0
    this.pageY = init.pageY || init.clientY || 0
    this.screenX = init.screenX || init.clientX || 0
    this.screenY = init.screenY || init.clientY || 0
  }
}

// Mock Intersection Observer
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver with callback support
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback
  }
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

// Mock getComputedStyle
window.getComputedStyle = jest.fn().mockImplementation((element) => {
  return {
    getPropertyValue: jest.fn((prop) => {
      // Return common CSS values
      switch(prop) {
        case 'position': return 'fixed'
        case 'top': return '0px'
        case 'right': return '0px'
        case 'bottom': return '0px'
        case 'left': return '0px'
        case 'width': return '100%'
        case 'height': return '100%'
        case 'margin': return '0px'
        case 'padding': return '0px'
        case 'transform': return 'translateZ(0)'
        case 'will-change': return 'transform'
        default: return ''
      }
    }),
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
    width: '100%',
    height: '100%',
    margin: '0px',
    padding: '0px',
    transform: 'translateZ(0)',
    willChange: 'transform'
  }
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
      getZoom: jest.fn(() => 1),
      setViewportTransform: jest.fn(),
      getViewportTransform: jest.fn(() => [1, 0, 0, 1, 0, 0]),
      absolutePan: jest.fn(),
      relativePan: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      dispose: jest.fn(),
      getObjects: jest.fn(() => []),
      setBackgroundColor: jest.fn(),
      setWidth: jest.fn(),
      setHeight: jest.fn(),
      calcOffset: jest.fn(),
    })),
    Rect: jest.fn((options) => ({
      ...options,
      set: jest.fn(),
      setCoords: jest.fn(),
    })),
    Circle: jest.fn((options) => ({
      ...options,
      set: jest.fn(),
      setCoords: jest.fn(),
    })),
    Text: jest.fn((text, options) => ({
      text,
      ...options,
      set: jest.fn(),
      setCoords: jest.fn(),
    })),
    Image: {
      fromURL: jest.fn((url, callback) => {
        if (callback) {
          callback({
            set: jest.fn(),
            setCoords: jest.fn(),
          })
        }
      })
    },
    Path: jest.fn((path, options) => ({
      path,
      ...options,
      set: jest.fn(),
      setCoords: jest.fn(),
    })),
    Group: jest.fn((objects, options) => ({
      objects,
      ...options,
      set: jest.fn(),
      setCoords: jest.fn(),
    })),
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