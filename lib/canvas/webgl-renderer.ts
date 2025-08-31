import { RenderableObject, Viewport, WebGLResources } from './types';

export class WebGLRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null = null;
  private resources: WebGLResources;
  private initialized: boolean = false;
  private maxTextureSize: number = 0;
  private vertexData: Float32Array | null = null;
  private indexData: Uint16Array | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.resources = {
      program: null,
      vertexBuffer: null,
      indexBuffer: null,
      textureAtlas: null,
      uniformLocations: new Map()
    };

    this.initialize();
  }

  private initialize(): void {
    try {
      this.gl = this.canvas.getContext('webgl2', {
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance'
      });

      if (!this.gl) {
        console.warn('WebGL2 not available, falling back to canvas rendering');
        return;
      }

      this.maxTextureSize = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
      this.setupShaders();
      this.setupBuffers();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize WebGL:', error);
      this.initialized = false;
    }
  }

  private setupShaders(): void {
    if (!this.gl) return;

    const vertexShaderSource = `#version 300 es
      precision highp float;
      
      in vec2 a_position;
      in vec2 a_texCoord;
      in vec4 a_color;
      
      uniform mat3 u_matrix;
      uniform vec2 u_resolution;
      
      out vec2 v_texCoord;
      out vec4 v_color;
      
      void main() {
        vec3 position = u_matrix * vec3(a_position, 1.0);
        vec2 clipSpace = ((position.xy / u_resolution) * 2.0) - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        
        v_texCoord = a_texCoord;
        v_color = a_color;
      }
    `;

    const fragmentShaderSource = `#version 300 es
      precision highp float;
      
      in vec2 v_texCoord;
      in vec4 v_color;
      
      uniform sampler2D u_texture;
      uniform bool u_useTexture;
      
      out vec4 fragColor;
      
      void main() {
        if (u_useTexture) {
          fragColor = texture(u_texture, v_texCoord) * v_color;
        } else {
          fragColor = v_color;
        }
      }
    `;

    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    const program = this.gl.createProgram();
    if (!program) return;

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Failed to link shader program');
      return;
    }

    this.resources.program = program;

    // Store uniform locations
    const uniforms = ['u_matrix', 'u_resolution', 'u_texture', 'u_useTexture'];
    uniforms.forEach(name => {
      const location = this.gl!.getUniformLocation(program, name);
      if (location) {
        this.resources.uniformLocations.set(name, location);
      }
    });
  }

  private createShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private setupBuffers(): void {
    if (!this.gl) return;

    this.resources.vertexBuffer = this.gl.createBuffer();
    this.resources.indexBuffer = this.gl.createBuffer();

    // Pre-allocate buffers for batch rendering
    const maxVertices = 10000 * 4; // Support up to 10k rectangles
    this.vertexData = new Float32Array(maxVertices * 8); // 8 floats per vertex
    this.indexData = new Uint16Array(10000 * 6); // 6 indices per rectangle
  }

  render(objects: RenderableObject[], viewport: Viewport): number {
    if (!this.initialized || !this.gl || !this.resources.program) {
      return 0;
    }

    const gl = this.gl;
    
    // Clear canvas
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Use shader program
    gl.useProgram(this.resources.program);

    // Set uniforms
    const resolutionLoc = this.resources.uniformLocations.get('u_resolution');
    if (resolutionLoc) {
      gl.uniform2f(resolutionLoc, this.canvas.width, this.canvas.height);
    }

    // Create transformation matrix
    const matrix = this.createTransformMatrix(viewport);
    const matrixLoc = this.resources.uniformLocations.get('u_matrix');
    if (matrixLoc) {
      gl.uniformMatrix3fv(matrixLoc, false, matrix);
    }

    // Batch objects by type and color
    const batches = this.batchObjects(objects);
    let drawCalls = 0;

    // Render each batch
    for (const batch of batches) {
      this.renderBatch(batch, viewport);
      drawCalls++;
    }

    return drawCalls;
  }

  private batchObjects(objects: RenderableObject[]): RenderableObject[][] {
    const batches = new Map<string, RenderableObject[]>();

    objects.forEach(obj => {
      const key = `${obj.type}-${obj.color || 'default'}`;
      if (!batches.has(key)) {
        batches.set(key, []);
      }
      batches.get(key)!.push(obj);
    });

    return Array.from(batches.values());
  }

  private renderBatch(objects: RenderableObject[], viewport: Viewport): void {
    if (!this.gl || !this.vertexData || !this.indexData) return;

    const gl = this.gl;
    let vertexOffset = 0;
    let indexOffset = 0;

    // Build vertex data for batch
    objects.forEach((obj, i) => {
      const color = this.parseColor(obj.color || '#ffffff');
      
      // Transform coordinates
      const x = obj.x;
      const y = obj.y;
      const w = obj.width;
      const h = obj.height;

      // Add 4 vertices for rectangle
      const vertices = [
        x, y, 0, 0, ...color,
        x + w, y, 1, 0, ...color,
        x + w, y + h, 1, 1, ...color,
        x, y + h, 0, 1, ...color
      ];

      this.vertexData!.set(vertices, vertexOffset);
      vertexOffset += vertices.length;

      // Add 6 indices for 2 triangles
      const baseIndex = i * 4;
      const indices = [
        baseIndex, baseIndex + 1, baseIndex + 2,
        baseIndex, baseIndex + 2, baseIndex + 3
      ];

      this.indexData!.set(indices, indexOffset);
      indexOffset += 6;
    });

    // Upload vertex data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.resources.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertexData.subarray(0, vertexOffset), gl.DYNAMIC_DRAW);

    // Upload index data
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.resources.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indexData.subarray(0, indexOffset), gl.DYNAMIC_DRAW);

    // Setup attributes
    const program = this.resources.program!;
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const texCoordLoc = gl.getAttribLocation(program, 'a_texCoord');
    const colorLoc = gl.getAttribLocation(program, 'a_color');

    const stride = 8 * 4; // 8 floats per vertex, 4 bytes per float

    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, stride, 0);

    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, stride, 2 * 4);

    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, stride, 4 * 4);

    // Disable texture for solid colors
    const useTextureLoc = this.resources.uniformLocations.get('u_useTexture');
    if (useTextureLoc) {
      gl.uniform1i(useTextureLoc, 0);
    }

    // Enable blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Draw
    gl.drawElements(gl.TRIANGLES, indexOffset, gl.UNSIGNED_SHORT, 0);
  }

  private createTransformMatrix(viewport: Viewport): Float32Array {
    const matrix = new Float32Array(9);
    
    // Translation
    const tx = -viewport.x * viewport.scale;
    const ty = -viewport.y * viewport.scale;
    
    // Scale
    const sx = viewport.scale;
    const sy = viewport.scale;
    
    // Build matrix (column-major order for WebGL)
    matrix[0] = sx;  matrix[3] = 0;   matrix[6] = tx;
    matrix[1] = 0;   matrix[4] = sy;  matrix[7] = ty;
    matrix[2] = 0;   matrix[5] = 0;   matrix[8] = 1;
    
    return matrix;
  }

  private parseColor(color: string): number[] {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      return [r, g, b, 1];
    }
    return [1, 1, 1, 1]; // Default white
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getMaxTextureSize(): number {
    return this.maxTextureSize;
  }

  dispose(): void {
    if (!this.gl) return;

    // Clean up WebGL resources
    if (this.resources.program) {
      this.gl.deleteProgram(this.resources.program);
    }
    if (this.resources.vertexBuffer) {
      this.gl.deleteBuffer(this.resources.vertexBuffer);
    }
    if (this.resources.indexBuffer) {
      this.gl.deleteBuffer(this.resources.indexBuffer);
    }
    if (this.resources.textureAtlas) {
      this.gl.deleteTexture(this.resources.textureAtlas);
    }

    this.resources = {
      program: null,
      vertexBuffer: null,
      indexBuffer: null,
      textureAtlas: null,
      uniformLocations: new Map()
    };

    this.initialized = false;
  }
}