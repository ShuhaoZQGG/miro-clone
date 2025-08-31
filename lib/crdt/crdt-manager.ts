import { 
  CRDTOperation, 
  CRDTState, 
  VectorClock, 
  OperationType,
  CRDTConfig 
} from './types';

export class CRDTManager {
  private siteId: string;
  private state: CRDTState;
  private operationHistory: Map<string, CRDTOperation>;
  private vectorClock: VectorClock;
  private sequenceNumber: number;

  constructor(siteId: string, config?: Partial<CRDTConfig>) {
    this.siteId = siteId;
    this.sequenceNumber = 0;
    this.vectorClock = { [siteId]: 0 };
    this.operationHistory = new Map();
    this.state = {
      siteId,
      objects: {},
      vectorClock: { ...this.vectorClock },
      tombstones: new Set()
    };
  }

  getSiteId(): string {
    return this.siteId;
  }

  getState(): CRDTState {
    return {
      ...this.state,
      vectorClock: { ...this.vectorClock },
      tombstones: new Set(this.state.tombstones)
    };
  }

  getVectorClock(): VectorClock {
    return { ...this.vectorClock };
  }

  createOperation(type: OperationType, data: Record<string, any>): CRDTOperation {
    this.sequenceNumber++;
    this.vectorClock[this.siteId]++;

    const operation: CRDTOperation = {
      id: `${this.siteId}-${this.sequenceNumber}`,
      siteId: this.siteId,
      type,
      data,
      timestamp: Date.now(),
      vectorClock: { ...this.vectorClock }
    };

    // Apply operation locally
    this.applyOperation(operation);
    this.operationHistory.set(operation.id, operation);

    return operation;
  }

  applyRemoteOperation(operation: CRDTOperation): { success: boolean; reason?: string } {
    // Check for duplicate
    if (this.operationHistory.has(operation.id)) {
      return { success: false, reason: 'duplicate operation' };
    }

    // Check vector clock for causality
    if (!this.isCausallyReady(operation)) {
      return { success: false, reason: 'not causally ready' };
    }

    // Apply the operation
    this.applyOperation(operation);
    this.operationHistory.set(operation.id, operation);

    // Update vector clock
    this.updateVectorClock(operation.vectorClock);

    return { success: true };
  }

  private applyOperation(operation: CRDTOperation): void {
    const { type, data } = operation;
    const objectId = data.id;

    switch (type) {
      case 'add':
        if (!this.state.tombstones.has(objectId)) {
          this.state.objects[objectId] = { ...data };
        }
        break;

      case 'update':
        if (this.state.objects[objectId] && !this.state.tombstones.has(objectId)) {
          this.state.objects[objectId] = {
            ...this.state.objects[objectId],
            ...data
          };
        }
        break;

      case 'delete':
        delete this.state.objects[objectId];
        this.state.tombstones.add(objectId);
        break;

      case 'move':
        if (this.state.objects[objectId] && !this.state.tombstones.has(objectId)) {
          this.state.objects[objectId] = {
            ...this.state.objects[objectId],
            x: data.x,
            y: data.y
          };
        }
        break;
    }
  }

  private isCausallyReady(operation: CRDTOperation): boolean {
    // Check if all dependencies are satisfied
    for (const [siteId, clock] of Object.entries(operation.vectorClock)) {
      if (siteId === operation.siteId) {
        // The operation's site clock should be exactly one more than what we have
        if (clock !== (this.vectorClock[siteId] || 0) + 1) {
          return false;
        }
      } else {
        // Other sites' clocks should not be ahead of what we know
        if (clock > (this.vectorClock[siteId] || 0)) {
          return false;
        }
      }
    }
    return true;
  }

  private updateVectorClock(remoteClock: VectorClock): void {
    for (const [siteId, clock] of Object.entries(remoteClock)) {
      this.vectorClock[siteId] = Math.max(this.vectorClock[siteId] || 0, clock);
    }
  }

  mergeStates(local: CRDTState, remote: CRDTState): CRDTState {
    const merged: CRDTState = {
      siteId: this.siteId,
      objects: {},
      vectorClock: {},
      tombstones: new Set()
    };

    // Merge tombstones
    local.tombstones.forEach(id => merged.tombstones.add(id));
    remote.tombstones.forEach(id => merged.tombstones.add(id));

    // Merge objects
    const allObjectIds = new Set([
      ...Object.keys(local.objects),
      ...Object.keys(remote.objects)
    ]);

    for (const objId of Array.from(allObjectIds)) {
      // Skip if object is tombstoned
      if (merged.tombstones.has(objId)) {
        continue;
      }

      const localObj = local.objects[objId];
      const remoteObj = remote.objects[objId];

      if (!localObj) {
        merged.objects[objId] = remoteObj;
      } else if (!remoteObj) {
        merged.objects[objId] = localObj;
      } else {
        // Conflict resolution: merge properties or use LWW
        merged.objects[objId] = this.mergeObjects(localObj, remoteObj);
      }
    }

    // Merge vector clocks
    const allSiteIds = new Set([
      ...Object.keys(local.vectorClock),
      ...Object.keys(remote.vectorClock)
    ]);

    for (const siteId of Array.from(allSiteIds)) {
      merged.vectorClock[siteId] = Math.max(
        local.vectorClock[siteId] || 0,
        remote.vectorClock[siteId] || 0
      );
    }

    this.state = merged;
    this.vectorClock = merged.vectorClock;

    return merged;
  }

  private mergeObjects(obj1: any, obj2: any): any {
    // Simple property-wise merge with LWW for conflicts
    const merged = { ...obj1 };

    for (const [key, value] of Object.entries(obj2)) {
      if (!(key in obj1)) {
        // Non-conflicting property
        merged[key] = value;
      } else if (typeof value === 'object' && typeof obj1[key] === 'object') {
        // Recursively merge nested objects
        merged[key] = this.mergeObjects(obj1[key], value);
      } else {
        // Conflict: use the value with higher timestamp if available
        // For simplicity, we'll keep obj2's value (last write wins)
        merged[key] = value;
      }
    }

    return merged;
  }

  garbageCollect(minAge: number = 3600000): void {
    // Remove old tombstones after minAge milliseconds
    const now = Date.now();
    const oldOperations: string[] = [];

    this.operationHistory.forEach((op, id) => {
      if (now - op.timestamp > minAge && op.type === 'delete') {
        oldOperations.push(id);
      }
    });

    oldOperations.forEach(id => {
      this.operationHistory.delete(id);
    });
  }
}