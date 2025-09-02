import { WebGLRenderer } from './webgl-renderer';
import * as THREE from 'three';

// Mock THREE.js
jest.mock('three');

describe('WebGLRenderer', () => {
  let renderer: WebGLRenderer;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    // Create mock canvas
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;
    
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (renderer) {
      renderer.dispose();
    }
  });

  describe('initialization', () => {
    it('should initialize with canvas element', () => {
      renderer = new WebGLRenderer(mockCanvas);
      expect(renderer).toBeDefined();
      expect(renderer.isInitialized()).toBe(true);
    });

    it('should create THREE.js renderer with correct options', () => {
      renderer = new WebGLRenderer(mockCanvas);
      
      expect(THREE.WebGLRenderer).toHaveBeenCalledWith({
        canvas: mockCanvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance'
      });
    });

    it('should set up scene, camera, and renderer', () => {
      renderer = new WebGLRenderer(mockCanvas);
      
      expect(THREE.Scene).toHaveBeenCalled();
      expect(THREE.OrthographicCamera).toHaveBeenCalled();
    });
  });

  describe('performance monitoring', () => {
    it('should track FPS', () => {
      renderer = new WebGLRenderer(mockCanvas);
      const stats = renderer.getPerformanceStats();
      
      expect(stats).toHaveProperty('fps');
      expect(stats.fps).toBeGreaterThanOrEqual(0);
      expect(stats.fps).toBeLessThanOrEqual(60);
    });

    it('should track object count', () => {
      renderer = new WebGLRenderer(mockCanvas);
      const stats = renderer.getPerformanceStats();
      
      expect(stats).toHaveProperty('objectCount');
      expect(stats.objectCount).toBe(0);
    });

    it('should track memory usage', () => {
      renderer = new WebGLRenderer(mockCanvas);
      const stats = renderer.getPerformanceStats();
      
      expect(stats).toHaveProperty('memoryUsage');
      expect(stats.memoryUsage).toBeGreaterThanOrEqual(0);
    });

    it('should track render time', () => {
      renderer = new WebGLRenderer(mockCanvas);
      const stats = renderer.getPerformanceStats();
      
      expect(stats).toHaveProperty('renderTime');
      expect(stats.renderTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('object management', () => {
    it('should add objects to scene', () => {
      renderer = new WebGLRenderer(mockCanvas);
      
      const objectData = {
        id: 'rect-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#FF0000',
        stroke: '#000000',
        strokeWidth: 2
      };
      
      renderer.addObject(objectData);
      const stats = renderer.getPerformanceStats();
      expect(stats.objectCount).toBe(1);
    });

    it('should remove objects from scene', () => {
      renderer = new WebGLRenderer(mockCanvas);
      
      const objectData = {
        id: 'rect-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#FF0000'
      };
      
      renderer.addObject(objectData);
      renderer.removeObject('rect-1');
      
      const stats = renderer.getPerformanceStats();
      expect(stats.objectCount).toBe(0);
    });

    it('should update object properties', () => {
      renderer = new WebGLRenderer(mockCanvas);
      
      const objectData = {
        id: 'rect-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#FF0000'
      };
      
      renderer.addObject(objectData);
      renderer.updateObject('rect-1', { x: 200, y: 200 });
      
      const object = renderer.getObject('rect-1');
      expect(object?.x).toBe(200);
      expect(object?.y).toBe(200);
    });

    it('should handle batch operations efficiently', () => {
      renderer = new WebGLRenderer(mockCanvas);
      
      const objects = Array.from({ length: 100 }, (_, i) => ({
        id: `rect-${i}`,
        type: 'rectangle',
        x: i * 10,
        y: i * 10,
        width: 50,
        height: 50,
        fill: '#FF0000'
      }));
      
      renderer.batchAdd(objects);
      
      const stats = renderer.getPerformanceStats();
      expect(stats.objectCount).toBe(100);
    });
  });

  describe('viewport and culling', () => {
    it('should implement viewport culling', () => {
      renderer = new WebGLRenderer(mockCanvas);
      renderer.setViewport({ x: 0, y: 0, width: 800, height: 600, scale: 1 });
      
      // Add object outside viewport
      const objectData = {
        id: 'rect-1',
        type: 'rectangle',
        x: 2000,
        y: 2000,
        width: 100,
        height: 100,
        fill: '#FF0000'
      };
      
      renderer.addObject(objectData);
      const visibleCount = renderer.getVisibleObjectCount();
      expect(visibleCount).toBe(0);
    });

    it('should update visible objects when viewport changes', () => {
      renderer = new WebGLRenderer(mockCanvas);
      
      const objectData = {
        id: 'rect-1',
        type: 'rectangle',
        x: 1000,
        y: 1000,
        width: 100,
        height: 100,
        fill: '#FF0000'
      };
      
      renderer.addObject(objectData);
      renderer.setViewport({ x: 0, y: 0, width: 800, height: 600, scale: 1 });
      expect(renderer.getVisibleObjectCount()).toBe(0);
      
      renderer.setViewport({ x: 950, y: 950, width: 800, height: 600, scale: 1 });
      expect(renderer.getVisibleObjectCount()).toBe(1);
    });

    it('should implement level-of-detail (LOD) rendering', () => {
      renderer = new WebGLRenderer(mockCanvas);
      
      const objectData = {
        id: 'complex-shape',
        type: 'polygon',
        points: Array.from({ length: 100 }, () => ({ x: Math.random() * 100, y: Math.random() * 100 })),
        fill: '#FF0000'
      };
      
      renderer.addObject(objectData);
      
      // At high zoom, should use full detail
      renderer.setViewport({ x: 0, y: 0, width: 800, height: 600, scale: 2 });
      expect(renderer.getLODLevel('complex-shape')).toBe('high');
      
      // At low zoom, should use simplified version
      renderer.setViewport({ x: 0, y: 0, width: 800, height: 600, scale: 0.1 });
      expect(renderer.getLODLevel('complex-shape')).toBe('low');
    });
  });

  describe('render modes', () => {
    it('should support normal rendering mode', () => {
      renderer = new WebGLRenderer(mockCanvas);
      renderer.setRenderMode('normal');
      expect(renderer.getRenderMode()).toBe('normal');
    });

    it('should support performance mode for many objects', () => {
      renderer = new WebGLRenderer(mockCanvas);
      
      // Add many objects
      const objects = Array.from({ length: 2000 }, (_, i) => ({
        id: `rect-${i}`,
        type: 'rectangle',
        x: (i % 50) * 20,
        y: Math.floor(i / 50) * 20,
        width: 15,
        height: 15,
        fill: '#FF0000'
      }));
      
      renderer.batchAdd(objects);
      
      // Should automatically switch to performance mode
      expect(renderer.getRenderMode()).toBe('performance');
    });

    it('should support wireframe mode', () => {
      renderer = new WebGLRenderer(mockCanvas);
      renderer.setRenderMode('wireframe');
      expect(renderer.getRenderMode()).toBe('wireframe');
    });
  });

  describe('interaction', () => {
    it('should handle object picking', () => {
      renderer = new WebGLRenderer(mockCanvas);
      
      const objectData = {
        id: 'rect-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#FF0000'
      };
      
      renderer.addObject(objectData);
      
      const picked = renderer.pickObject(150, 150);
      expect(picked).toBe('rect-1');
    });

    it('should handle multiple object selection', () => {
      renderer = new WebGLRenderer(mockCanvas);
      
      const objects = [
        { id: 'rect-1', type: 'rectangle', x: 100, y: 100, width: 50, height: 50, fill: '#FF0000' },
        { id: 'rect-2', type: 'rectangle', x: 200, y: 100, width: 50, height: 50, fill: '#00FF00' },
        { id: 'rect-3', type: 'rectangle', x: 300, y: 100, width: 50, height: 50, fill: '#0000FF' }
      ];
      
      objects.forEach(obj => renderer.addObject(obj));
      
      const selected = renderer.selectObjectsInRegion(50, 50, 250, 150);
      expect(selected).toContain('rect-1');
      expect(selected).toContain('rect-2');
      expect(selected).not.toContain('rect-3');
    });
  });

  describe('optimization', () => {
    it('should batch draw calls', () => {
      renderer = new WebGLRenderer(mockCanvas);
      
      const startStats = renderer.getPerformanceStats();
      const initialDrawCalls = startStats.drawCalls || 0;
      
      // Add many similar objects
      const objects = Array.from({ length: 100 }, (_, i) => ({
        id: `rect-${i}`,
        type: 'rectangle',
        x: i * 10,
        y: 0,
        width: 8,
        height: 8,
        fill: '#FF0000'
      }));
      
      renderer.batchAdd(objects);
      renderer.render();
      
      const endStats = renderer.getPerformanceStats();
      const drawCalls = endStats.drawCalls || 0;
      
      // Should batch similar objects to reduce draw calls
      expect(drawCalls - initialDrawCalls).toBeLessThan(100);
    });

    it('should use instancing for repeated shapes', () => {
      renderer = new WebGLRenderer(mockCanvas);
      
      // Add many identical shapes
      const objects = Array.from({ length: 1000 }, (_, i) => ({
        id: `circle-${i}`,
        type: 'circle',
        x: (i % 30) * 20,
        y: Math.floor(i / 30) * 20,
        radius: 8,
        fill: '#FF0000'
      }));
      
      renderer.batchAdd(objects);
      
      const stats = renderer.getPerformanceStats();
      expect(stats.instancedObjects).toBeGreaterThan(0);
    });

    it('should maintain 60fps with 2000+ objects', () => {
      renderer = new WebGLRenderer(mockCanvas);
      
      // Add 2000+ objects
      const objects = Array.from({ length: 2500 }, (_, i) => ({
        id: `obj-${i}`,
        type: i % 2 === 0 ? 'rectangle' : 'circle',
        x: (i % 50) * 15,
        y: Math.floor(i / 50) * 15,
        width: 10,
        height: 10,
        radius: 5,
        fill: `#${Math.floor(Math.random() * 16777215).toString(16)}`
      }));
      
      renderer.batchAdd(objects);
      
      // Simulate rendering frames
      const frameCount = 60;
      const startTime = performance.now();
      
      for (let i = 0; i < frameCount; i++) {
        renderer.render();
      }
      
      const endTime = performance.now();
      const avgFrameTime = (endTime - startTime) / frameCount;
      const fps = 1000 / avgFrameTime;
      
      expect(fps).toBeGreaterThanOrEqual(59); // Allow slight variance
    });
  });

  describe('memory management', () => {
    it('should dispose of resources properly', () => {
      renderer = new WebGLRenderer(mockCanvas);
      
      // Add and remove many objects
      for (let i = 0; i < 100; i++) {
        renderer.addObject({
          id: `temp-${i}`,
          type: 'rectangle',
          x: i * 10,
          y: 0,
          width: 8,
          height: 8,
          fill: '#FF0000'
        });
      }
      
      for (let i = 0; i < 100; i++) {
        renderer.removeObject(`temp-${i}`);
      }
      
      const stats = renderer.getPerformanceStats();
      expect(stats.objectCount).toBe(0);
      expect(stats.memoryUsage).toBeLessThan(100); // MB
    });

    it('should handle texture memory efficiently', () => {
      renderer = new WebGLRenderer(mockCanvas);
      
      // Add objects with textures
      const objects = Array.from({ length: 50 }, (_, i) => ({
        id: `image-${i}`,
        type: 'image',
        x: i * 50,
        y: 0,
        width: 40,
        height: 40,
        src: `data:image/png;base64,${btoa('test-image-data')}`
      }));
      
      renderer.batchAdd(objects);
      
      const stats = renderer.getPerformanceStats();
      expect(stats.textureMemory).toBeDefined();
      expect(stats.textureMemory).toBeLessThan(500); // MB
    });
  });
});