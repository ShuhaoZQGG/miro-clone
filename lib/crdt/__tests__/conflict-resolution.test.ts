import { describe, it, expect, beforeEach } from '@jest/globals';
import { CRDTManager } from '../crdt-manager';
import { ConflictResolver } from '../conflict-resolver';
import { CRDTOperation, CRDTState, ConflictResolution } from '../types';

describe('CRDT Conflict Resolution', () => {
  let crdtManager: CRDTManager;
  let conflictResolver: ConflictResolver;

  beforeEach(() => {
    crdtManager = new CRDTManager('test-site-1');
    conflictResolver = new ConflictResolver();
  });

  describe('CRDTManager', () => {
    it('should initialize with correct site ID', () => {
      expect(crdtManager.getSiteId()).toBe('test-site-1');
    });

    it('should generate unique operation IDs', () => {
      const op1 = crdtManager.createOperation('add', { id: 'obj1', type: 'rectangle' });
      const op2 = crdtManager.createOperation('add', { id: 'obj2', type: 'circle' });
      
      expect(op1.id).not.toBe(op2.id);
      expect(op1.siteId).toBe('test-site-1');
      expect(op2.siteId).toBe('test-site-1');
    });

    it('should maintain vector clock for operations', () => {
      const op1 = crdtManager.createOperation('add', { id: 'obj1' });
      const clock1 = crdtManager.getVectorClock();
      
      const op2 = crdtManager.createOperation('update', { id: 'obj1', x: 100 });
      const clock2 = crdtManager.getVectorClock();
      
      expect(clock2['test-site-1']).toBeGreaterThan(clock1['test-site-1']);
    });

    it('should apply remote operations correctly', () => {
      const remoteOp: CRDTOperation = {
        id: 'remote-op-1',
        siteId: 'remote-site',
        type: 'add',
        data: { id: 'remote-obj', type: 'text', content: 'Hello' },
        timestamp: Date.now(),
        vectorClock: { 'remote-site': 1 }
      };

      const result = crdtManager.applyRemoteOperation(remoteOp);
      expect(result.success).toBe(true);
      expect(crdtManager.getState().objects['remote-obj']).toBeDefined();
    });

    it('should detect and handle duplicate operations', () => {
      const op: CRDTOperation = {
        id: 'op-1',
        siteId: 'site-1',
        type: 'add',
        data: { id: 'obj1' },
        timestamp: Date.now(),
        vectorClock: { 'site-1': 1 }
      };

      const result1 = crdtManager.applyRemoteOperation(op);
      const result2 = crdtManager.applyRemoteOperation(op);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);
      expect(result2.reason).toContain('duplicate');
    });
  });

  describe('ConflictResolver', () => {
    it('should resolve concurrent add operations', () => {
      const op1: CRDTOperation = {
        id: 'op1',
        siteId: 'site1',
        type: 'add',
        data: { id: 'obj1', x: 100, y: 100 },
        timestamp: 1000,
        vectorClock: { site1: 1 }
      };

      const op2: CRDTOperation = {
        id: 'op2',
        siteId: 'site2',
        type: 'add',
        data: { id: 'obj1', x: 200, y: 200 },
        timestamp: 1001,
        vectorClock: { site2: 1 }
      };

      const resolution = conflictResolver.resolve([op1, op2]);
      expect(resolution.winner).toBeDefined();
      expect(resolution.strategy).toBe('last-write-wins');
    });

    it('should resolve concurrent update operations', () => {
      const op1: CRDTOperation = {
        id: 'op1',
        siteId: 'site1',
        type: 'update',
        data: { id: 'obj1', x: 150 },
        timestamp: 2000,
        vectorClock: { site1: 2 }
      };

      const op2: CRDTOperation = {
        id: 'op2',
        siteId: 'site2',
        type: 'update',
        data: { id: 'obj1', y: 250 },
        timestamp: 2001,
        vectorClock: { site2: 2 }
      };

      const resolution = conflictResolver.resolve([op1, op2]);
      expect(resolution.merged).toBeDefined();
      expect(resolution.strategy).toBe('merge-non-conflicting');
    });

    it('should handle delete-update conflicts', () => {
      const deleteOp: CRDTOperation = {
        id: 'op1',
        siteId: 'site1',
        type: 'delete',
        data: { id: 'obj1' },
        timestamp: 3000,
        vectorClock: { site1: 3 }
      };

      const updateOp: CRDTOperation = {
        id: 'op2',
        siteId: 'site2',
        type: 'update',
        data: { id: 'obj1', color: 'red' },
        timestamp: 3001,
        vectorClock: { site2: 3 }
      };

      const resolution = conflictResolver.resolve([deleteOp, updateOp]);
      expect(resolution.strategy).toBe('delete-wins');
      expect(resolution.winner?.type).toBe('delete');
    });

    it('should merge compatible property updates', () => {
      const op1: CRDTOperation = {
        id: 'op1',
        siteId: 'site1',
        type: 'update',
        data: { id: 'obj1', width: 200, height: 100 },
        timestamp: 4000,
        vectorClock: { site1: 4 }
      };

      const op2: CRDTOperation = {
        id: 'op2',
        siteId: 'site2',
        type: 'update',
        data: { id: 'obj1', color: 'blue', opacity: 0.8 },
        timestamp: 4001,
        vectorClock: { site2: 4 }
      };

      const resolution = conflictResolver.resolve([op1, op2]);
      expect(resolution.merged).toBeDefined();
      expect(resolution.merged?.data).toMatchObject({
        id: 'obj1',
        width: 200,
        height: 100,
        color: 'blue',
        opacity: 0.8
      });
    });

    it('should use causal ordering when available', () => {
      const op1: CRDTOperation = {
        id: 'op1',
        siteId: 'site1',
        type: 'update',
        data: { id: 'obj1', version: 1 },
        timestamp: 5000,
        vectorClock: { site1: 1 }
      };

      const op2: CRDTOperation = {
        id: 'op2',
        siteId: 'site2',
        type: 'update',
        data: { id: 'obj1', version: 2 },
        timestamp: 5001,
        vectorClock: { site1: 1, site2: 1 } // Causally after op1
      };

      const resolution = conflictResolver.resolve([op1, op2]);
      expect(resolution.winner?.id).toBe('op2');
      expect(resolution.strategy).toBe('causal-ordering');
    });
  });

  describe('State Synchronization', () => {
    it('should merge states from multiple sites', () => {
      const state1: CRDTState = {
        siteId: 'site1',
        objects: {
          'obj1': { id: 'obj1', x: 100, y: 100 },
          'obj2': { id: 'obj2', x: 200, y: 200 }
        },
        vectorClock: { site1: 2 },
        tombstones: new Set()
      };

      const state2: CRDTState = {
        siteId: 'site2',
        objects: {
          'obj2': { id: 'obj2', x: 250, y: 250 }, // Conflict
          'obj3': { id: 'obj3', x: 300, y: 300 }  // New object
        },
        vectorClock: { site2: 2 },
        tombstones: new Set(['obj4']) // Deleted object
      };

      const mergedState = crdtManager.mergeStates(state1, state2);
      
      expect(Object.keys(mergedState.objects)).toContain('obj1');
      expect(Object.keys(mergedState.objects)).toContain('obj3');
      expect(mergedState.tombstones.has('obj4')).toBe(true);
    });

    it('should handle state divergence and convergence', () => {
      const manager1 = new CRDTManager('site1');
      const manager2 = new CRDTManager('site2');

      // Both sites add different objects
      manager1.createOperation('add', { id: 'obj1', value: 'A' });
      manager2.createOperation('add', { id: 'obj2', value: 'B' });

      // Sync states
      const state1 = manager1.getState();
      const state2 = manager2.getState();

      manager1.mergeStates(state1, state2);
      manager2.mergeStates(state2, state1);

      // States should converge
      expect(manager1.getState().objects).toEqual(manager2.getState().objects);
    });
  });

  describe('Conflict Notifications', () => {
    it('should generate conflict notifications for users', () => {
      const conflicts = conflictResolver.detectConflicts([
        {
          id: 'op1',
          siteId: 'user1',
          type: 'update',
          data: { id: 'obj1', text: 'Hello' },
          timestamp: 6000,
          vectorClock: { user1: 1 }
        },
        {
          id: 'op2',
          siteId: 'user2',
          type: 'update',
          data: { id: 'obj1', text: 'World' },
          timestamp: 6001,
          vectorClock: { user2: 1 }
        }
      ]);

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].type).toBe('concurrent-update');
      expect(conflicts[0].affectedUsers).toContain('user1');
      expect(conflicts[0].affectedUsers).toContain('user2');
    });
  });
});