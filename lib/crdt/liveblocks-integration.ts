import { CRDTManager } from './crdt-manager';
import { ConflictResolver } from './conflict-resolver';
import { CRDTOperation, ConflictNotification } from './types';

// Type definition for Liveblocks Room (when available)
interface Room {
  subscribe: (event: string, callback: (event: any) => void) => void;
  broadcastEvent: (event: { type: string; data: any }) => void;
}

export class LiveblocksCRDTIntegration {
  private crdtManager: CRDTManager;
  private conflictResolver: ConflictResolver;
  private room: Room | null = null;
  private conflictCallbacks: Set<(notification: ConflictNotification) => void>;

  constructor(siteId: string) {
    this.crdtManager = new CRDTManager(siteId);
    this.conflictResolver = new ConflictResolver();
    this.conflictCallbacks = new Set();
  }

  attachToRoom(room: Room): void {
    this.room = room;
    
    // Listen for CRDT operations from other users
    room.subscribe('crdt-operation', (event) => {
      this.handleRemoteOperation(event.data as CRDTOperation);
    });

    // Listen for state sync requests
    room.subscribe('crdt-sync-request', () => {
      this.broadcastState();
    });

    // Request initial sync
    this.requestSync();
  }

  // Create and broadcast a local operation
  performOperation(type: CRDTOperation['type'], data: Record<string, any>): void {
    const operation = this.crdtManager.createOperation(type, data);
    
    if (this.room) {
      this.room.broadcastEvent({
        type: 'crdt-operation',
        data: operation
      });
    }
  }

  private handleRemoteOperation(operation: CRDTOperation): void {
    const result = this.crdtManager.applyRemoteOperation(operation);
    
    if (!result.success) {
      console.warn('Failed to apply remote operation:', result.reason);
      
      // Check for conflicts
      const conflicts = this.conflictResolver.detectConflicts([operation]);
      conflicts.forEach(notification => {
        this.notifyConflict(notification);
      });
    }
  }

  private broadcastState(): void {
    if (this.room) {
      const state = this.crdtManager.getState();
      this.room.broadcastEvent({
        type: 'crdt-state',
        data: state
      });
    }
  }

  private requestSync(): void {
    if (this.room) {
      this.room.broadcastEvent({
        type: 'crdt-sync-request',
        data: { siteId: this.crdtManager.getSiteId() }
      });
    }
  }

  onConflict(callback: (notification: ConflictNotification) => void): () => void {
    this.conflictCallbacks.add(callback);
    return () => this.conflictCallbacks.delete(callback);
  }

  private notifyConflict(notification: ConflictNotification): void {
    this.conflictCallbacks.forEach(callback => callback(notification));
  }

  getState() {
    return this.crdtManager.getState();
  }

  getSiteId() {
    return this.crdtManager.getSiteId();
  }
}