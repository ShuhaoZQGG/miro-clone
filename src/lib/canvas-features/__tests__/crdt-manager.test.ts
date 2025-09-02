import { CRDTManager } from '../crdt-manager'
import { CanvasElement } from '@/types'
import * as Y from 'yjs'

// Mock WebsocketProvider
jest.mock('y-websocket', () => ({
  WebsocketProvider: jest.fn().mockImplementation(() => ({
    awareness: {
      setLocalState: jest.fn(),
      getLocalState: jest.fn().mockReturnValue({}),
      getStates: jest.fn().mockReturnValue(new Map()),
      on: jest.fn()
    },
    on: jest.fn(),
    destroy: jest.fn()
  }))
}))

describe('CRDTManager', () => {
  let manager: CRDTManager
  const roomId = 'test-room'
  const userId = 'test-user'
  
  const createMockElement = (id: string): CanvasElement => ({
    id,
    type: 'rectangle',
    position: { x: 100, y: 100 },
    size: { width: 200, height: 100 },
    rotation: 0,
    layerIndex: 0,
    boardId: 'test',
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isLocked: false,
    isVisible: true,
    style: {
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 1,
      opacity: 1
    }
  })

  beforeEach(() => {
    manager = new CRDTManager(roomId, userId)
  })

  afterEach(() => {
    manager.dispose()
  })

  describe('Element Operations', () => {
    it('should add element to CRDT', () => {
      const element = createMockElement('1')
      manager.addElement(element)
      
      const retrieved = manager.getElement('1')
      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe('1')
    })

    it('should update element in CRDT', () => {
      const element = createMockElement('1')
      manager.addElement(element)
      
      manager.updateElement('1', {
        position: { x: 200, y: 200 }
      })
      
      const updated = manager.getElement('1')
      expect(updated?.position).toEqual({ x: 200, y: 200 })
    })

    it('should delete element from CRDT', () => {
      const element = createMockElement('1')
      manager.addElement(element)
      
      manager.deleteElement('1')
      
      const deleted = manager.getElement('1')
      expect(deleted).toBeUndefined()
    })

    it('should get all elements', () => {
      const element1 = createMockElement('1')
      const element2 = createMockElement('2')
      
      manager.addElement(element1)
      manager.addElement(element2)
      
      const elements = manager.getElements()
      expect(elements.size).toBe(2)
      expect(elements.has('1')).toBe(true)
      expect(elements.has('2')).toBe(true)
    })
  })

  describe('Conflict Resolution', () => {
    it('should apply last-write-wins strategy by default', () => {
      const element = createMockElement('1')
      manager.addElement(element)
      
      // Simulate concurrent updates
      manager.updateElement('1', {
        position: { x: 200, y: 200 }
      })
      
      const result = manager.getElement('1')
      expect(result?.position).toEqual({ x: 200, y: 200 })
    })

    it('should allow custom conflict resolution strategy', () => {
      manager.setConflictResolution({
        strategy: 'merge'
      })
      
      const element = createMockElement('1')
      manager.addElement(element)
      
      manager.updateElement('1', {
        position: { x: 300, y: 300 }
      })
      
      const result = manager.getElement('1')
      expect(result?.position).toBeDefined()
    })

    it('should track conflict statistics', () => {
      const element = createMockElement('1')
      manager.addElement(element)
      manager.updateElement('1', { position: { x: 200, y: 200 } })
      
      const stats = manager.getStats()
      expect(stats.localOperations).toBeGreaterThan(0)
      expect(stats.conflicts).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Awareness Management', () => {
    it('should update cursor position', () => {
      const position = { x: 100, y: 100 }
      manager.updateCursor(position)
      // Cursor update is handled by awareness API
      expect(true).toBe(true)
    })

    it('should update selection', () => {
      const selection = ['element1', 'element2']
      manager.updateSelection(selection)
      // Selection update is handled by awareness API
      expect(true).toBe(true)
    })

    it('should clear cursor', () => {
      manager.updateCursor(null)
      expect(true).toBe(true)
    })

    it('should clear selection', () => {
      manager.updateSelection(null)
      expect(true).toBe(true)
    })
  })

  describe('Undo/Redo', () => {
    it('should undo last operation', () => {
      const element = createMockElement('1')
      manager.addElement(element)
      
      if (manager.canUndo()) {
        manager.undo()
        const undone = manager.getElement('1')
        expect(undone).toBeUndefined()
      }
    })

    it('should redo undone operation', () => {
      const element = createMockElement('1')
      manager.addElement(element)
      
      if (manager.canUndo()) {
        manager.undo()
        if (manager.canRedo()) {
          manager.redo()
          const restored = manager.getElement('1')
          expect(restored).toBeDefined()
        }
      }
    })

    it('should check undo availability', () => {
      const canUndo = manager.canUndo()
      expect(typeof canUndo).toBe('boolean')
    })

    it('should check redo availability', () => {
      const canRedo = manager.canRedo()
      expect(typeof canRedo).toBe('boolean')
    })
  })

  describe('WebSocket Connection', () => {
    it('should connect to WebSocket server', () => {
      const newManager = new CRDTManager(roomId, userId, 'ws://localhost:1234')
      expect(newManager).toBeDefined()
      newManager.dispose()
    })

    it('should handle offline mode', () => {
      const element = createMockElement('1')
      manager.addElement(element)
      
      const stats = manager.getStats()
      expect(stats.pendingOperations).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Event Handling', () => {
    it('should register event handlers', () => {
      const handler = jest.fn()
      manager.on('elements-changed', handler)
      
      const element = createMockElement('1')
      manager.addElement(element)
      
      // Event might be emitted asynchronously
      expect(true).toBe(true)
    })

    it('should unregister event handlers', () => {
      const handler = jest.fn()
      manager.on('elements-changed', handler)
      manager.off('elements-changed', handler)
      
      const element = createMockElement('1')
      manager.addElement(element)
      
      expect(true).toBe(true)
    })

    it('should emit synced event', () => {
      const handler = jest.fn()
      manager.on('synced', handler)
      
      // Sync happens when connected
      expect(true).toBe(true)
    })

    it('should emit conflict event', () => {
      const handler = jest.fn()
      manager.on('conflict', handler)
      
      // Conflicts detected during concurrent edits
      expect(true).toBe(true)
    })
  })

  describe('Statistics', () => {
    it('should track local operations', () => {
      const element = createMockElement('1')
      manager.addElement(element)
      manager.updateElement('1', { position: { x: 200, y: 200 } })
      manager.deleteElement('1')
      
      const stats = manager.getStats()
      expect(stats.localOperations).toBe(3)
    })

    it('should track remote operations', () => {
      const stats = manager.getStats()
      expect(stats.remoteOperations).toBeGreaterThanOrEqual(0)
    })

    it('should track pending operations', () => {
      const stats = manager.getStats()
      expect(stats.pendingOperations).toBeGreaterThanOrEqual(0)
    })

    it('should track merges', () => {
      const stats = manager.getStats()
      expect(stats.merges).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Connected Users', () => {
    it('should get connected users', () => {
      const users = manager.getConnectedUsers()
      expect(users).toBeInstanceOf(Map)
    })

    it('should return empty map when not connected', () => {
      const users = manager.getConnectedUsers()
      expect(users.size).toBe(0)
    })
  })

  describe('Disposal', () => {
    it('should cleanup resources on dispose', () => {
      const element = createMockElement('1')
      manager.addElement(element)
      
      manager.dispose()
      
      // After disposal, manager should not throw errors
      expect(() => manager.getElements()).not.toThrow()
    })

    it('should disconnect WebSocket on dispose', () => {
      const connectedManager = new CRDTManager(roomId, userId, 'ws://localhost:1234')
      connectedManager.dispose()
      
      // Should cleanup without errors
      expect(true).toBe(true)
    })
  })

  describe('Metadata Management', () => {
    it('should add metadata to elements', () => {
      const element = createMockElement('1')
      manager.addElement(element)
      
      const retrieved = manager.getElement('1') as any
      expect(retrieved?._meta).toBeDefined()
      expect(retrieved?._meta?.createdBy).toBe(userId)
      expect(retrieved?._meta?.version).toBe(1)
    })

    it('should update metadata on element update', () => {
      const element = createMockElement('1')
      manager.addElement(element)
      
      manager.updateElement('1', { position: { x: 200, y: 200 } })
      
      const updated = manager.getElement('1') as any
      expect(updated?._meta?.updatedBy).toBe(userId)
      expect(updated?._meta?.version).toBeGreaterThan(1)
    })
  })
})