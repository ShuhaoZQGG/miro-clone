import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

export interface CRDTUser {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
  selection?: string[];
}

export interface CRDTObject {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  data: any;
  version: number;
  lastModifiedBy: string;
  lastModifiedAt: number;
}

export interface ConflictInfo {
  objectId: string;
  localVersion: CRDTObject;
  remoteVersion: CRDTObject;
  conflictType: 'position' | 'properties' | 'deletion';
  autoResolved: boolean;
}

export class CRDTManager {
  private doc: Y.Doc;
  private provider: WebsocketProvider | null = null;
  private persistence: IndexeddbPersistence | null = null;
  private awareness: any;
  
  // Shared types
  private objects: Y.Map<CRDTObject>;
  private users: Y.Map<CRDTUser>;
  private undoManager: Y.UndoManager;
  
  // Conflict tracking
  private conflicts: Map<string, ConflictInfo> = new Map();
  private conflictCallbacks: Set<(conflicts: ConflictInfo[]) => void> = new Set();
  
  // Local state
  private localUserId: string;
  private localUserColor: string;
  private isOnline = false;
  
  constructor(roomId: string, userId: string, userName: string) {
    this.doc = new Y.Doc();
    this.localUserId = userId;
    this.localUserColor = this.generateUserColor(userId);
    
    // Initialize shared types
    this.objects = this.doc.getMap('objects');
    this.users = this.doc.getMap('users');
    
    // Set up undo manager
    this.undoManager = new Y.UndoManager([this.objects], {
      trackedOrigins: new Set([userId])
    });
    
    // Initialize user
    this.initializeUser(userId, userName);
    
    // Set up WebSocket connection
    this.connectWebSocket(roomId);
    
    // Set up local persistence
    this.setupPersistence(roomId);
    
    // Set up observers
    this.setupObservers();
  }
  
  private initializeUser(userId: string, userName: string): void {
    const user: CRDTUser = {
      id: userId,
      name: userName,
      color: this.localUserColor
    };
    
    this.users.set(userId, user);
  }
  
  private connectWebSocket(roomId: string): void {
    try {
      // Connect to WebSocket server for real-time sync
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:1234';
      this.provider = new WebsocketProvider(wsUrl, roomId, this.doc);
      
      this.awareness = this.provider.awareness;
      this.awareness.setLocalState({
        user: {
          id: this.localUserId,
          color: this.localUserColor
        }
      });
      
      // Track connection status
      this.provider.on('status', (event: any) => {
        this.isOnline = event.status === 'connected';
      });
      
      // Handle awareness updates (cursor positions, selections)
      this.awareness.on('change', (changes: any) => {
        this.handleAwarenessChange(changes);
      });
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.isOnline = false;
    }
  }
  
  private setupPersistence(roomId: string): void {
    // Set up IndexedDB persistence for offline support
    this.persistence = new IndexeddbPersistence(roomId, this.doc);
    
    this.persistence.on('synced', () => {
      console.log('Document synced with IndexedDB');
    });
  }
  
  private setupObservers(): void {
    // Observe changes to objects
    this.objects.observe((event) => {
      this.handleObjectChanges(event);
    });
    
    // Observe changes to users
    this.users.observe((event) => {
      this.handleUserChanges(event);
    });
  }
  
  private handleObjectChanges(event: Y.YMapEvent<CRDTObject>): void {
    const conflicts: ConflictInfo[] = [];
    
    event.changes.keys.forEach((change, key) => {
      if (change.action === 'update') {
        const oldValue = change.oldValue as CRDTObject;
        const newValue = this.objects.get(key);
        
        if (newValue && oldValue && this.detectConflict(oldValue, newValue)) {
          const conflict = this.createConflictInfo(key, oldValue, newValue);
          conflicts.push(conflict);
          
          // Attempt auto-resolution for simple conflicts
          if (this.canAutoResolve(conflict)) {
            this.autoResolveConflict(conflict);
            conflict.autoResolved = true;
          }
        }
      }
    });
    
    // Notify conflict callbacks
    if (conflicts.length > 0) {
      this.notifyConflicts(conflicts);
    }
  }
  
  private detectConflict(oldValue: CRDTObject, newValue: CRDTObject): boolean {
    // Detect if changes conflict
    if (oldValue.version === newValue.version) {
      return false; // Same version, no conflict
    }
    
    // Check if changes were made by different users
    if (oldValue.lastModifiedBy === newValue.lastModifiedBy) {
      return false; // Same user, no conflict
    }
    
    // Check if changes occurred within a short time window (potential conflict)
    const timeDiff = Math.abs(oldValue.lastModifiedAt - newValue.lastModifiedAt);
    if (timeDiff < 100) { // Within 100ms, likely concurrent
      return true;
    }
    
    return false;
  }
  
  private createConflictInfo(
    objectId: string,
    localVersion: CRDTObject,
    remoteVersion: CRDTObject
  ): ConflictInfo {
    let conflictType: ConflictInfo['conflictType'] = 'properties';
    
    if (localVersion.x !== remoteVersion.x || localVersion.y !== remoteVersion.y) {
      conflictType = 'position';
    }
    
    return {
      objectId,
      localVersion,
      remoteVersion,
      conflictType,
      autoResolved: false
    };
  }
  
  private canAutoResolve(conflict: ConflictInfo): boolean {
    // Auto-resolve position conflicts by averaging
    if (conflict.conflictType === 'position') {
      return true;
    }
    
    // Don't auto-resolve property conflicts
    return false;
  }
  
