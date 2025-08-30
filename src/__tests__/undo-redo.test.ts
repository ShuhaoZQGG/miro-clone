import { HistoryManager } from '@/lib/history-manager'
import { CanvasElement } from '@/types'

describe('HistoryManager - Undo/Redo Functionality', () => {
  let historyManager: HistoryManager
  let mockExecuteCallback: jest.Mock
  let mockUndoCallback: jest.Mock

  beforeEach(() => {
    mockExecuteCallback = jest.fn()
    mockUndoCallback = jest.fn()
    historyManager = new HistoryManager()
  })

  describe('Command Execution', () => {
    it('should execute a command and add it to history', () => {
      const command = historyManager.createCommand({
        type: 'create',
        execute: mockExecuteCallback,
        undo: mockUndoCallback,
        data: { elementId: 'element-1' }
      })

      historyManager.execute(command)

      expect(mockExecuteCallback).toHaveBeenCalledTimes(1)
      expect(historyManager.canUndo()).toBe(true)
      expect(historyManager.canRedo()).toBe(false)
    })

    it('should clear redo stack when executing new command after undo', () => {
      const command1 = historyManager.createCommand({
        type: 'create',
        execute: mockExecuteCallback,
        undo: mockUndoCallback,
        data: { elementId: 'element-1' }
      })

      const command2 = historyManager.createCommand({
        type: 'update',
        execute: mockExecuteCallback,
        undo: mockUndoCallback,
        data: { elementId: 'element-2' }
      })

      historyManager.execute(command1)
      historyManager.undo()
      historyManager.execute(command2)

      expect(historyManager.canRedo()).toBe(false)
    })

    it('should limit history size to maximum', () => {
      const maxSize = 100 // Default max size

      for (let i = 0; i < maxSize + 10; i++) {
        const command = historyManager.createCommand({
          type: 'create',
          execute: mockExecuteCallback,
          undo: mockUndoCallback,
          data: { elementId: `element-${i}` }
        })
        historyManager.execute(command)
      }

      // Should maintain only maxSize commands
      let undoCount = 0
      while (historyManager.canUndo()) {
        historyManager.undo()
        undoCount++
      }

      expect(undoCount).toBe(maxSize)
    })
  })

  describe('Undo', () => {
    it('should undo the last command', () => {
      const command = historyManager.createCommand({
        type: 'create',
        execute: mockExecuteCallback,
        undo: mockUndoCallback,
        data: { elementId: 'element-1' }
      })

      historyManager.execute(command)
      historyManager.undo()

      expect(mockUndoCallback).toHaveBeenCalledTimes(1)
      expect(historyManager.canUndo()).toBe(false)
      expect(historyManager.canRedo()).toBe(true)
    })

    it('should undo multiple commands in reverse order', () => {
      const undoCallbacks = [jest.fn(), jest.fn(), jest.fn()]
      
      undoCallbacks.forEach((undoFn, index) => {
        const command = historyManager.createCommand({
          type: 'create',
          execute: jest.fn(),
          undo: undoFn,
          data: { elementId: `element-${index}` }
        })
        historyManager.execute(command)
      })

      historyManager.undo()
      expect(undoCallbacks[2]).toHaveBeenCalled()
      
      historyManager.undo()
      expect(undoCallbacks[1]).toHaveBeenCalled()
      
      historyManager.undo()
      expect(undoCallbacks[0]).toHaveBeenCalled()
    })

    it('should return false when nothing to undo', () => {
      const result = historyManager.undo()
      
      expect(result).toBe(false)
      expect(historyManager.canUndo()).toBe(false)
    })
  })

  describe('Redo', () => {
    it('should redo the last undone command', () => {
      const executeCallback = jest.fn()
      const command = historyManager.createCommand({
        type: 'create',
        execute: executeCallback,
        undo: mockUndoCallback,
        data: { elementId: 'element-1' }
      })

      historyManager.execute(command)
      executeCallback.mockClear() // Clear initial execution
      
      historyManager.undo()
      historyManager.redo()

      expect(executeCallback).toHaveBeenCalledTimes(1)
      expect(historyManager.canUndo()).toBe(true)
      expect(historyManager.canRedo()).toBe(false)
    })

    it('should redo multiple commands in forward order', () => {
      const executeCallbacks = [jest.fn(), jest.fn(), jest.fn()]
      
      executeCallbacks.forEach((execFn, index) => {
        const command = historyManager.createCommand({
          type: 'create',
          execute: execFn,
          undo: jest.fn(),
          data: { elementId: `element-${index}` }
        })
        historyManager.execute(command)
      })

      // Clear initial executions
      executeCallbacks.forEach(fn => fn.mockClear())
      
      // Undo all
      historyManager.undo()
      historyManager.undo()
      historyManager.undo()
      
      // Redo in forward order
      historyManager.redo()
      expect(executeCallbacks[0]).toHaveBeenCalled()
      
      historyManager.redo()
      expect(executeCallbacks[1]).toHaveBeenCalled()
      
      historyManager.redo()
      expect(executeCallbacks[2]).toHaveBeenCalled()
    })

    it('should return false when nothing to redo', () => {
      const result = historyManager.redo()
      
      expect(result).toBe(false)
      expect(historyManager.canRedo()).toBe(false)
    })
  })

  describe('Command Types', () => {
    it('should handle create element command', () => {
      const element: Partial<CanvasElement> = {
        id: 'element-1',
        type: 'rectangle',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 100 }
      }

      const addElement = jest.fn()
      const removeElement = jest.fn()

      const command = historyManager.createElementCommand('create', {
        element,
        onExecute: addElement,
        onUndo: removeElement
      })

      historyManager.execute(command)
      expect(addElement).toHaveBeenCalledWith(element)

      historyManager.undo()
      expect(removeElement).toHaveBeenCalledWith(element.id)
    })

    it('should handle update element command', () => {
      const oldState = { position: { x: 100, y: 100 } }
      const newState = { position: { x: 200, y: 200 } }
      const elementId = 'element-1'

      const updateElement = jest.fn()

      const command = historyManager.createElementCommand('update', {
        elementId,
        oldState,
        newState,
        onExecute: updateElement,
        onUndo: updateElement
      })

      historyManager.execute(command)
      expect(updateElement).toHaveBeenCalledWith(elementId, newState)

      historyManager.undo()
      expect(updateElement).toHaveBeenCalledWith(elementId, oldState)
    })

    it('should handle delete element command', () => {
      const element: Partial<CanvasElement> = {
        id: 'element-1',
        type: 'circle',
        position: { x: 50, y: 50 },
        size: { width: 100, height: 100 }
      }

      const removeElement = jest.fn()
      const restoreElement = jest.fn()

      const command = historyManager.createElementCommand('delete', {
        element,
        onExecute: removeElement,
        onUndo: restoreElement
      })

      historyManager.execute(command)
      expect(removeElement).toHaveBeenCalledWith(element.id)

      historyManager.undo()
      expect(restoreElement).toHaveBeenCalledWith(element)
    })
  })

  describe('Batch Commands', () => {
    it('should execute batch commands as a single history entry', () => {
      const commands = [
        jest.fn(),
        jest.fn(),
        jest.fn()
      ]

      const batchCommand = historyManager.createBatchCommand(
        commands.map(fn => ({
          type: 'update',
          execute: fn,
          undo: jest.fn(),
          data: {}
        }))
      )

      historyManager.execute(batchCommand)

      commands.forEach(fn => {
        expect(fn).toHaveBeenCalledTimes(1)
      })

      // Should be treated as single history entry
      historyManager.undo()
      expect(historyManager.canUndo()).toBe(false)
    })

    it('should undo batch commands in reverse order', () => {
      const undoOrder: number[] = []
      
      const batchCommand = historyManager.createBatchCommand([
        {
          type: 'update',
          execute: jest.fn(),
          undo: () => undoOrder.push(1),
          data: {}
        },
        {
          type: 'update',
          execute: jest.fn(),
          undo: () => undoOrder.push(2),
          data: {}
        },
        {
          type: 'update',
          execute: jest.fn(),
          undo: () => undoOrder.push(3),
          data: {}
        }
      ])

      historyManager.execute(batchCommand)
      historyManager.undo()

      expect(undoOrder).toEqual([3, 2, 1]) // Reverse order
    })
  })

  describe('Clear History', () => {
    it('should clear all history', () => {
      for (let i = 0; i < 5; i++) {
        const command = historyManager.createCommand({
          type: 'create',
          execute: jest.fn(),
          undo: jest.fn(),
          data: {}
        })
        historyManager.execute(command)
      }

      historyManager.undo()
      historyManager.undo()

      expect(historyManager.canUndo()).toBe(true)
      expect(historyManager.canRedo()).toBe(true)

      historyManager.clear()

      expect(historyManager.canUndo()).toBe(false)
      expect(historyManager.canRedo()).toBe(false)
    })
  })

  describe('History State', () => {
    it('should get current history state', () => {
      const command1 = historyManager.createCommand({
        type: 'create',
        execute: jest.fn(),
        undo: jest.fn(),
        data: { elementId: 'element-1' }
      })

      const command2 = historyManager.createCommand({
        type: 'update',
        execute: jest.fn(),
        undo: jest.fn(),
        data: { elementId: 'element-2' }
      })

      historyManager.execute(command1)
      historyManager.execute(command2)
      historyManager.undo()

      const state = historyManager.getState()

      expect(state.historySize).toBe(2)
      expect(state.currentIndex).toBe(0) // After one undo
      expect(state.canUndo).toBe(true)
      expect(state.canRedo).toBe(true)
    })

    it('should provide history summary', () => {
      const commands = ['create', 'update', 'delete', 'update', 'create']
      
      commands.forEach(type => {
        const command = historyManager.createCommand({
          type: type as any,
          execute: jest.fn(),
          undo: jest.fn(),
          data: {}
        })
        historyManager.execute(command)
      })

      const summary = historyManager.getHistorySummary()

      expect(summary).toHaveLength(5)
      expect(summary[0].type).toBe('create')
      expect(summary[4].type).toBe('create')
    })
  })

  describe('Command Merging', () => {
    it('should merge consecutive similar commands', () => {
      const command1 = historyManager.createCommand({
        type: 'update',
        execute: jest.fn(),
        undo: jest.fn(),
        data: { elementId: 'element-1', position: { x: 100, y: 100 } },
        canMerge: true
      })

      const command2 = historyManager.createCommand({
        type: 'update',
        execute: jest.fn(),
        undo: jest.fn(),
        data: { elementId: 'element-1', position: { x: 200, y: 200 } },
        canMerge: true
      })

      historyManager.execute(command1)
      historyManager.execute(command2)

      // Should have merged into single command
      const state = historyManager.getState()
      expect(state.historySize).toBe(1) // Merged into one
    })

    it('should not merge different command types', () => {
      const command1 = historyManager.createCommand({
        type: 'create',
        execute: jest.fn(),
        undo: jest.fn(),
        data: { elementId: 'element-1' },
        canMerge: true
      })

      const command2 = historyManager.createCommand({
        type: 'delete',
        execute: jest.fn(),
        undo: jest.fn(),
        data: { elementId: 'element-1' },
        canMerge: true
      })

      historyManager.execute(command1)
      historyManager.execute(command2)

      const state = historyManager.getState()
      expect(state.historySize).toBe(2) // Not merged
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should handle keyboard shortcuts for undo/redo', () => {
      const command = historyManager.createCommand({
        type: 'create',
        execute: jest.fn(),
        undo: jest.fn(),
        data: {}
      })

      historyManager.execute(command)

      // Simulate Ctrl+Z
      const undoShortcut = historyManager.handleKeyboardShortcut('ctrl+z')
      expect(undoShortcut).toBe(true)
      expect(historyManager.canRedo()).toBe(true)

      // Simulate Ctrl+Y
      const redoShortcut = historyManager.handleKeyboardShortcut('ctrl+y')
      expect(redoShortcut).toBe(true)
      expect(historyManager.canRedo()).toBe(false)

      // Simulate Ctrl+Shift+Z (alternative redo)
      historyManager.undo()
      const altRedoShortcut = historyManager.handleKeyboardShortcut('ctrl+shift+z')
      expect(altRedoShortcut).toBe(true)
      expect(historyManager.canRedo()).toBe(false)
    })

    it('should handle Mac keyboard shortcuts', () => {
      const command = historyManager.createCommand({
        type: 'create',
        execute: jest.fn(),
        undo: jest.fn(),
        data: {}
      })

      historyManager.execute(command)

      // Simulate Cmd+Z
      const undoShortcut = historyManager.handleKeyboardShortcut('cmd+z')
      expect(undoShortcut).toBe(true)

      // Simulate Cmd+Shift+Z
      const redoShortcut = historyManager.handleKeyboardShortcut('cmd+shift+z')
      expect(redoShortcut).toBe(true)
    })
  })
})