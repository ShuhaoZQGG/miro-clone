import { fabric } from 'fabric'
import { CanvasElement } from '@/types'

interface WebGLConfig {
  antialias?: boolean
  alpha?: boolean
  preserveDrawingBuffer?: boolean
  powerPreference?: 'default' | 'high-performance' | 'low-power'
}

interface RenderStats {
  drawCalls: number
  vertices: number
  triangles: number
  textureMemory: number
  fps: number
}

export class WebGLRenderer {
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null
  private canvas: HTMLCanvasElement | null = null
  private fabricCanvas: fabric.Canvas | null = null
  private isWebGL2 = false
  private renderStats: RenderStats = {
    drawCalls: 0,
    vertices: 0,
    triangles: 0,
    textureMemory: 0,
    fps: 60
  }
  private lastFrameTime = 0
  private frameCount = 0
  private textureCache = new Map<string, WebGLTexture>()
  private shaderPrograms = new Map<string, WebGLProgram>()
  private vertexBuffers = new Map<string, WebGLBuffer>()
  private performanceMode: 'auto' | 'performance' | 'quality' = 'auto'
  private elementThreshold = 100 // Switch to WebGL when > 100 elements
  
  constructor(private config: WebGLConfig = {}) {
    this.config = {
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
      ...config
    }
  }

