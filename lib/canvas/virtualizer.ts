import {
  VirtualizationConfig,
  Viewport,
  RenderableObject,
  Tile,
  SpatialIndex,
  LevelOfDetail,
  RenderStats
} from './types';

export class CanvasVirtualizer {
  private config: VirtualizationConfig;
  private spatialIndex: SpatialIndex;
  private tileCache: Map<string, RenderableObject[]>;
  private lastViewport: Viewport | null = null;
  private stats: RenderStats;

  constructor(config: VirtualizationConfig) {
    this.config = {
      ...config,
      lodThresholds: config.lodThresholds || {
        high: 1.0,
        medium: 0.5,
        low: 0.25
      }
    };

    this.spatialIndex = {
      tiles: new Map(),
      objects: new Map(),
      tileSize: config.tileSize
    };

    this.tileCache = new Map();
    this.stats = {
      objectsRendered: 0,
      objectsCulled: 0,
      drawCalls: 0,
      frameTime: 0,
      fps: 0
    };
  }

  getConfig(): VirtualizationConfig {
    return { ...this.config };
  }

  addObject(object: RenderableObject): void {
    this.spatialIndex.objects.set(object.id, object);
    this.updateObjectTiles(object);
    this.invalidateCache();
  }

  updateObject(id: string, updates: Partial<RenderableObject>): void {
    const object = this.spatialIndex.objects.get(id);
    if (!object) return;

    // Remove from old tiles
    this.removeObjectFromTiles(object);

    // Update object
    Object.assign(object, updates);

    // Add to new tiles
    this.updateObjectTiles(object);
    this.invalidateCache();
  }

  removeObject(id: string): void {
    const object = this.spatialIndex.objects.get(id);
    if (!object) return;

    this.removeObjectFromTiles(object);
    this.spatialIndex.objects.delete(id);
    this.invalidateCache();
  }

  getObjectCount(): number {
    return this.spatialIndex.objects.size;
  }

  getVisibleObjects(viewport: Viewport): RenderableObject[] {
    const startTime = performance.now();
    
    // Check cache
    if (this.isCacheValid(viewport)) {
      const cached = this.getCachedObjects(viewport);
      if (cached) {
        this.updateStats(cached.length, startTime);
        return cached;
      }
    }

    // Calculate visible tile range
    const visibleTiles = this.getVisibleTiles(viewport);
    const visibleObjects = new Map<string, RenderableObject>();

    // Collect objects from visible tiles
    for (const tileId of visibleTiles) {
      const tile = this.spatialIndex.tiles.get(tileId);
      if (!tile) continue;

      for (const objectId of Array.from(tile.objects)) {
        const object = this.spatialIndex.objects.get(objectId);
        if (object && this.isObjectVisible(object, viewport)) {
          visibleObjects.set(objectId, object);
        }
      }
    }

    const result = Array.from(visibleObjects.values());
    
    // Sort by z-index
    result.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // Cache result
    this.cacheObjects(viewport, result);
    this.lastViewport = viewport;

    this.updateStats(result.length, startTime);
    return result;
  }

  shouldUseWebGL(objectCount: number): boolean {
    return this.config.enableWebGL && objectCount >= this.config.webglThreshold;
  }

  getLevelOfDetail(object: RenderableObject, viewport: Viewport): LevelOfDetail {
    const objectScreenSize = Math.max(
      object.width * viewport.scale,
      object.height * viewport.scale
    );

    const thresholds = this.config.lodThresholds!;
    
    if (objectScreenSize >= thresholds.high * 100) {
      return 'high';
    } else if (objectScreenSize >= thresholds.medium * 100) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  getStats(): RenderStats {
    return { ...this.stats };
  }

  private updateObjectTiles(object: RenderableObject): void {
    const tiles = this.getObjectTiles(object);
    
    for (const tileId of tiles) {
      let tile = this.spatialIndex.tiles.get(tileId);
      
      if (!tile) {
        const [x, y] = tileId.split(',').map(Number);
        tile = {
          id: tileId,
          x: x * this.config.tileSize,
          y: y * this.config.tileSize,
          width: this.config.tileSize,
          height: this.config.tileSize,
          objects: new Set(),
          isDirty: true
        };
        this.spatialIndex.tiles.set(tileId, tile);
      }

      tile.objects.add(object.id);
      tile.isDirty = true;
    }
  }

  private removeObjectFromTiles(object: RenderableObject): void {
    const tiles = this.getObjectTiles(object);
    
    for (const tileId of tiles) {
      const tile = this.spatialIndex.tiles.get(tileId);
      if (tile) {
        tile.objects.delete(object.id);
        tile.isDirty = true;
        
        // Remove empty tiles
        if (tile.objects.size === 0) {
          this.spatialIndex.tiles.delete(tileId);
        }
      }
    }
  }

  private getObjectTiles(object: RenderableObject): string[] {
    const tileSize = this.config.tileSize;
    const tiles: string[] = [];

    const startX = Math.floor(object.x / tileSize);
    const startY = Math.floor(object.y / tileSize);
    const endX = Math.floor((object.x + object.width) / tileSize);
    const endY = Math.floor((object.y + object.height) / tileSize);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        tiles.push(`${x},${y}`);
      }
    }

