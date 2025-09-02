import { ConflictIndicator } from '../conflict-indicators'
import type { CanvasElement } from '../../../types'

describe('ConflictIndicator', () => {
  let conflictIndicator: ConflictIndicator

  beforeEach(() => {
    conflictIndicator = new ConflictIndicator()
  })

  describe('detectConflict', () => {
    it('should detect when multiple users edit the same element', () => {
      const element: CanvasElement = {
        id: 'element-1',
        type: 'rectangle',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 100 },
        rotation: 0,
        isLocked: false,
        isVisible: true,
        layerIndex: 0,
        boardId: 'board-1',
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        style: {
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 1,
          opacity: 1
        }
      }

      // User 1 starts editing
      conflictIndicator.startEditing(element.id, 'user-1')
      
      // User 2 tries to edit the same element
      const hasConflict = conflictIndicator.detectConflict(element.id, 'user-2')
      
      expect(hasConflict).toBe(true)
    })

    it('should not detect conflict when same user edits', () => {
      const elementId = 'element-1'
      
      conflictIndicator.startEditing(elementId, 'user-1')
      const hasConflict = conflictIndicator.detectConflict(elementId, 'user-1')
      
      expect(hasConflict).toBe(false)
    })

    it('should not detect conflict for different elements', () => {
      conflictIndicator.startEditing('element-1', 'user-1')
      const hasConflict = conflictIndicator.detectConflict('element-2', 'user-2')
      
      expect(hasConflict).toBe(false)
    })
  })

  describe('stopEditing', () => {
    it('should clear conflict when user stops editing', () => {
      const elementId = 'element-1'
      
      conflictIndicator.startEditing(elementId, 'user-1')
      conflictIndicator.stopEditing(elementId, 'user-1')
      
      const hasConflict = conflictIndicator.detectConflict(elementId, 'user-2')
      expect(hasConflict).toBe(false)
    })

    it('should only clear conflict for specific user', () => {
      const elementId = 'element-1'
      
      conflictIndicator.startEditing(elementId, 'user-1')
      conflictIndicator.startEditing(elementId, 'user-2')
      conflictIndicator.stopEditing(elementId, 'user-1')
      
      const hasConflict = conflictIndicator.detectConflict(elementId, 'user-3')
      expect(hasConflict).toBe(true)
    })
  })

  describe('getConflictingUsers', () => {
    it('should return list of users editing an element', () => {
      const elementId = 'element-1'
      
      conflictIndicator.startEditing(elementId, 'user-1')
      conflictIndicator.startEditing(elementId, 'user-2')
      
      const users = conflictIndicator.getConflictingUsers(elementId)
      expect(users).toContain('user-1')
      expect(users).toContain('user-2')
      expect(users).toHaveLength(2)
    })

    it('should return empty array for non-conflicted element', () => {
      const users = conflictIndicator.getConflictingUsers('element-1')
      expect(users).toHaveLength(0)
    })
  })

  describe('renderIndicator', () => {
    it('should create visual indicator for conflicted element', () => {
      const element: CanvasElement = {
        id: 'element-1',
        type: 'rectangle',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 100 },
        rotation: 0,
        isLocked: false,
        isVisible: true,
        layerIndex: 0,
        boardId: 'board-1',
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        style: {
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 1,
          opacity: 1
        }
      }

      conflictIndicator.startEditing(element.id, 'user-1')
      conflictIndicator.startEditing(element.id, 'user-2')
      
      const indicator = conflictIndicator.renderIndicator(element, ['user-1', 'user-2'])
      
      expect(indicator).toBeDefined()
      expect(indicator.type).toBe('conflict-indicator')
      expect(indicator.users).toHaveLength(2)
      expect(indicator.elementBounds).toEqual({
        x: element.position.x,
        y: element.position.y,
        width: element.size.width,
        height: element.size.height
      })
    })

    it('should apply different styles based on conflict severity', () => {
      const element: CanvasElement = {
        id: 'element-1',
        type: 'rectangle',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 100 },
        rotation: 0,
        isLocked: false,
        isVisible: true,
        layerIndex: 0,
        boardId: 'board-1',
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        style: {
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 1,
          opacity: 1
        }
      }

      // Low severity - 2 users
      const lowSeverity = conflictIndicator.renderIndicator(element, ['user-1', 'user-2'])
      expect(lowSeverity.severity).toBe('low')
      expect(lowSeverity.color).toBe('#FFA500') // Orange
      
      // High severity - 3+ users
      const highSeverity = conflictIndicator.renderIndicator(element, ['user-1', 'user-2', 'user-3'])
      expect(highSeverity.severity).toBe('high')
      expect(highSeverity.color).toBe('#FF0000') // Red
    })
  })

  describe('clearAll', () => {
    it('should clear all conflict tracking', () => {
      conflictIndicator.startEditing('element-1', 'user-1')
      conflictIndicator.startEditing('element-2', 'user-2')
      
      conflictIndicator.clearAll()
      
      expect(conflictIndicator.detectConflict('element-1', 'user-2')).toBe(false)
      expect(conflictIndicator.detectConflict('element-2', 'user-1')).toBe(false)
    })
  })

  describe('timeout handling', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should auto-clear stale conflicts after timeout', () => {
      const elementId = 'element-1'
      const timeout = 30000 // 30 seconds
      
      conflictIndicator = new ConflictIndicator({ timeout })
      conflictIndicator.startEditing(elementId, 'user-1')
      
      // Before timeout
      expect(conflictIndicator.detectConflict(elementId, 'user-2')).toBe(true)
      
      // After timeout
      jest.advanceTimersByTime(timeout + 1000)
      expect(conflictIndicator.detectConflict(elementId, 'user-2')).toBe(false)
    })
  })
})