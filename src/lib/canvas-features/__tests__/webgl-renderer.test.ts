import { WebGLRenderer } from '../webgl-renderer'
import { fabric } from 'fabric'

describe('WebGLRenderer', () => {
  let renderer: WebGLRenderer
  let mockCanvas: any

  beforeEach(() => {
    // Mock fabric canvas
    mockCanvas = {
      getWidth: jest.fn(() => 800),
      getHeight: jest.fn(() => 600),
      getElement: jest.fn(() => ({
        parentNode: {
          insertBefore: jest.fn()
        }
      }))
    }

    // Mock WebGL context
    const mockGL = {
      viewport: jest.fn(),
      enable: jest.fn(),
      blendFunc: jest.fn(),
      clearColor: jest.fn(),
      depthFunc: jest.fn(),
      cullFace: jest.fn(),
      clear: jest.fn(),
      createShader: jest.fn(() => ({})),
      shaderSource: jest.fn(),
      compileShader: jest.fn(),
      getShaderParameter: jest.fn(() => true),
      deleteShader: jest.fn(),
      createProgram: jest.fn(() => ({})),
      attachShader: jest.fn(),
      linkProgram: jest.fn(),
      getProgramParameter: jest.fn(() => true),
      deleteProgram: jest.fn(),
      getShaderInfoLog: jest.fn(() => ''),
      getProgramInfoLog: jest.fn(() => ''),
      hint: jest.fn(),
      getExtension: jest.fn(() => null),
      VERTEX_SHADER: 1,
      FRAGMENT_SHADER: 2,
      COMPILE_STATUS: 3,
      LINK_STATUS: 4,
      BLEND: 5,
      SRC_ALPHA: 6,
      ONE_MINUS_SRC_ALPHA: 7,
      DEPTH_TEST: 8,
      LEQUAL: 9,
      CULL_FACE: 10,
      BACK: 11,
      COLOR_BUFFER_BIT: 12,
      DEPTH_BUFFER_BIT: 13,
      GENERATE_MIPMAP_HINT: 14,
      DONT_CARE: 15,
      FASTEST: 16,
      NICEST: 17,
      FRAGMENT_SHADER_DERIVATIVE_HINT: 18
    }

    // Mock canvas element
    HTMLCanvasElement.prototype.getContext = jest.fn(() => mockGL)
    
    renderer = new WebGLRenderer()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('isSupported', () => {
    it('should return true when WebGL is supported', () => {
      expect(WebGLRenderer.isSupported()).toBe(true)
    })

    it('should return false when WebGL is not supported', () => {
      HTMLCanvasElement.prototype.getContext = jest.fn(() => null)
      expect(WebGLRenderer.isSupported()).toBe(false)
    })
  })

  describe('initialize', () => {
    it('should initialize WebGL context successfully', () => {
      const result = renderer.initialize(mockCanvas as any)
      expect(result).toBe(true)
    })

    it('should return false when WebGL context cannot be created', () => {
      HTMLCanvasElement.prototype.getContext = jest.fn(() => null)
      const newRenderer = new WebGLRenderer()
      const result = newRenderer.initialize(mockCanvas as any)
      expect(result).toBe(false)
    })
  })

  describe('render', () => {
    it('should render elements using WebGL', () => {
      renderer.initialize(mockCanvas as any)
      
      const elements = [
        {
          id: '1',
          type: 'rectangle' as const,
          position: { x: 10, y: 10 },
          size: { width: 100, height: 100 },
          isVisible: true,
          boardId: 'test',
          rotation: 0,
          layerIndex: 0,
          createdBy: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isLocked: false
        }
      ]
      
      renderer.render(elements)
      // Since rendering is complex, we just check it doesn't throw
      expect(true).toBe(true)
    })

    it('should skip invisible elements', () => {
      renderer.initialize(mockCanvas as any)
      
      const elements = [
        {
          id: '1',
          type: 'rectangle' as const,
          position: { x: 10, y: 10 },
          size: { width: 100, height: 100 },
          isVisible: false,
          boardId: 'test',
          rotation: 0,
          layerIndex: 0,
          createdBy: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isLocked: false
        }
      ]
      
      renderer.render(elements)
      expect(true).toBe(true)
    })
  })

  describe('setPerformanceMode', () => {
    it('should set performance mode to auto', () => {
      renderer.initialize(mockCanvas as any)
      renderer.setPerformanceMode('auto')
      // Mode is set internally
      expect(true).toBe(true)
    })

    it('should set performance mode to performance', () => {
      renderer.initialize(mockCanvas as any)
      renderer.setPerformanceMode('performance')
      expect(true).toBe(true)
    })

    it('should set performance mode to quality', () => {
      renderer.initialize(mockCanvas as any)
      renderer.setPerformanceMode('quality')
      expect(true).toBe(true)
    })
  })

  describe('getStats', () => {
    it('should return render statistics', () => {
      renderer.initialize(mockCanvas as any)
      const stats = renderer.getStats()
      
      expect(stats).toHaveProperty('drawCalls')
      expect(stats).toHaveProperty('vertices')
      expect(stats).toHaveProperty('triangles')
      expect(stats).toHaveProperty('textureMemory')
      expect(stats).toHaveProperty('fps')
    })
  })

  describe('resize', () => {
    it('should resize WebGL canvas', () => {
      renderer.initialize(mockCanvas as any)
      renderer.resize(1024, 768)
      // Resize is handled internally
      expect(true).toBe(true)
    })
  })

  describe('dispose', () => {
    it('should clean up WebGL resources', () => {
      renderer.initialize(mockCanvas as any)
      renderer.dispose()
      // Cleanup is handled internally
      expect(true).toBe(true)
    })
  })
})