  /**
   * Check if WebGL is supported in the current browser
   */
  static isSupported(): boolean {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      return !!gl
    } catch {
      return false
    }
  }

  /**
   * Initialize WebGL renderer with a fabric canvas
   */
  initialize(fabricCanvas: fabric.Canvas): boolean {
    try {
      this.fabricCanvas = fabricCanvas
      
      // Create a separate canvas for WebGL rendering
      this.canvas = document.createElement('canvas')
      this.canvas.width = fabricCanvas.getWidth()
      this.canvas.height = fabricCanvas.getHeight()
      this.canvas.style.position = 'absolute'
      this.canvas.style.pointerEvents = 'none'
      this.canvas.style.zIndex = '-1'
      
      // Try WebGL2 first, fallback to WebGL1
      this.gl = this.canvas.getContext('webgl2', this.config) as WebGL2RenderingContext
      if (this.gl) {
        this.isWebGL2 = true
      } else {
        this.gl = this.canvas.getContext('webgl', this.config) as WebGLRenderingContext
        if (!this.gl) {
          console.warn('WebGL not supported')
          return false
        }
      }
      
      // Insert WebGL canvas behind fabric canvas
      const fabricElement = fabricCanvas.getElement()
      if (fabricElement.parentNode) {
        fabricElement.parentNode.insertBefore(this.canvas, fabricElement)
      }
      
      // Initialize WebGL context
      this.setupWebGL()
      this.initializeShaders()
      
      // Start monitoring performance
      this.startPerformanceMonitoring()
      
      return true
    } catch (error) {
      console.error('Failed to initialize WebGL:', error)
      return false
    }
  }

  /**
   * Setup WebGL context and initial state
   */
  private setupWebGL(): void {
    if (!this.gl) return
    
    const gl = this.gl
    
    // Set viewport
    gl.viewport(0, 0, this.canvas!.width, this.canvas!.height)
    
    // Enable blending for transparency
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    
    // Clear color
    gl.clearColor(0, 0, 0, 0)
    
    // Enable depth testing for proper layering
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    
    // Enable culling for performance
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)
  }

  /**
   * Initialize basic shaders for rendering
   */
  private initializeShaders(): void {
    if (!this.gl) return
    
    // Basic vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      
      uniform mat3 u_matrix;
      
      varying vec2 v_texCoord;
      
      void main() {
        vec3 position = u_matrix * vec3(a_position, 1.0);
        gl_Position = vec4(position.xy, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `
    
    // Basic fragment shader
    const fragmentShaderSource = `
      precision mediump float;
      
      uniform sampler2D u_texture;
      uniform vec4 u_color;
      uniform float u_opacity;
      
      varying vec2 v_texCoord;
      
      void main() {
        vec4 texColor = texture2D(u_texture, v_texCoord);
        gl_FragColor = texColor * u_color * u_opacity;
      }
    `
    
    // Compile and link shader program
    const program = this.createShaderProgram(vertexShaderSource, fragmentShaderSource)
    if (program) {
      this.shaderPrograms.set('basic', program)
    }
  }

  /**
   * Create and compile a shader program
   */
  private createShaderProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    if (!this.gl) return null
    
    const gl = this.gl
    
    // Compile vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    if (!vertexShader) return null
    
    gl.shaderSource(vertexShader, vertexSource)
    gl.compileShader(vertexShader)
    
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('Vertex shader compilation error:', gl.getShaderInfoLog(vertexShader))
      gl.deleteShader(vertexShader)
      return null
    }
    
    // Compile fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    if (!fragmentShader) {
      gl.deleteShader(vertexShader)
      return null
    }
    
    gl.shaderSource(fragmentShader, fragmentSource)
    gl.compileShader(fragmentShader)
    
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Fragment shader compilation error:', gl.getShaderInfoLog(fragmentShader))
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      return null
    }
    
    // Link program
    const program = gl.createProgram()
    if (!program) {
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      return null
    }
    
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Shader program linking error:', gl.getProgramInfoLog(program))
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      return null
    }
    
    // Clean up shaders (they're linked to the program now)
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    
    return program
  }

  /**
   * Render elements using WebGL
   */
  render(elements: CanvasElement[]): void {
    if (!this.gl || !this.canvas) return
    
    const gl = this.gl
    
    // Reset stats
    this.renderStats.drawCalls = 0
    this.renderStats.vertices = 0
    this.renderStats.triangles = 0
    
    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    
    // Check if we should use WebGL based on element count
    if (!this.shouldUseWebGL(elements.length)) {
      // Let fabric handle rendering
      return
    }
    
    // Batch render by element type for better performance
    const batches = this.batchElements(elements)
    
    for (const [type, batch] of batches) {
      this.renderBatch(type, batch)
    }
    
    // Update performance stats
    this.updatePerformanceStats()
  }

  /**
   * Check if WebGL should be used based on performance mode and element count
   */
  private shouldUseWebGL(elementCount: number): boolean {
    switch (this.performanceMode) {
      case 'performance':
        return true
      case 'quality':
        return false
      case 'auto':
      default:
        return elementCount > this.elementThreshold
    }
  }

  /**
   * Batch elements by type for efficient rendering
   */
  private batchElements(elements: CanvasElement[]): Map<string, CanvasElement[]> {
    const batches = new Map<string, CanvasElement[]>()
    
    for (const element of elements) {
      const type = element.type
      if (!batches.has(type)) {
        batches.set(type, [])
      }
      batches.get(type)!.push(element)
    }
    
    return batches
  }

  /**
   * Render a batch of elements of the same type
   */
  private renderBatch(type: string, elements: CanvasElement[]): void {
    if (!this.gl) return
    
    const gl = this.gl
    const program = this.shaderPrograms.get('basic')
    if (!program) return
    
    gl.useProgram(program)
    
    // Get attribute and uniform locations
    const positionLocation = gl.getAttribLocation(program, 'a_position')
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord')
    const matrixLocation = gl.getUniformLocation(program, 'u_matrix')
    const colorLocation = gl.getUniformLocation(program, 'u_color')
    const opacityLocation = gl.getUniformLocation(program, 'u_opacity')
    
    // Create or get vertex buffer for this type
    let vertexBuffer = this.vertexBuffers.get(type)
    if (!vertexBuffer) {
      vertexBuffer = gl.createBuffer()
      if (vertexBuffer) {
        this.vertexBuffers.set(type, vertexBuffer)
      }
    }
    
    if (!vertexBuffer) return
    
    // Bind vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    
    // Render each element
    for (const element of elements) {
      // Skip invisible elements
      if (!element.isVisible) continue
      
      // Create vertex data based on element type
      const vertices = this.createVertices(element)
      if (!vertices) continue
      
      // Upload vertex data
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW)
      
      // Setup attributes
      gl.enableVertexAttribArray(positionLocation)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0)
      
      gl.enableVertexAttribArray(texCoordLocation)
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8)
      
      // Set uniforms
      const matrix = this.createTransformMatrix(element)
      gl.uniformMatrix3fv(matrixLocation, false, matrix)
      
      // Set color and opacity
      const color = this.parseColor(element)
      gl.uniform4fv(colorLocation, color)
      gl.uniform1f(opacityLocation, 1.0)
      
      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 4)
      
      // Update stats
      this.renderStats.drawCalls++
      this.renderStats.vertices += vertices.length / 4
      this.renderStats.triangles += vertices.length / 12
    }
  }

  /**
   * Create vertex data for an element
   */
  private createVertices(element: CanvasElement): Float32Array | null {
    const { position, size } = element
    
    // Create quad vertices (2 triangles)
    // Each vertex has: x, y, u, v
    return new Float32Array([
      // Triangle 1
      position.x, position.y, 0, 0,
      position.x + size.width, position.y, 1, 0,
      position.x, position.y + size.height, 0, 1,
      
      // Triangle 2
      position.x + size.width, position.y, 1, 0,
      position.x + size.width, position.y + size.height, 1, 1,
      position.x, position.y + size.height, 0, 1
    ])
  }

  /**
   * Create transformation matrix for an element
   */
  private createTransformMatrix(element: CanvasElement): Float32Array {
    const { position, rotation = 0 } = element
    const { width, height } = this.canvas!
    
    // Convert to normalized device coordinates (-1 to 1)
    const scaleX = 2 / width
    const scaleY = -2 / height // Flip Y axis
    const translateX = -1
    const translateY = 1
    
    // Apply rotation if needed
    const cos = Math.cos(rotation * Math.PI / 180)
    const sin = Math.sin(rotation * Math.PI / 180)
    
    // Create 3x3 transformation matrix
    return new Float32Array([
      scaleX * cos, scaleX * sin, 0,
      scaleY * -sin, scaleY * cos, 0,
      translateX + position.x * scaleX, translateY + position.y * scaleY, 1
    ])
  }

  /**
   * Parse color from element style
   */
  private parseColor(element: CanvasElement): Float32Array {
    // Default color
    let r = 0, g = 0, b = 0, a = 1
    
    if ('style' in element && element.style) {
      const style = element.style as any
      const color = style.fill || style.stroke || '#000000'
      
      // Parse hex color
      if (typeof color === 'string' && color.startsWith('#')) {
        const hex = color.slice(1)
        r = parseInt(hex.substr(0, 2), 16) / 255
        g = parseInt(hex.substr(2, 2), 16) / 255
        b = parseInt(hex.substr(4, 2), 16) / 255
      }
      
      // Parse opacity
      if (style.opacity !== undefined) {
        a = style.opacity
      }
    }
    
    return new Float32Array([r, g, b, a])
  }

  /**
   * Start monitoring performance
   */
  private startPerformanceMonitoring(): void {
    const monitor = () => {
      const now = performance.now()
      
      if (this.lastFrameTime > 0) {
        const deltaTime = now - this.lastFrameTime
        const fps = 1000 / deltaTime
        
        // Smooth FPS calculation
        this.renderStats.fps = this.renderStats.fps * 0.9 + fps * 0.1
        
        this.frameCount++
      }
      
      this.lastFrameTime = now
      requestAnimationFrame(monitor)
    }
    
    requestAnimationFrame(monitor)
  }

  /**
   * Update performance statistics
   */
  private updatePerformanceStats(): void {
    if (!this.gl) return
    
    // Calculate texture memory usage
    this.renderStats.textureMemory = 0
    for (const texture of this.textureCache.values()) {
      // Estimate texture memory (width * height * 4 bytes for RGBA)
      // This is a rough estimate
      this.renderStats.textureMemory += 1024 * 1024 * 4 // Assume 1024x1024 textures
    }
  }

  /**
   * Set performance mode
   */
  setPerformanceMode(mode: 'auto' | 'performance' | 'quality'): void {
    this.performanceMode = mode
    
    if (!this.gl) return
    
    // Adjust WebGL settings based on mode
    const gl = this.gl
    
    switch (mode) {
      case 'performance':
        // Optimize for performance
        gl.hint(gl.GENERATE_MIPMAP_HINT, gl.FASTEST)
        if ('FRAGMENT_SHADER_DERIVATIVE_HINT' in gl) {
          gl.hint(gl.FRAGMENT_SHADER_DERIVATIVE_HINT, gl.FASTEST)
        }
        this.elementThreshold = 50
        break
        
      case 'quality':
        // Optimize for quality
        gl.hint(gl.GENERATE_MIPMAP_HINT, gl.NICEST)
        if ('FRAGMENT_SHADER_DERIVATIVE_HINT' in gl) {
          gl.hint(gl.FRAGMENT_SHADER_DERIVATIVE_HINT, gl.NICEST)
        }
        this.elementThreshold = 200
        break
        
      case 'auto':
      default:
        // Balanced settings
        gl.hint(gl.GENERATE_MIPMAP_HINT, gl.DONT_CARE)
        if ('FRAGMENT_SHADER_DERIVATIVE_HINT' in gl) {
          gl.hint(gl.FRAGMENT_SHADER_DERIVATIVE_HINT, gl.DONT_CARE)
        }
        this.elementThreshold = 100
        break
    }
  }

  /**
   * Get current render statistics
   */
  getStats(): RenderStats {
    return { ...this.renderStats }
  }

  /**
   * Resize WebGL canvas
   */
  resize(width: number, height: number): void {
    if (!this.gl || !this.canvas) return
    
    this.canvas.width = width
    this.canvas.height = height
    
    this.gl.viewport(0, 0, width, height)
  }

  /**
   * Clear all cached resources
   */
  clearCache(): void {
    if (!this.gl) return
    
    // Clear texture cache
    for (const texture of this.textureCache.values()) {
      this.gl.deleteTexture(texture)
    }
    this.textureCache.clear()
    
    // Clear vertex buffers
    for (const buffer of this.vertexBuffers.values()) {
      this.gl.deleteBuffer(buffer)
    }
    this.vertexBuffers.clear()
  }

  /**
   * Dispose of WebGL resources
   */
  dispose(): void {
    if (this.gl) {
      // Clear cache
      this.clearCache()
      
      // Delete shader programs
      for (const program of this.shaderPrograms.values()) {
        this.gl.deleteProgram(program)
      }
      this.shaderPrograms.clear()
      
      // Lose context
      const loseContext = this.gl.getExtension('WEBGL_lose_context')
      if (loseContext) {
        loseContext.loseContext()
      }
      
      this.gl = null
    }
    
    // Remove canvas
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }
    this.canvas = null
    
    this.fabricCanvas = null
  }
}