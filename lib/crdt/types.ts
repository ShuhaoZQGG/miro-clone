export type OperationType = 'add' | 'update' | 'delete' | 'move';

export interface VectorClock {
  [siteId: string]: number;
}

export interface CRDTOperation {
  id: string;
  siteId: string;
  type: OperationType;
  data: Record<string, any>;
  timestamp: number;
  vectorClock: VectorClock;
  parentId?: string; // For causal ordering
}

export interface CRDTState {
  siteId: string;
  objects: Record<string, any>;
  vectorClock: VectorClock;
  tombstones: Set<string>; // Track deleted objects
}

export interface ConflictResolution {
  winner?: CRDTOperation;
  merged?: CRDTOperation;
  strategy: 'last-write-wins' | 'merge-non-conflicting' | 'delete-wins' | 'causal-ordering' | 'custom';
  conflicts?: CRDTOperation[];
}

export interface ConflictNotification {
  id: string;
  type: 'concurrent-update' | 'delete-update' | 'divergent-states';
  affectedUsers: string[];
  affectedObjects: string[];
  timestamp: number;
  resolution?: ConflictResolution;
}

export interface MergeStrategy {
  name: string;
  canMerge: (ops: CRDTOperation[]) => boolean;
  merge: (ops: CRDTOperation[]) => CRDTOperation | null;
}

export interface CRDTConfig {
  siteId: string;
  conflictStrategy?: 'lww' | 'mvcc' | 'custom';
  gcInterval?: number; // Garbage collection interval for tombstones
  maxClockDrift?: number; // Maximum allowed clock drift in ms
}