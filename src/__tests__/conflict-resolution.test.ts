import { describe, it, expect, beforeEach } from '@jest/globals'
import { 
  ConflictResolver, 
  VectorClock, 
  LWWElementSet,
  Operation 
} from '../../server/services/conflict-resolution.service'

describe('ConflictResolver', () => {
  let resolver: ConflictResolver
  
  beforeEach(() => {
    resolver = new ConflictResolver()
  })

  describe('transform operations', () => {
    it('should handle concurrent deletes on same element', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'delete',
        elementId: 'elem1',
        userId: 'user1',
        timestamp: 1000,
        sequence: 1,
        data: {},
        boardId: 'board1'
      }

      const op2: Operation = {
        id: 'op2',
        type: 'delete',
        elementId: 'elem1',
        userId: 'user2',
        timestamp: 1001,
        sequence: 2,
        data: {},
        boardId: 'board1'
      }

      const result = resolver.transform(op1, op2)
      expect(result.operation1).toBeNull()
      expect(result.operation2).toBeNull()
    })

    it('should handle delete vs update conflict', () => {
      const deleteOp: Operation = {
        id: 'op1',
        type: 'delete',
        elementId: 'elem1',
        userId: 'user1',
        timestamp: 1000,
        sequence: 1,
        data: {},
        boardId: 'board1'
      }

      const updateOp: Operation = {
        id: 'op2',
        type: 'update',
        elementId: 'elem1',
        userId: 'user2',
        timestamp: 1001,
        sequence: 2,
        data: { color: 'red' },
        boardId: 'board1'
      }

      const result = resolver.transform(deleteOp, updateOp)
      expect(result.operation1).toBe(deleteOp)
      expect(result.operation2).toBeNull()
    })

    it('should merge concurrent updates', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'update',
        elementId: 'elem1',
        userId: 'user1',
        timestamp: 1000,
        sequence: 1,
        data: { color: 'red' },
        boardId: 'board1'
      }

      const op2: Operation = {
        id: 'op2',
        type: 'update',
        elementId: 'elem1',
        userId: 'user2',
        timestamp: 1001,
        sequence: 2,
        data: { size: 'large' },
        boardId: 'board1'
      }

      const result = resolver.transform(op1, op2)
      expect(result.operation1).toBeTruthy()
      expect(result.operation1?.data).toEqual({ color: 'red', size: 'large' })
      expect(result.operation2).toBeNull()
    })

    it('should handle operations on different elements', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'update',
        elementId: 'elem1',
        userId: 'user1',
        timestamp: 1000,
        sequence: 1,
        data: { color: 'red' },
        boardId: 'board1'
      }

      const op2: Operation = {
        id: 'op2',
        type: 'update',
        elementId: 'elem2',
        userId: 'user2',
        timestamp: 1001,
        sequence: 2,
        data: { color: 'blue' },
        boardId: 'board1'
      }

      const result = resolver.transform(op1, op2)
      expect(result.operation1).toBe(op1)
      expect(result.operation2).toBe(op2)
    })
  })

  describe('applyOperation', () => {
    it('should create new element', () => {
      const boardState = { elements: [] }
      const createOp: Operation = {
        id: 'op1',
        type: 'create',
        elementId: 'elem1',
        userId: 'user1',
        timestamp: 1000,
        sequence: 1,
        data: { type: 'rectangle', color: 'blue' },
        boardId: 'board1'
      }

      const newState = resolver.applyOperation(boardState, createOp)
      expect(newState.elements).toHaveLength(1)
      expect(newState.elements[0]).toEqual({
        id: 'elem1',
        type: 'rectangle',
        color: 'blue'
      })
    })

    it('should update existing element', () => {
      const boardState = { 
        elements: [{ id: 'elem1', type: 'rectangle', color: 'blue' }] 
      }
      const updateOp: Operation = {
        id: 'op1',
        type: 'update',
        elementId: 'elem1',
        userId: 'user1',
        timestamp: 1000,
        sequence: 1,
        data: { color: 'red' },
        boardId: 'board1'
      }

      const newState = resolver.applyOperation(boardState, updateOp)
      expect(newState.elements[0].color).toBe('red')
      expect(newState.elements[0].type).toBe('rectangle')
    })

    it('should delete element', () => {
      const boardState = { 
        elements: [
          { id: 'elem1', type: 'rectangle' },
          { id: 'elem2', type: 'circle' }
        ] 
      }
      const deleteOp: Operation = {
        id: 'op1',
        type: 'delete',
        elementId: 'elem1',
        userId: 'user1',
        timestamp: 1000,
        sequence: 1,
        data: {},
        boardId: 'board1'
      }

      const newState = resolver.applyOperation(boardState, deleteOp)
      expect(newState.elements).toHaveLength(1)
      expect(newState.elements[0].id).toBe('elem2')
    })
  })

  describe('sequence management', () => {
    it('should increment sequence numbers correctly', () => {
      const seq1 = resolver.getNextSequence('board1')
      const seq2 = resolver.getNextSequence('board1')
      const seq3 = resolver.getNextSequence('board1')
      
      expect(seq1).toBe(1)
      expect(seq2).toBe(2)
      expect(seq3).toBe(3)
    })

    it('should track sequences per board', () => {
      const board1Seq1 = resolver.getNextSequence('board1')
      const board2Seq1 = resolver.getNextSequence('board2')
      const board1Seq2 = resolver.getNextSequence('board1')
      
      expect(board1Seq1).toBe(1)
      expect(board2Seq1).toBe(1)
      expect(board1Seq2).toBe(2)
    })
  })
})

