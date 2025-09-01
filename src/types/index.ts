// Core types for the Miro clone application

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Bounds extends Position, Size {}

export interface Transform {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
}

// User types
export interface User {
  id: string
  email: string
  username?: string
  displayName: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

export interface UserPresence {
  userId: string
  cursor?: Position
  selection?: string[]
  lastSeen: string
  isActive: boolean
}

// Board types
export interface Board {
  id: string
  title: string
  description?: string
  ownerId: string
  settings: BoardSettings
  createdAt: string
  updatedAt: string
  version: number
}

export interface BoardSettings {
  isPublic: boolean
  allowGuests: boolean
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
  backgroundColor: string
}

export interface BoardPermission {
  id: string
  boardId: string
  userId: string
  permission: 'view' | 'edit' | 'admin'
  grantedAt: string
  grantedBy: string
}

// Element types
export type ElementType = 'sticky_note' | 'rectangle' | 'circle' | 'ellipse' | 'line' | 'text' | 'image' | 'connector' | 'freehand'

export interface BaseElement {
  id: string
  type: ElementType
  boardId: string
  position: Position
  size: Size
  rotation: number
  layerIndex: number
  createdBy: string
  createdAt: string
  updatedAt: string
  isLocked?: boolean
  isVisible?: boolean
}

export interface StickyNoteElement extends BaseElement {
  type: 'sticky_note'
  content: {
    text: string
    fontSize: number
    fontFamily: string
    color: string
    backgroundColor: string
  }
}

export interface ShapeElement extends BaseElement {
  type: 'rectangle' | 'circle' | 'ellipse'
  style: {
    fill: string
    stroke: string
    strokeWidth: number
    opacity: number
  }
}

export interface LineElement extends BaseElement {
  type: 'line'
  startPoint: Position
  endPoint: Position
  style: {
    stroke: string
    strokeWidth: number
    strokeDasharray?: string
  }
}

export interface TextElement extends BaseElement {
  type: 'text'
  content: {
    text: string
    fontSize: number
    fontFamily: string
    fontWeight: string
    fontStyle?: string
    color: string
    textAlign: 'left' | 'center' | 'right'
    backgroundColor?: string
    lineHeight?: number
    letterSpacing?: number
    underline?: boolean
    strikethrough?: boolean
  }
}

export interface ImageElement extends BaseElement {
  type: 'image'
  content: {
    url: string
    alt?: string
    originalSize: Size
  }
}

export interface ConnectorElement extends BaseElement {
  type: 'connector'
  connection: {
    startElementId?: string
    endElementId?: string
    startPoint: Position
    endPoint: Position
    style: 'straight' | 'curved' | 'stepped'
  }
  style: {
    stroke: string
    strokeWidth: number
    strokeDasharray?: string
    arrowStart?: boolean
    arrowEnd?: boolean
  }
}

export interface FreehandElement extends BaseElement {
  type: 'freehand'
  path: {
    points: Position[]
    brushSize: number
    color: string
    opacity: number
  }
}

export type CanvasElement = 
  | StickyNoteElement 
  | ShapeElement 
  | LineElement
  | TextElement 
  | ImageElement 
  | ConnectorElement 
  | FreehandElement

// Canvas types
export interface CanvasState {
  zoom: number
  pan: Position
  elements: CanvasElement[]
  selectedElementIds: string[]
  tool: Tool
  isGridVisible: boolean
  snapToGrid: boolean
}

export interface Camera {
  x: number
  y: number
  zoom: number
}

export interface Tool {
  type: ElementType | 'select' | 'pan'
  options?: Record<string, any>
}

// Collaboration types
export interface CollaborationState {
  users: Map<string, UserPresence>
  isConnected: boolean
  connectionId?: string
  lastSyncTime: string
}

// Operation types for real-time collaboration
export interface Operation {
  id: string
  type: 'create' | 'update' | 'delete' | 'transform'
  elementId?: string
  userId: string
  timestamp: string
  data: any
  boardId: string
}

export interface OperationResult {
  success: boolean
  operation: Operation
  error?: string
}

// WebSocket message types
export interface WSMessage {
  type: 'operation' | 'presence' | 'join' | 'leave' | 'sync'
  payload: any
  userId: string
  boardId: string
  timestamp: string
}

// Event types
export interface CanvasEvent {
  type: 'element_created' | 'element_updated' | 'element_deleted' | 'selection_changed' | 'tool_changed'
  payload: any
  timestamp: string
}

// History types for undo/redo
export interface HistoryState {
  operations: Operation[]
  currentIndex: number
  maxSize: number
}

// Export format types
export type ExportFormat = 'png' | 'jpg' | 'svg' | 'pdf'

export interface ExportOptions {
  format: ExportFormat
  quality?: number
  scale?: number
  bounds?: Bounds
  includeBackground?: boolean
}

// Template types
export interface Template {
  id: string
  name: string
  description: string
  category: string
  thumbnail: string
  elements: Omit<CanvasElement, 'id' | 'boardId' | 'createdBy' | 'createdAt' | 'updatedAt'>[]
  tags: string[]
  isPublic: boolean
  createdBy: string
  createdAt: string
}

// API response types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> extends APIResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Form types
export interface LoginForm {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignupForm {
  email: string
  password: string
  confirmPassword: string
  displayName: string
  username?: string
}

export interface BoardForm {
  title: string
  description?: string
  isPublic?: boolean
  templateId?: string
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
}