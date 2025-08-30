export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface RenderableObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'rectangle' | 'circle' | 'text' | 'image' | 'path' | 'complex';
  color?: string;
  text?: string;
  src?: string;
  path?: string;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  details?: any;
}

export interface VirtualizationConfig {
  viewportWidth: number;
  viewportHeight: number;
  tileSize: number;
  maxObjectsPerTile: number;
  cullingMargin: number;
  enableWebGL: boolean;
  webglThreshold: number;
  lodThresholds?: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface Tile {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  objects: Set<string>;
  isDirty: boolean;
}

export interface SpatialIndex {
  tiles: Map<string, Tile>;
  objects: Map<string, RenderableObject>;
  tileSize: number;
}

export type LevelOfDetail = 'high' | 'medium' | 'low';

export interface RenderStats {
  objectsRendered: number;
  objectsCulled: number;
  drawCalls: number;
  frameTime: number;
  fps: number;
}

export interface WebGLResources {
  program: WebGLProgram | null;
  vertexBuffer: WebGLBuffer | null;
  indexBuffer: WebGLBuffer | null;
  textureAtlas: WebGLTexture | null;
  uniformLocations: Map<string, WebGLUniformLocation>;
}