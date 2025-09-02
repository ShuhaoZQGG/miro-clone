import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { CanvasElement, Position, Size } from '@/types'

interface CRDTOperation {
  type: 'add' | 'update' | 'delete'
  elementId: string
  data?: any
  timestamp: number
  userId: string
}

interface ConflictResolution {
  strategy: 'last-write-wins' | 'merge' | 'custom'
  resolver?: (a: any, b: any) => any
}

interface CRDTStats {
  localOperations: number
  remoteOperations: number
  conflicts: number
  merges: number
  pendingOperations: number
}

export class CRDTManager {
  private doc: Y.Doc
  private provider: WebsocketProvider | null = null
  private elements: Y.Map<CanvasElement>
  private awareness: any
  private userId: string
  private roomId: string
  private operations: Y.Array<CRDTOperation>
  private undoManager: Y.UndoManager
  private stats: CRDTStats = {
    localOperations: 0,
    remoteOperations: 0,
    conflicts: 0,
    merges: 0,
    pendingOperations: 0
  }
  private conflictResolution: ConflictResolution = {
    strategy: 'last-write-wins'
  }
  private eventHandlers = new Map<string, Set<Function>>()
  private isOnline = true
  private pendingOperations: CRDTOperation[] = []
  
  constructor(roomId: string, userId: string, websocketUrl?: string) {
    this.roomId = roomId
    this.userId = userId
    this.doc = new Y.Doc()
    
    // Initialize shared types
    this.elements = this.doc.getMap('elements')
    this.operations = this.doc.getArray('operations')
    
    // Setup undo/redo manager
    this.undoManager = new Y.UndoManager([this.elements, this.operations], {
      trackedOrigins: new Set([this.userId])
    })
    
    // Connect to WebSocket if URL provided
    if (websocketUrl) {
      this.connect(websocketUrl)
    }
    
    // Setup observers
    this.setupObservers()
  }

  /**
   * Connect to WebSocket server for real-time collaboration
   */
  connect(websocketUrl: string): void {
    try {
      this.provider = new WebsocketProvider(websocketUrl, this.roomId, this.doc)
      this.awareness = this.provider.awareness
      
      // Set user awareness
      this.awareness.setLocalState({
        userId: this.userId,
        cursor: null,
        selection: null,
        color: this.generateUserColor()
      })
      
      // Monitor connection status
      this.provider.on('status', (event: any) => {
        this.isOnline = event.status === 'connected'
        if (this.isOnline) {
          this.syncPendingOperations()
        }
      })
      
      // Monitor sync status
      this.provider.on('sync', (isSynced: boolean) => {
        if (isSynced) {
          this.emit('synced', { synced: true })
        }
      })
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
      this.isOnline = false
    }
  }

  /**
   * Setup observers for shared data
   */
  private setupObservers(): void {
    // Observe element changes
    this.elements.observe((event) => {
      const changes: any[] = []
      
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add') {
          changes.push({
            type: 'add',
            elementId: key,
            element: this.elements.get(key)
          })
          this.stats.remoteOperations++
        } else if (change.action === 'update') {
          changes.push({
            type: 'update',
            elementId: key,
            element: this.elements.get(key),
            oldValue: change.oldValue
          })
          this.handleConflict(key, change.oldValue, this.elements.get(key))
        } else if (change.action === 'delete') {
          changes.push({
            type: 'delete',
            elementId: key,
            oldValue: change.oldValue
          })
          this.stats.remoteOperations++
        }
      })
      
