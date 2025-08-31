import { 
  CRDTOperation, 
  ConflictResolution, 
  ConflictNotification,
  VectorClock 
} from './types';

export class ConflictResolver {
  resolve(operations: CRDTOperation[]): ConflictResolution {
    if (operations.length === 0) {
      return { strategy: 'custom', conflicts: [] };
    }

    if (operations.length === 1) {
      return { winner: operations[0], strategy: 'custom' };
    }

    // Check for causal ordering
    const causallyOrdered = this.getCausallyOrdered(operations);
    if (causallyOrdered) {
      return { winner: causallyOrdered, strategy: 'causal-ordering' };
    }

    // Group operations by type
    const byType = this.groupByType(operations);

    // Handle delete operations (delete wins)
    if (byType.delete.length > 0) {
      const latestDelete = this.getLatestOperation(byType.delete);
      return { winner: latestDelete, strategy: 'delete-wins' };
    }

    // Try to merge non-conflicting updates
    if (byType.update.length > 0) {
      const merged = this.mergeNonConflicting(byType.update);
      if (merged) {
        return { merged, strategy: 'merge-non-conflicting' };
      }
    }

    // Fall back to last-write-wins
    const latest = this.getLatestOperation(operations);
    return { winner: latest, strategy: 'last-write-wins', conflicts: operations };
  }

  detectConflicts(operations: CRDTOperation[]): ConflictNotification[] {
    const notifications: ConflictNotification[] = [];
    const byObject = this.groupByObject(operations);

    for (const [objectId, ops] of Object.entries(byObject)) {
      if (ops.length <= 1) continue;

      // Check for concurrent operations
      const concurrent = this.findConcurrentOperations(ops);
      if (concurrent.length > 1) {
        const hasDelete = concurrent.some(op => op.type === 'delete');
        const hasUpdate = concurrent.some(op => op.type === 'update');

        let type: ConflictNotification['type'] = 'concurrent-update';
        if (hasDelete && hasUpdate) {
          type = 'delete-update';
        }

        notifications.push({
          id: `conflict-${Date.now()}-${objectId}`,
          type,
          affectedUsers: Array.from(new Set(concurrent.map(op => op.siteId))),
          affectedObjects: [objectId],
          timestamp: Date.now(),
          resolution: this.resolve(concurrent)
        });
      }
    }

    return notifications;
  }

  private getCausallyOrdered(operations: CRDTOperation[]): CRDTOperation | null {
    // Find operation that causally follows all others
    for (const op of operations) {
      if (this.isCausallyAfterAll(op, operations)) {
        return op;
      }
    }
    return null;
  }

  private isCausallyAfterAll(op: CRDTOperation, others: CRDTOperation[]): boolean {
    for (const other of others) {
      if (other.id === op.id) continue;
      if (!this.isCausallyAfter(op, other)) {
        return false;
      }
    }
    return true;
  }

  private isCausallyAfter(op1: CRDTOperation, op2: CRDTOperation): boolean {
    // op1 is causally after op2 if op1's vector clock includes op2's operation
    const op2Clock = op2.vectorClock[op2.siteId] || 0;
    const op1KnowledgeOfOp2Site = op1.vectorClock[op2.siteId] || 0;
    
    return op1KnowledgeOfOp2Site >= op2Clock;
  }

  private findConcurrentOperations(operations: CRDTOperation[]): CRDTOperation[] {
    const concurrent: CRDTOperation[] = [];
    
    for (let i = 0; i < operations.length; i++) {
      for (let j = i + 1; j < operations.length; j++) {
        const op1 = operations[i];
        const op2 = operations[j];
        
        if (!this.isCausallyAfter(op1, op2) && !this.isCausallyAfter(op2, op1)) {
          // Operations are concurrent
          if (!concurrent.includes(op1)) concurrent.push(op1);
          if (!concurrent.includes(op2)) concurrent.push(op2);
        }
      }
    }
    
    return concurrent.length > 0 ? concurrent : operations;
  }

  private groupByType(operations: CRDTOperation[]): Record<string, CRDTOperation[]> {
    const groups: Record<string, CRDTOperation[]> = {
      add: [],
      update: [],
      delete: [],
      move: []
    };

    operations.forEach(op => {
      groups[op.type].push(op);
    });

    return groups;
  }

  private groupByObject(operations: CRDTOperation[]): Record<string, CRDTOperation[]> {
    const groups: Record<string, CRDTOperation[]> = {};

    operations.forEach(op => {
      const objectId = op.data.id;
      if (!groups[objectId]) {
        groups[objectId] = [];
      }
      groups[objectId].push(op);
    });

    return groups;
  }

  private mergeNonConflicting(operations: CRDTOperation[]): CRDTOperation | null {
    if (operations.length === 0) return null;

    // Check if properties don't conflict
    const allProps = new Map<string, any>();
    const conflicts = new Set<string>();

    for (const op of operations) {
      for (const [key, value] of Object.entries(op.data)) {
        if (key === 'id') continue; // Skip ID field
        
        if (allProps.has(key) && allProps.get(key) !== value) {
          conflicts.add(key);
        } else {
          allProps.set(key, value);
        }
      }
    }

    // If there are conflicting properties, we can't merge
    if (conflicts.size > 0) {
      // Try partial merge: keep non-conflicting properties
      conflicts.forEach(key => allProps.delete(key));
      
      // Add the latest value for conflicting properties
      const latest = this.getLatestOperation(operations);
      conflicts.forEach(key => {
        if (key in latest.data) {
          allProps.set(key, latest.data[key]);
        }
      });
    }

    // Create merged operation
    const data = Object.fromEntries(allProps);
    const latest = this.getLatestOperation(operations);
    
    return {
      id: `merged-${Date.now()}`,
      siteId: 'merger',
      type: 'update',
      data,
      timestamp: Date.now(),
      vectorClock: this.mergeVectorClocks(operations.map(op => op.vectorClock))
    };
  }

  private mergeVectorClocks(clocks: VectorClock[]): VectorClock {
    const merged: VectorClock = {};
    
    for (const clock of clocks) {
      for (const [siteId, value] of Object.entries(clock)) {
        merged[siteId] = Math.max(merged[siteId] || 0, value);
      }
    }
    
    return merged;
  }

  private getLatestOperation(operations: CRDTOperation[]): CRDTOperation {
    return operations.reduce((latest, op) => 
      op.timestamp > latest.timestamp ? op : latest
    );
  }
}