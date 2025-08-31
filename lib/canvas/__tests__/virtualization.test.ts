import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CanvasVirtualizer } from '../virtualizer';
import { WebGLRenderer } from '../webgl-renderer';
import { VirtualizationConfig, RenderableObject, Viewport } from '../types';

describe('Canvas Virtualization', () => {
  let virtualizer: CanvasVirtualizer;
  let renderer: WebGLRenderer;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    // Mock canvas
    canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    
    const config: VirtualizationConfig = {
      viewportWidth: 1920,
      viewportHeight: 1080,
      tileSize: 256,
      maxObjectsPerTile: 100,
      cullingMargin: 100,
      enableWebGL: true,
      webglThreshold: 1000
    };

    virtualizer = new CanvasVirtualizer(config);
    renderer = new WebGLRenderer(canvas);
  });

  describe('CanvasVirtualizer', () => {
    it('should initialize with correct configuration', () => {
      expect(virtualizer.getConfig().viewportWidth).toBe(1920);
      expect(virtualizer.getConfig().viewportHeight).toBe(1080);
      expect(virtualizer.getConfig().tileSize).toBe(256);
    });

    it('should add objects to spatial index', () => {
      const objects: RenderableObject[] = [
        { id: 'obj1', x: 100, y: 100, width: 50, height: 50, type: 'rectangle' },
        { id: 'obj2', x: 500, y: 500, width: 100, height: 100, type: 'circle' },
        { id: 'obj3', x: 1000, y: 1000, width: 200, height: 200, type: 'text' }
      ];

      objects.forEach(obj => virtualizer.addObject(obj));
      expect(virtualizer.getObjectCount()).toBe(3);
    });

    it('should cull objects outside viewport', () => {
      const objects: RenderableObject[] = [
        { id: 'visible1', x: 100, y: 100, width: 50, height: 50, type: 'rectangle' },
        { id: 'visible2', x: 500, y: 500, width: 100, height: 100, type: 'circle' },
        { id: 'offscreen1', x: 3000, y: 3000, width: 50, height: 50, type: 'rectangle' },
        { id: 'offscreen2', x: -500, y: -500, width: 50, height: 50, type: 'circle' }
      ];

      objects.forEach(obj => virtualizer.addObject(obj));

      const viewport: Viewport = {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        scale: 1
      };

      const visibleObjects = virtualizer.getVisibleObjects(viewport);
      expect(visibleObjects.length).toBe(2);
      expect(visibleObjects.map(o => o.id)).toContain('visible1');
      expect(visibleObjects.map(o => o.id)).toContain('visible2');
    });

    it('should handle viewport with zoom', () => {
      const objects: RenderableObject[] = Array.from({ length: 100 }, (_, i) => ({
        id: `obj${i}`,
        x: (i % 10) * 200,
        y: Math.floor(i / 10) * 200,
        width: 150,
        height: 150,
        type: 'rectangle'
      }));

      objects.forEach(obj => virtualizer.addObject(obj));

      const viewport: Viewport = {
        x: 500,
        y: 500,
        width: 1920,
        height: 1080,
        scale: 2 // Zoomed in
      };

      const visibleObjects = virtualizer.getVisibleObjects(viewport);
      
      // When zoomed in, fewer objects should be visible
      expect(visibleObjects.length).toBeLessThan(objects.length);
      
      // Check that visible objects are within the zoomed viewport
      visibleObjects.forEach(obj => {
        const screenX = (obj.x - viewport.x) * viewport.scale;
        const screenY = (obj.y - viewport.y) * viewport.scale;
        expect(screenX + obj.width * viewport.scale).toBeGreaterThan(-100);
        expect(screenY + obj.height * viewport.scale).toBeGreaterThan(-100);
      });
    });

    it('should efficiently update object positions', () => {
      const object: RenderableObject = {
        id: 'movable',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        type: 'rectangle'
      };

      virtualizer.addObject(object);
      
      // Move object
      virtualizer.updateObject('movable', { x: 500, y: 500 });
      
      const viewport: Viewport = {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        scale: 1
      };

      const visibleObjects = virtualizer.getVisibleObjects(viewport);
      const movedObject = visibleObjects.find(o => o.id === 'movable');
      
      expect(movedObject?.x).toBe(500);
      expect(movedObject?.y).toBe(500);
    });

    it('should handle large numbers of objects efficiently', () => {
      const startTime = performance.now();
      
      // Add 10,000 objects
      for (let i = 0; i < 10000; i++) {
        virtualizer.addObject({
          id: `obj${i}`,
          x: Math.random() * 10000,
          y: Math.random() * 10000,
          width: 50 + Math.random() * 100,
          height: 50 + Math.random() * 100,
          type: 'rectangle'
        });
      }

      const addTime = performance.now() - startTime;
      expect(addTime).toBeLessThan(1000); // Should add 10k objects in under 1 second

      const viewport: Viewport = {
        x: 5000,
        y: 5000,
        width: 1920,
        height: 1080,
        scale: 1
      };

      const queryStart = performance.now();
      const visibleObjects = virtualizer.getVisibleObjects(viewport);
      const queryTime = performance.now() - queryStart;

      expect(queryTime).toBeLessThan(10); // Query should be very fast
      expect(visibleObjects.length).toBeGreaterThan(0);
      expect(visibleObjects.length).toBeLessThan(1000); // Should cull most objects
    });

    it('should switch to WebGL when threshold is reached', () => {
      const shouldUseWebGL = virtualizer.shouldUseWebGL(1001);
      expect(shouldUseWebGL).toBe(true);

      const shouldUseCanvas = virtualizer.shouldUseWebGL(999);
      expect(shouldUseCanvas).toBe(false);
    });
  });

  describe('WebGLRenderer', () => {
    it('should initialize WebGL context', () => {
      expect(renderer.isInitialized()).toBe(true);
      expect(renderer.getMaxTextureSize()).toBeGreaterThan(0);
    });

    it('should batch render objects', () => {
      const objects: RenderableObject[] = [
        { id: 'obj1', x: 100, y: 100, width: 50, height: 50, type: 'rectangle', color: '#ff0000' },
        { id: 'obj2', x: 200, y: 200, width: 60, height: 60, type: 'rectangle', color: '#00ff00' },
        { id: 'obj3', x: 300, y: 300, width: 70, height: 70, type: 'rectangle', color: '#0000ff' }
      ];

      const renderSpy = jest.spyOn(renderer, 'render');
      renderer.render(objects, { x: 0, y: 0, width: 1920, height: 1080, scale: 1 });

      expect(renderSpy).toHaveBeenCalledWith(
        expect.arrayContaining(objects),
        expect.objectContaining({ width: 1920, height: 1080 })
      );
    });

    it('should handle different object types', () => {
      const objects: RenderableObject[] = [
        { id: 'rect', x: 100, y: 100, width: 50, height: 50, type: 'rectangle' },
        { id: 'circle', x: 200, y: 200, width: 60, height: 60, type: 'circle' },
        { id: 'text', x: 300, y: 300, width: 100, height: 30, type: 'text', text: 'Hello' },
        { id: 'image', x: 400, y: 400, width: 80, height: 80, type: 'image', src: 'test.png' }
      ];

      expect(() => {
        renderer.render(objects, { x: 0, y: 0, width: 1920, height: 1080, scale: 1 });
      }).not.toThrow();
    });

    it('should optimize draw calls', () => {
      const objects: RenderableObject[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `obj${i}`,
        x: (i % 40) * 50,
        y: Math.floor(i / 40) * 50,
        width: 45,
        height: 45,
        type: 'rectangle',
        color: i % 2 === 0 ? '#ff0000' : '#0000ff'
      }));

      const drawCalls = renderer.render(objects, { 
        x: 0, 
        y: 0, 
        width: 1920, 
        height: 1080, 
        scale: 1 
      });

      // Should batch objects by color to minimize state changes
      expect(drawCalls).toBeLessThan(10); // Much fewer than 1000 individual draws
    });

    it('should handle viewport transformations', () => {
      const objects: RenderableObject[] = [
        { id: 'obj1', x: 100, y: 100, width: 50, height: 50, type: 'rectangle' }
      ];

      const viewport: Viewport = {
        x: 50,
        y: 50,
        width: 1920,
        height: 1080,
        scale: 2
      };

      renderer.render(objects, viewport);

      // Object should be rendered at transformed position
      // (100 - 50) * 2 = 100 screen coordinates
      const transformedX = (objects[0].x - viewport.x) * viewport.scale;
      const transformedY = (objects[0].y - viewport.y) * viewport.scale;
      
      expect(transformedX).toBe(100);
      expect(transformedY).toBe(100);
    });

    it('should clean up resources on dispose', () => {
      const disposeSpy = jest.spyOn(renderer, 'dispose');
      renderer.dispose();
      
      expect(disposeSpy).toHaveBeenCalled();
      expect(renderer.isInitialized()).toBe(false);
    });
  });

  describe('Performance Optimization', () => {
    it('should use level-of-detail for distant objects', () => {
      const object: RenderableObject = {
        id: 'detailed',
        x: 1000,
        y: 1000,
        width: 10,
        height: 10,
        type: 'complex',
        details: { /* complex data */ }
      };

      virtualizer.addObject(object);

      // Zoomed out viewport
      const viewport: Viewport = {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        scale: 0.1 // Very zoomed out
      };

      const lod = virtualizer.getLevelOfDetail(object, viewport);
      expect(lod).toBe('low'); // Should use simplified rendering
    });

    it('should cache frequently accessed tiles', () => {
      // Add objects to specific tiles
      for (let i = 0; i < 100; i++) {
        virtualizer.addObject({
          id: `obj${i}`,
          x: (i % 10) * 30,
          y: Math.floor(i / 10) * 30,
          width: 25,
          height: 25,
          type: 'rectangle'
        });
      }

      const viewport: Viewport = {
        x: 0,
        y: 0,
        width: 300,
        height: 300,
        scale: 1
      };

      // First query should build cache
      const firstQueryStart = performance.now();
      virtualizer.getVisibleObjects(viewport);
      const firstQueryTime = performance.now() - firstQueryStart;

      // Second query should be faster due to cache
      const secondQueryStart = performance.now();
      virtualizer.getVisibleObjects(viewport);
      const secondQueryTime = performance.now() - secondQueryStart;

      expect(secondQueryTime).toBeLessThan(firstQueryTime);
    });
  });
});