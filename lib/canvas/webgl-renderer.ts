import * as THREE from 'three';

export interface CanvasObject {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: { x: number; y: number }[];
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  src?: string;
}

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface PerformanceStats {
  fps: number;
  objectCount: number;
  visibleObjectCount: number;
  memoryUsage: number;
  renderTime: number;
  drawCalls: number;
  instancedObjects: number;
  textureMemory: number;
}

type RenderMode = 'normal' | 'performance' | 'wireframe';
type LODLevel = 'high' | 'medium' | 'low';

export class WebGLRenderer {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private objects: Map<string, THREE.Object3D>;
  private objectData: Map<string, CanvasObject>;
  private viewport: Viewport;
  private renderMode: RenderMode = 'normal';
  private initialized = false;
  
  // Performance tracking
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private fps = 60;
  private renderTime = 0;
  private drawCalls = 0;
  private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map();
  
  // Optimization thresholds
  private readonly PERFORMANCE_MODE_THRESHOLD = 1000;
  private readonly CULLING_MARGIN = 100;
  private readonly LOD_SCALE_THRESHOLDS = {
    high: 0.8,
    medium: 0.4,
    low: 0
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.objects = new Map();
    this.objectData = new Map();
    this.viewport = {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
      scale: 1
    };
    
    this.initializeRenderer();
    this.initialized = true;
  }

  private initializeRenderer(): void {
    // Create Three.js renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.canvas.width, this.canvas.height);
    
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
    
    // Create orthographic camera for 2D rendering
    const aspect = this.canvas.width / this.canvas.height;
    this.camera = new THREE.OrthographicCamera(
      -this.canvas.width / 2,
      this.canvas.width / 2,
      this.canvas.height / 2,
      -this.canvas.height / 2,
      0.1,
      1000
    );
    this.camera.position.z = 10;
    
    // Enable renderer extensions for performance
    this.renderer.getContext().getExtension('ANGLE_instanced_arrays');
    this.renderer.getContext().getExtension('OES_element_index_uint');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getPerformanceStats(): PerformanceStats {
    return {
      fps: this.fps,
      objectCount: this.objects.size,
      visibleObjectCount: this.getVisibleObjectCount(),
      memoryUsage: this.calculateMemoryUsage(),
      renderTime: this.renderTime,
      drawCalls: this.drawCalls,
      instancedObjects: this.instancedMeshes.size,
      textureMemory: this.calculateTextureMemory()
    };
  }

  private calculateMemoryUsage(): number {
    // Estimate memory usage in MB
    const info = this.renderer.info;
    const geometries = info.memory.geometries;
    const textures = info.memory.textures;
    
    // Rough estimation: each geometry ~1KB, each texture ~4MB
    return (geometries * 0.001 + textures * 4);
  }

  private calculateTextureMemory(): number {
    const info = this.renderer.info;
    return info.memory.textures * 4; // Rough estimate: 4MB per texture
  }

  addObject(data: CanvasObject): void {
    const mesh = this.createMeshFromData(data);
    this.objects.set(data.id, mesh);
    this.objectData.set(data.id, data);
    this.scene.add(mesh);
    
    // Auto-switch to performance mode if needed
    if (this.objects.size > this.PERFORMANCE_MODE_THRESHOLD && this.renderMode === 'normal') {
      this.setRenderMode('performance');
    }
  }

  private createMeshFromData(data: CanvasObject): THREE.Object3D {
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;
    
    switch (data.type) {
      case 'rectangle':
        geometry = new THREE.PlaneGeometry(data.width || 100, data.height || 100);
        break;
      case 'circle':
        geometry = new THREE.CircleGeometry(data.radius || 50, 32);
        break;
      case 'polygon':
        if (data.points) {
          const shape = new THREE.Shape();
          data.points.forEach((point, index) => {
            if (index === 0) {
              shape.moveTo(point.x, point.y);
            } else {
              shape.lineTo(point.x, point.y);
            }
          });
          geometry = new THREE.ShapeGeometry(shape);
        } else {
          geometry = new THREE.PlaneGeometry(100, 100);
        }
        break;
      case 'image':
        geometry = new THREE.PlaneGeometry(data.width || 100, data.height || 100);
        // For images, we'd load texture here
        break;
      default:
        geometry = new THREE.PlaneGeometry(100, 100);
    }
    
    // Create material based on render mode
    const color = new THREE.Color(data.fill || '#808080');
    
    if (this.renderMode === 'wireframe') {
      material = new THREE.MeshBasicMaterial({
        color,
        wireframe: true
      });
    } else if (this.renderMode === 'performance') {
      material = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide
      });
    } else {
      material = new THREE.MeshStandardMaterial({
        color,
        side: THREE.DoubleSide,
        metalness: 0,
        roughness: 1
      });
    }
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(data.x, data.y, 0);
    mesh.userData = { id: data.id };
    