    return tiles;
  }

  private getVisibleTiles(viewport: Viewport): string[] {
    const tileSize = this.config.tileSize;
    const margin = this.config.cullingMargin;
    const tiles: string[] = [];

    // Calculate world-space viewport bounds
    const worldLeft = viewport.x - margin / viewport.scale;
    const worldTop = viewport.y - margin / viewport.scale;
    const worldRight = viewport.x + (viewport.width + margin) / viewport.scale;
    const worldBottom = viewport.y + (viewport.height + margin) / viewport.scale;

    const startX = Math.floor(worldLeft / tileSize);
    const startY = Math.floor(worldTop / tileSize);
    const endX = Math.ceil(worldRight / tileSize);
    const endY = Math.ceil(worldBottom / tileSize);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        tiles.push(`${x},${y}`);
      }
    }

    return tiles;
  }

  private isObjectVisible(object: RenderableObject, viewport: Viewport): boolean {
    const margin = this.config.cullingMargin;
    
    // Calculate world-space viewport bounds
    const worldLeft = viewport.x - margin / viewport.scale;
    const worldTop = viewport.y - margin / viewport.scale;
    const worldRight = viewport.x + (viewport.width + margin) / viewport.scale;
    const worldBottom = viewport.y + (viewport.height + margin) / viewport.scale;

    // Check if object intersects viewport
    return !(
      object.x + object.width < worldLeft ||
      object.x > worldRight ||
      object.y + object.height < worldTop ||
      object.y > worldBottom
    );
  }

  private isCacheValid(viewport: Viewport): boolean {
    if (!this.lastViewport) return false;

    // Check if viewport hasn't changed significantly
    const threshold = 10; // pixels
    return (
      Math.abs(viewport.x - this.lastViewport.x) < threshold &&
      Math.abs(viewport.y - this.lastViewport.y) < threshold &&
      viewport.scale === this.lastViewport.scale &&
      viewport.width === this.lastViewport.width &&
      viewport.height === this.lastViewport.height
    );
  }

  private getCachedObjects(viewport: Viewport): RenderableObject[] | null {
    const key = this.getViewportKey(viewport);
    return this.tileCache.get(key) || null;
  }

  private cacheObjects(viewport: Viewport, objects: RenderableObject[]): void {
    const key = this.getViewportKey(viewport);
    this.tileCache.set(key, objects);

    // Limit cache size
    if (this.tileCache.size > 100) {
      const firstKey = this.tileCache.keys().next().value;
      if (firstKey) {
        this.tileCache.delete(firstKey);
      }
    }
  }

  private getViewportKey(viewport: Viewport): string {
    const precision = 10;
    const x = Math.round(viewport.x / precision) * precision;
    const y = Math.round(viewport.y / precision) * precision;
    return `${x},${y},${viewport.scale}`;
  }

  private invalidateCache(): void {
    this.tileCache.clear();
  }

  private updateStats(objectsRendered: number, startTime: number): void {
    const frameTime = performance.now() - startTime;
    
    this.stats = {
      objectsRendered,
      objectsCulled: this.spatialIndex.objects.size - objectsRendered,
      drawCalls: Math.ceil(objectsRendered / 100), // Estimate based on batching
      frameTime,
      fps: frameTime > 0 ? 1000 / frameTime : 60
    };
  }
}