  private autoResolveConflict(conflict: ConflictInfo): void {
    if (conflict.conflictType === 'position') {
      // Average positions for smooth resolution
      const avgX = (conflict.localVersion.x + conflict.remoteVersion.x) / 2;
      const avgY = (conflict.localVersion.y + conflict.remoteVersion.y) / 2;
      
      const resolved = {
        ...conflict.remoteVersion,
        x: avgX,
        y: avgY,
        version: conflict.remoteVersion.version + 1,
        lastModifiedBy: 'auto-resolve',
        lastModifiedAt: Date.now()
      };
      
      this.objects.set(conflict.objectId, resolved);
    }
  }
  
  private handleUserChanges(event: Y.YMapEvent<CRDTUser>): void {
    // Handle user join/leave events
    event.changes.keys.forEach((change, key) => {
      if (change.action === 'add') {
        console.log(`User ${key} joined`);
      } else if (change.action === 'delete') {
        console.log(`User ${key} left`);
      }
    });
  }
  
  private handleAwarenessChange(changes: any): void {
    // Update user cursors and selections
    const states = this.awareness.getStates();
    
    states.forEach((state: any, clientId: number) => {
      if (state.user && state.user.id !== this.localUserId) {
        const user = this.users.get(state.user.id);
        
        if (user) {
          // Update cursor position
          if (state.cursor) {
            user.cursor = state.cursor;
          }
          
          // Update selection
          if (state.selection) {
            user.selection = state.selection;
          }
          
          this.users.set(state.user.id, user);
        }
      }
    });
  }
  
  // Public API
  
  addObject(object: Omit<CRDTObject, 'version' | 'lastModifiedBy' | 'lastModifiedAt'>): void {
    const crdtObject: CRDTObject = {
      ...object,
      version: 1,
      lastModifiedBy: this.localUserId,
      lastModifiedAt: Date.now()
    };
    
    this.doc.transact(() => {
      this.objects.set(object.id, crdtObject);
    }, this.localUserId);
  }
  
  updateObject(id: string, updates: Partial<CRDTObject>): void {
    const existing = this.objects.get(id);
    
    if (existing) {
      const updated: CRDTObject = {
        ...existing,
        ...updates,
        version: existing.version + 1,
        lastModifiedBy: this.localUserId,
        lastModifiedAt: Date.now()
      };
      
      this.doc.transact(() => {
        this.objects.set(id, updated);
      }, this.localUserId);
    }
  }
  
  deleteObject(id: string): void {
    this.doc.transact(() => {
      this.objects.delete(id);
    }, this.localUserId);
  }
  
  getObject(id: string): CRDTObject | undefined {
    return this.objects.get(id);
  }
  
  getAllObjects(): CRDTObject[] {
    const objects: CRDTObject[] = [];
    this.objects.forEach((obj) => objects.push(obj));
    return objects;
  }
  
  updateCursor(x: number, y: number): void {
    if (this.awareness) {
      this.awareness.setLocalStateField('cursor', { x, y });
    }
  }
  
  updateSelection(objectIds: string[]): void {
    if (this.awareness) {
      this.awareness.setLocalStateField('selection', objectIds);
    }
  }
  
  getActiveUsers(): CRDTUser[] {
    const users: CRDTUser[] = [];
    this.users.forEach((user) => users.push(user));
    return users;
  }
  
  undo(): void {
    this.undoManager.undo();
  }
  
  redo(): void {
    this.undoManager.redo();
  }
  
  canUndo(): boolean {
    return this.undoManager.canUndo();
  }
  
  canRedo(): boolean {
    return this.undoManager.canRedo();
  }
  
  onConflict(callback: (conflicts: ConflictInfo[]) => void): void {
    this.conflictCallbacks.add(callback);
  }
  
  offConflict(callback: (conflicts: ConflictInfo[]) => void): void {
    this.conflictCallbacks.delete(callback);
  }
  
  private notifyConflicts(conflicts: ConflictInfo[]): void {
    this.conflictCallbacks.forEach(callback => callback(conflicts));
  }
  
  resolveConflict(objectId: string, resolution: 'local' | 'remote' | 'merge', mergedData?: Partial<CRDTObject>): void {
    const conflict = this.conflicts.get(objectId);
    
    if (!conflict) return;
    
    let resolved: CRDTObject;
    
    switch (resolution) {
      case 'local':
        resolved = conflict.localVersion;
        break;
      case 'remote':
        resolved = conflict.remoteVersion;
        break;
      case 'merge':
        resolved = {
          ...conflict.remoteVersion,
          ...mergedData,
          version: Math.max(conflict.localVersion.version, conflict.remoteVersion.version) + 1,
          lastModifiedBy: this.localUserId,
          lastModifiedAt: Date.now()
        } as CRDTObject;
        break;
    }
    
    this.objects.set(objectId, resolved);
    this.conflicts.delete(objectId);
  }
  
  getConflicts(): ConflictInfo[] {
    return Array.from(this.conflicts.values());
  }
  
  isConnected(): boolean {
    return this.isOnline;
  }
  
  private generateUserColor(userId: string): string {
    // Generate a consistent color based on user ID
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#6C5CE7', '#A29BFE', '#FFEAA7'
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }
  
  dispose(): void {
    // Clean up connections
    if (this.provider) {
      this.provider.disconnect();
      this.provider.destroy();
    }
    
    if (this.persistence) {
      this.persistence.destroy();
    }
    
    // Clear callbacks
    this.conflictCallbacks.clear();
    this.conflicts.clear();
    
    // Destroy document
    this.doc.destroy();
  }
}