    return mesh;
  }

  removeObject(id: string): void {
    const mesh = this.objects.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      
      // Dispose of geometry and material
      if (mesh instanceof THREE.Mesh) {
        mesh.geometry.dispose();
        if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose();
        }
      }
      
      this.objects.delete(id);
      this.objectData.delete(id);
    }
  }

  updateObject(id: string, updates: Partial<CanvasObject>): void {
    const mesh = this.objects.get(id);
    const data = this.objectData.get(id);
    
    if (mesh && data) {
      // Update data
      Object.assign(data, updates);
      
      // Update mesh position
      if (updates.x !== undefined || updates.y !== undefined) {
        mesh.position.set(
          updates.x ?? data.x,
          updates.y ?? data.y,
          0
        );
      }
      
      // Update other properties as needed
      if (updates.fill && mesh instanceof THREE.Mesh) {
        const material = mesh.material as THREE.MeshBasicMaterial;
        material.color = new THREE.Color(updates.fill);
      }
    }
  }

  getObject(id: string): CanvasObject | undefined {
    return this.objectData.get(id);
  }

  batchAdd(objects: CanvasObject[]): void {
    objects.forEach(obj => this.addObject(obj));
    
    // Optimize after batch operation
    this.optimizeScene();
  }

  private optimizeScene(): void {
    // Group similar objects for instancing
    const typeGroups = new Map<string, CanvasObject[]>();
    
    this.objectData.forEach(data => {
      const key = `${data.type}-${data.width}-${data.height}-${data.radius}`;
      if (!typeGroups.has(key)) {
        typeGroups.set(key, []);
      }
      typeGroups.get(key)!.push(data);
    });
    
    // Create instanced meshes for large groups
    typeGroups.forEach((group, key) => {
      if (group.length > 50) {
        this.createInstancedMesh(group, key);
      }
    });
  }

  private createInstancedMesh(objects: CanvasObject[], key: string): void {
    // Implementation for instanced rendering
    // This would create a single mesh with multiple instances
    // for better performance
  }

  setViewport(viewport: Viewport): void {
    this.viewport = viewport;
    
    // Update camera based on viewport
    this.camera.left = viewport.x - viewport.width / 2;
    this.camera.right = viewport.x + viewport.width / 2;
    this.camera.top = viewport.y + viewport.height / 2;
    this.camera.bottom = viewport.y - viewport.height / 2;
    this.camera.zoom = viewport.scale;
    this.camera.updateProjectionMatrix();
  }

  getVisibleObjectCount(): number {
    let count = 0;
    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4().multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(matrix);
    
    this.objects.forEach(obj => {
      if (frustum.intersectsObject(obj)) {
        count++;
      }
    });
    
    return count;
  }

  getLODLevel(id: string): LODLevel {
    const scale = this.viewport.scale;
    
    if (scale >= this.LOD_SCALE_THRESHOLDS.high) {
      return 'high';
    } else if (scale >= this.LOD_SCALE_THRESHOLDS.medium) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  setRenderMode(mode: RenderMode): void {
    this.renderMode = mode;
    
    // Update all materials based on new mode
    this.objects.forEach(obj => {
      if (obj instanceof THREE.Mesh) {
        const data = this.objectData.get(obj.userData.id);
        if (data) {
          const color = new THREE.Color(data.fill || '#808080');
          
          if (mode === 'wireframe') {
            obj.material = new THREE.MeshBasicMaterial({
              color,
              wireframe: true
            });
          } else if (mode === 'performance') {
            obj.material = new THREE.MeshBasicMaterial({
              color,
              side: THREE.DoubleSide
            });
          } else {
            obj.material = new THREE.MeshStandardMaterial({
              color,
              side: THREE.DoubleSide,
              metalness: 0,
              roughness: 1
            });
          }
        }
      }
    });
  }

  getRenderMode(): RenderMode {
    return this.renderMode;
  }

  pickObject(x: number, y: number): string | null {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Convert to normalized device coordinates
    mouse.x = (x / this.canvas.width) * 2 - 1;
    mouse.y = -(y / this.canvas.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, this.camera);
    
    const intersects = raycaster.intersectObjects(Array.from(this.objects.values()));
    
    if (intersects.length > 0) {
      return intersects[0].object.userData.id;
    }
    
    return null;
  }

  selectObjectsInRegion(x1: number, y1: number, x2: number, y2: number): string[] {
    const selected: string[] = [];
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    
    this.objectData.forEach((data, id) => {
      if (data.x >= minX && data.x <= maxX && data.y >= minY && data.y <= maxY) {
        selected.push(id);
      }
    });
    
    return selected;
  }

  render(): void {
    const startTime = performance.now();
    
    // Update FPS
    this.frameCount++;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    
    if (deltaTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / deltaTime);
      this.frameCount = 0;
      this.lastFrameTime = currentTime;
    }
    
    // Perform culling
    this.performViewportCulling();
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
    
    // Update stats
    this.renderTime = performance.now() - startTime;
    this.drawCalls = this.renderer.info.render.calls;
  }

  private performViewportCulling(): void {
    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4().multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(matrix);
    
    this.objects.forEach(obj => {
      obj.visible = frustum.intersectsObject(obj);
    });
  }

  getMaxTextureSize(): number {
    const gl = this.renderer.getContext();
    return gl.getParameter(gl.MAX_TEXTURE_SIZE);
  }

  dispose(): void {
    // Clean up all objects
    this.objects.forEach(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (obj.material instanceof THREE.Material) {
          obj.material.dispose();
        }
      }
    });
    
    this.objects.clear();
    this.objectData.clear();
    this.instancedMeshes.clear();
    
    // Dispose renderer
    this.renderer.dispose();
    this.initialized = false;
  }
}