describe('VectorClock', () => {
  let clock: VectorClock
  
  beforeEach(() => {
    clock = new VectorClock()
  })

  it('should increment clocks correctly', () => {
    const clock1 = clock.increment('board1', 'user1')
    expect(clock1.get('user1')).toBe(1)
    
    const clock2 = clock.increment('board1', 'user1')
    expect(clock2.get('user1')).toBe(2)
    
    const clock3 = clock.increment('board1', 'user2')
    expect(clock3.get('user2')).toBe(1)
    expect(clock3.get('user1')).toBe(2)
  })

  it('should detect happens-before relationship', () => {
    const clock1 = new Map([['user1', 1], ['user2', 0]])
    const clock2 = new Map([['user1', 2], ['user2', 1]])
    
    expect(clock.happensBefore('board1', clock1, clock2)).toBe(true)
    expect(clock.happensBefore('board1', clock2, clock1)).toBe(false)
  })

  it('should detect concurrent clocks', () => {
    const clock1 = new Map([['user1', 2], ['user2', 0]])
    const clock2 = new Map([['user1', 1], ['user2', 1]])
    
    expect(clock.areConcurrent('board1', clock1, clock2)).toBe(true)
  })

  it('should update clocks correctly', () => {
    clock.increment('board1', 'user1')
    clock.increment('board1', 'user1')
    
    const receivedClock = new Map([['user1', 3], ['user2', 2]])
    clock.update('board1', receivedClock)
    
    const currentClock = clock.getClock('board1')
    expect(currentClock.get('user1')).toBe(3)
    expect(currentClock.get('user2')).toBe(2)
  })
})

describe('LWWElementSet', () => {
  let lwwSet: LWWElementSet
  
  beforeEach(() => {
    lwwSet = new LWWElementSet()
  })

  it('should add elements correctly', () => {
    const element1 = { id: 'elem1', type: 'rectangle' }
    lwwSet.add('elem1', element1, 1000)
    
    expect(lwwSet.exists('elem1')).toBe(true)
    expect(lwwSet.getElements()).toHaveLength(1)
  })

  it('should handle remove operations', () => {
    const element1 = { id: 'elem1', type: 'rectangle' }
    lwwSet.add('elem1', element1, 1000)
    lwwSet.remove('elem1', 2000)
    
    expect(lwwSet.exists('elem1')).toBe(false)
    expect(lwwSet.getElements()).toHaveLength(0)
  })

  it('should use last-write-wins for concurrent operations', () => {
    const element1 = { id: 'elem1', type: 'rectangle' }
    lwwSet.add('elem1', element1, 1000)
    lwwSet.remove('elem1', 999) // Earlier remove should be ignored
    
    expect(lwwSet.exists('elem1')).toBe(true)
  })

  it('should merge with another LWW set', () => {
    const set1 = new LWWElementSet()
    const set2 = new LWWElementSet()
    
    set1.add('elem1', { id: 'elem1', type: 'rectangle' }, 1000)
    set2.add('elem2', { id: 'elem2', type: 'circle' }, 1001)
    set2.remove('elem1', 1002)
    
    set1.merge(set2)
    
    expect(set1.exists('elem1')).toBe(false)
    expect(set1.exists('elem2')).toBe(true)
    expect(set1.getElements()).toHaveLength(1)
  })

  it('should serialize and deserialize state', () => {
    const element1 = { id: 'elem1', type: 'rectangle' }
    const element2 = { id: 'elem2', type: 'circle' }
    
    lwwSet.add('elem1', element1, 1000)
    lwwSet.add('elem2', element2, 1001)
    lwwSet.remove('elem1', 1002)
    
    const state = lwwSet.getState()
    
    const newSet = new LWWElementSet()
    newSet.setState(state)
    
    expect(newSet.exists('elem1')).toBe(false)
    expect(newSet.exists('elem2')).toBe(true)
    expect(newSet.getElements()).toHaveLength(1)
  })
})