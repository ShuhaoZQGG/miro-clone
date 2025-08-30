import { OperationTransform, Operation } from '../OperationTransform'

describe('OperationTransform', () => {
  let ot: OperationTransform

  beforeEach(() => {
    ot = new OperationTransform()
  })

  describe('transform operations', () => {
    it('should handle create-create operations independently', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'create',
        element: { id: 'elem1', type: 'rectangle' },
        timestamp: 1000,
        userId: 'user1'
      }

      const op2: Operation = {
        id: 'op2',
        type: 'create',
        element: { id: 'elem2', type: 'circle' },
        timestamp: 1001,
        userId: 'user2'
      }

      const result = ot.transform(op1, op2)
      expect(result.op1).toEqual(op1)
      expect(result.op2).toEqual(op2)
    })

    it('should handle update-update on same element', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'update',
        elementId: 'elem1',
        oldState: { x: 0, y: 0 },
        newState: { x: 100, y: 0 },
        timestamp: 1000,
        userId: 'user1'
      }

      const op2: Operation = {
        id: 'op2',
        type: 'update',
        elementId: 'elem1',
        oldState: { x: 0, y: 0 },
        newState: { x: 0, y: 100 },
        timestamp: 1001,
        userId: 'user2'
      }

      const result = ot.transform(op1, op2)
      expect(result.op1).toBeNull()
      expect(result.op2?.oldState).toEqual({ x: 100, y: 0 })
    })

    it('should handle update-update on different elements', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'update',
        elementId: 'elem1',
        newState: { x: 100 },
        timestamp: 1000,
        userId: 'user1'
      }

      const op2: Operation = {
        id: 'op2',
        type: 'update',
        elementId: 'elem2',
        newState: { y: 100 },
        timestamp: 1001,
        userId: 'user2'
      }

      const result = ot.transform(op1, op2)
      expect(result.op1).toEqual(op1)
      expect(result.op2).toEqual(op2)
    })

    it('should handle delete-delete on same element', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'delete',
        elementId: 'elem1',
        timestamp: 1000,
        userId: 'user1'
      }

      const op2: Operation = {
        id: 'op2',
        type: 'delete',
        elementId: 'elem1',
        timestamp: 1001,
        userId: 'user2'
      }

      const result = ot.transform(op1, op2)
      expect(result.op1).toBeNull()
      expect(result.op2).toBeNull()
    })

    it('should handle update-delete on same element', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'update',
        elementId: 'elem1',
        newState: { x: 100 },
        timestamp: 1000,
        userId: 'user1'
      }

      const op2: Operation = {
        id: 'op2',
        type: 'delete',
        elementId: 'elem1',
        timestamp: 1001,
        userId: 'user2'
      }

      const result = ot.transform(op1, op2)
      expect(result.op1).toBeNull()
      expect(result.op2).toEqual(op2)
    })

    it('should handle move operations', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'move',
        elementId: 'elem1',
        oldState: { x: 0, y: 0 },
        newState: { x: 100, y: 100 },
        timestamp: 1000,
        userId: 'user1'
      }

      const op2: Operation = {
        id: 'op2',
        type: 'move',
        elementId: 'elem2',
        oldState: { x: 50, y: 50 },
        newState: { x: 150, y: 150 },
        timestamp: 1001,
        userId: 'user2'
      }

      const result = ot.transform(op1, op2)
      expect(result.op1).toEqual(op1)
      expect(result.op2).toEqual(op2)
    })
  })

  describe('operation queue management', () => {
    it('should add operations to queue', () => {
      const op: Operation = {
        id: 'op1',
        type: 'create',
        element: { id: 'elem1' },
        timestamp: Date.now(),
        userId: 'user1'
      }

      ot.addToQueue(op)
      expect(ot.getQueueSize()).toBe(1)
    })

    it('should process operation queue', () => {
      const ops: Operation[] = [
        {
          id: 'op1',
          type: 'create',
          element: { id: 'elem1' },
          timestamp: 1000,
          userId: 'user1'
        },
        {
          id: 'op2',
          type: 'update',
          elementId: 'elem1',
          newState: { x: 100 },
          timestamp: 1001,
          userId: 'user2'
        }
      ]

      ops.forEach(op => ot.addToQueue(op))
      const processed = ot.processQueue()
      expect(processed).toHaveLength(2)
    })

    it('should handle conflicting operations in queue', () => {
      const ops: Operation[] = [
        {
          id: 'op1',
          type: 'update',
          elementId: 'elem1',
          oldState: { x: 0 },
          newState: { x: 100 },
          timestamp: 1000,
          userId: 'user1'
        },
        {
          id: 'op2',
          type: 'update',
          elementId: 'elem1',
          oldState: { x: 0 },
          newState: { x: 200 },
          timestamp: 1001,
          userId: 'user2'
        },
        {
          id: 'op3',
          type: 'delete',
          elementId: 'elem1',
          timestamp: 1002,
          userId: 'user3'
        }
      ]

      ops.forEach(op => ot.addToQueue(op))
      const processed = ot.processQueue()
      
      const deleteOp = processed.find(op => op.type === 'delete')
      expect(deleteOp).toBeDefined()
      
      const updateOps = processed.filter(op => op.type === 'update')
      expect(updateOps.length).toBeLessThanOrEqual(1)
    })

    it('should clear queue', () => {
      const op: Operation = {
        id: 'op1',
        type: 'create',
        element: { id: 'elem1' },
        timestamp: Date.now(),
        userId: 'user1'
      }

      ot.addToQueue(op)
      ot.clearQueue()
      expect(ot.getQueueSize()).toBe(0)
    })
  })

  describe('conflict resolution', () => {
    it('should resolve conflicts based on timestamp', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'update',
        elementId: 'elem1',
        newState: { text: 'Hello' },
        timestamp: 1000,
        userId: 'user1'
      }

      const op2: Operation = {
        id: 'op2',
        type: 'update',
        elementId: 'elem1',
        newState: { text: 'World' },
        timestamp: 999,
        userId: 'user2'
      }

      const result = ot.resolveConflict(op1, op2)
      expect(result.winner).toEqual(op1)
      expect(result.loser).toEqual(op2)
    })

    it('should merge non-conflicting property updates', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'update',
        elementId: 'elem1',
        newState: { x: 100 },
        timestamp: 1000,
        userId: 'user1'
      }

      const op2: Operation = {
        id: 'op2',
        type: 'update',
        elementId: 'elem1',
        newState: { y: 200 },
        timestamp: 1001,
        userId: 'user2'
      }

      const merged = ot.mergeOperations(op1, op2)
      expect(merged.newState).toEqual({ x: 100, y: 200 })
    })
  })

  describe('operation history', () => {
    it('should maintain operation history', () => {
      const op: Operation = {
        id: 'op1',
        type: 'create',
        element: { id: 'elem1' },
        timestamp: Date.now(),
        userId: 'user1'
      }

      ot.addToHistory(op)
      expect(ot.getHistorySize()).toBe(1)
    })

    it('should limit history size', () => {
      for (let i = 0; i < 150; i++) {
        ot.addToHistory({
          id: `op${i}`,
          type: 'create',
          element: { id: `elem${i}` },
          timestamp: Date.now(),
          userId: 'user1'
        })
      }

      expect(ot.getHistorySize()).toBeLessThanOrEqual(100)
    })

    it('should retrieve operations from history', () => {
      const ops: Operation[] = [
        {
          id: 'op1',
          type: 'create',
          element: { id: 'elem1' },
          timestamp: 1000,
          userId: 'user1'
        },
        {
          id: 'op2',
          type: 'update',
          elementId: 'elem1',
          newState: { x: 100 },
          timestamp: 1001,
          userId: 'user2'
        }
      ]

      ops.forEach(op => ot.addToHistory(op))
      const history = ot.getHistory()
      expect(history).toHaveLength(2)
      expect(history[0].id).toBe('op1')
    })
  })
})