      if (changes.length > 0) {
        this.emit('elements-changed', changes)
      }
    })
    
    // Observe awareness changes (cursors, selections)
    if (this.awareness) {
      this.awareness.on('change', (changes: any) => {
        const states: any[] = []
        
        changes.added.forEach((clientId: number) => {
          states.push({
            type: 'added',
            clientId,
            state: this.awareness.getStates().get(clientId)
          })
        })
        
        changes.updated.forEach((clientId: number) => {
          states.push({
            type: 'updated',
            clientId,
            state: this.awareness.getStates().get(clientId)
          })
        })
        
        changes.removed.forEach((clientId: number) => {
          states.push({
            type: 'removed',
            clientId
          })
        })
        
        if (states.length > 0) {
          this.emit('awareness-changed', states)
        }
      })
    }
  }

  /**
   * Add element with CRDT
   */
  addElement(element: CanvasElement): void {
    this.doc.transact(() => {
      // Add timestamp and user info for conflict resolution
      const elementWithMeta = {
        ...element,
        _meta: {
          createdBy: this.userId,
          createdAt: Date.now(),
          updatedBy: this.userId,
          updatedAt: Date.now(),
          version: 1
        }
      }
      
      this.elements.set(element.id, elementWithMeta as CanvasElement)
      
      // Record operation
      this.operations.push([{
        type: 'add',
        elementId: element.id,
        data: elementWithMeta,
        timestamp: Date.now(),
        userId: this.userId
      }])
      
      this.stats.localOperations++
    }, this.userId)
    
    // Store in pending if offline
    if (!this.isOnline) {
      this.pendingOperations.push({
        type: 'add',
        elementId: element.id,
        data: element,
        timestamp: Date.now(),
        userId: this.userId
      })
      this.stats.pendingOperations++
    }
  }

  /**
   * Update element with CRDT
   */
  updateElement(elementId: string, updates: Partial<CanvasElement>): void {
    const existing = this.elements.get(elementId)
    if (!existing) return
    
    this.doc.transact(() => {
      // Merge updates with conflict resolution
      const merged = this.mergeUpdates(existing, updates)
      
      // Update metadata
      if (merged._meta) {
        merged._meta.updatedBy = this.userId
        merged._meta.updatedAt = Date.now()
        merged._meta.version = (merged._meta.version || 0) + 1
      }
      
      this.elements.set(elementId, merged)
      
      // Record operation
      this.operations.push([{
        type: 'update',
        elementId,
        data: updates,
        timestamp: Date.now(),
        userId: this.userId
      }])
      
      this.stats.localOperations++
    }, this.userId)
    
    // Store in pending if offline
    if (!this.isOnline) {
      this.pendingOperations.push({
        type: 'update',
        elementId,
        data: updates,
        timestamp: Date.now(),
        userId: this.userId
      })
      this.stats.pendingOperations++
    }
  }

  /**
   * Delete element with CRDT
   */
  deleteElement(elementId: string): void {
    this.doc.transact(() => {
      this.elements.delete(elementId)
      
      // Record operation
      this.operations.push([{
        type: 'delete',
        elementId,
        timestamp: Date.now(),
        userId: this.userId
      }])
      
      this.stats.localOperations++
    }, this.userId)
    
    // Store in pending if offline
    if (!this.isOnline) {
      this.pendingOperations.push({
        type: 'delete',
        elementId,
        timestamp: Date.now(),
        userId: this.userId
      })
      this.stats.pendingOperations++
    }
  }

  /**
   * Merge updates with conflict resolution
   */
  private mergeUpdates(existing: any, updates: any): any {
    const merged = { ...existing }
    
    for (const key in updates) {
      if (key === 'position' && existing.position && updates.position) {
        // Merge positions
        merged.position = this.mergePositions(existing.position, updates.position)
      } else if (key === 'size' && existing.size && updates.size) {
        // Merge sizes
        merged.size = this.mergeSizes(existing.size, updates.size)
      } else if (key === 'style' && existing.style && updates.style) {
        // Merge styles
        merged.style = { ...existing.style, ...updates.style }
      } else {
        // Default merge
        merged[key] = updates[key]
      }
    }
    
    return merged
  }

  /**
   * Merge positions with conflict resolution
   */
  private mergePositions(a: Position, b: Position): Position {
    switch (this.conflictResolution.strategy) {
      case 'last-write-wins':
        return b
      case 'merge':
        // Average positions
        return {
          x: (a.x + b.x) / 2,
          y: (a.y + b.y) / 2
        }
      case 'custom':
        if (this.conflictResolution.resolver) {
          return this.conflictResolution.resolver(a, b)
        }
        return b
      default:
        return b
    }
  }

  /**
   * Merge sizes with conflict resolution
   */
  private mergeSizes(a: Size, b: Size): Size {
    switch (this.conflictResolution.strategy) {
      case 'last-write-wins':
        return b
      case 'merge':
        // Average sizes
        return {
          width: (a.width + b.width) / 2,
          height: (a.height + b.height) / 2
        }
      case 'custom':
        if (this.conflictResolution.resolver) {
          return this.conflictResolution.resolver(a, b)
        }
        return b
      default:
        return b
    }
  }

  /**
   * Handle conflict detection
   */
  private handleConflict(elementId: string, oldValue: any, newValue: any): void {
    // Check if there's a real conflict
    if (oldValue?._meta?.version === newValue?._meta?.version) {
      return // No conflict
    }
    
    this.stats.conflicts++
    
    // Emit conflict event
    this.emit('conflict', {
      elementId,
      localValue: oldValue,
      remoteValue: newValue,
      resolved: newValue
    })
  }

  /**
   * Sync pending operations when coming back online
   */
  private syncPendingOperations(): void {
    if (this.pendingOperations.length === 0) return
    
    this.doc.transact(() => {
      for (const op of this.pendingOperations) {
        switch (op.type) {
          case 'add':
            if (op.data && !this.elements.has(op.elementId)) {
              this.elements.set(op.elementId, op.data)
            }
            break
          case 'update':
            if (op.data && this.elements.has(op.elementId)) {
              const existing = this.elements.get(op.elementId)
              const merged = this.mergeUpdates(existing, op.data)
              this.elements.set(op.elementId, merged)
            }
            break
          case 'delete':
            this.elements.delete(op.elementId)
            break
        }
      }
    }, this.userId)
    
    this.stats.pendingOperations = 0
    this.pendingOperations = []
    
    this.emit('synced', { pendingOperations: 0 })
  }

  /**
   * Update cursor position for awareness
   */
  updateCursor(position: Position | null): void {
    if (!this.awareness) return
    
    const state = this.awareness.getLocalState()
    this.awareness.setLocalState({
      ...state,
      cursor: position
    })
  }

  /**
   * Update selection for awareness
   */
  updateSelection(elementIds: string[] | null): void {
    if (!this.awareness) return
    
    const state = this.awareness.getLocalState()
    this.awareness.setLocalState({
      ...state,
      selection: elementIds
    })
  }

  /**
   * Get all elements
   */
  getElements(): Map<string, CanvasElement> {
    const result = new Map<string, CanvasElement>()
    this.elements.forEach((value, key) => {
      result.set(key, value)
    })
    return result
  }

  /**
   * Get element by ID
   */
  getElement(elementId: string): CanvasElement | undefined {
    return this.elements.get(elementId)
  }

  /**
   * Get all connected users
   */
  getConnectedUsers(): Map<number, any> {
    if (!this.awareness) return new Map()
    return this.awareness.getStates()
  }

  /**
   * Undo last operation
   */
  undo(): void {
    this.undoManager.undo()
  }

  /**
   * Redo last undone operation
   */
  redo(): void {
    this.undoManager.redo()
  }

  /**
   * Check if can undo
   */
  canUndo(): boolean {
    return this.undoManager.canUndo()
  }

  /**
   * Check if can redo
   */
  canRedo(): boolean {
    return this.undoManager.canRedo()
  }

  /**
   * Set conflict resolution strategy
   */
  setConflictResolution(resolution: ConflictResolution): void {
    this.conflictResolution = resolution
  }

  /**
   * Get statistics
   */
  getStats(): CRDTStats {
    return { ...this.stats }
  }

  /**
   * Generate user color for awareness
   */
  private generateUserColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FECA57', '#FF9FF3', '#54A0FF', '#48DBFB',
      '#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  /**
   * Event emitter functionality
   */
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }

  /**
   * Dispose of CRDT resources
   */
  dispose(): void {
    if (this.provider) {
      this.provider.destroy()
      this.provider = null
    }
    
    this.undoManager.destroy()
    this.doc.destroy()
    this.eventHandlers.clear()
  }
}