import { CanvasElement } from '@/types'

export interface Command {
  type: 'create' | 'update' | 'delete' | 'batch'
  execute: () => void
  undo: () => void
  data?: any
  canMerge?: boolean
  timestamp?: string
}

export interface ElementCommand extends Command {
  elementId?: string
  element?: Partial<CanvasElement>
  oldState?: any
  newState?: any
}

export interface BatchCommand extends Command {
  commands: Command[]
}

export interface HistoryState {
  historySize: number
  currentIndex: number
  canUndo: boolean
  canRedo: boolean
}

export interface HistorySummary {
  type: string
  timestamp: string
  data?: any
}

export class HistoryManager {
  private history: Command[] = []
  private currentIndex = -1
  private maxHistorySize = 100
  private isExecuting = false

  constructor(maxSize?: number) {
    if (maxSize) {
      this.maxHistorySize = maxSize
    }
  }

  /**
   * Execute a command and add it to history
   */
  execute(command: Command): void {
    if (this.isExecuting) return

    this.isExecuting = true
    
    try {
      // Check if we can merge with the previous command
      if (command.canMerge && this.currentIndex >= 0) {
        const lastCommand = this.history[this.currentIndex]
        if (this.canMergeCommands(lastCommand, command)) {
          // Merge commands
          this.mergeCommands(lastCommand, command)
          command.execute()
          this.isExecuting = false
          return
        }
      }

      // Execute the command
      command.execute()
      
      // Add timestamp
      command.timestamp = new Date().toISOString()
      
      // Clear redo history if we're not at the end
      if (this.currentIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.currentIndex + 1)
      }
      
      // Add command to history
      this.history.push(command)
      this.currentIndex++
      
      // Limit history size
      if (this.history.length > this.maxHistorySize) {
        this.history.shift()
        this.currentIndex--
      }
    } finally {
      this.isExecuting = false
    }
  }

  /**
   * Undo the last command
   */
  undo(): boolean {
    if (!this.canUndo()) return false
    
    const command = this.history[this.currentIndex]
    command.undo()
    this.currentIndex--
    
    return true
  }

  /**
   * Redo the last undone command
   */
  redo(): boolean {
    if (!this.canRedo()) return false
    
    this.currentIndex++
    const command = this.history[this.currentIndex]
    command.execute()
    
    return true
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.currentIndex >= 0
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.history = []
    this.currentIndex = -1
  }

  /**
   * Get current history state
   */
  getState(): HistoryState {
    return {
      historySize: this.history.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }
  }

  /**
   * Get history summary
   */
  getHistorySummary(): HistorySummary[] {
    return this.history.map(cmd => ({
      type: cmd.type,
      timestamp: cmd.timestamp || '',
      data: cmd.data
    }))
  }

  /**
   * Create a standard command
   */
  createCommand(options: {
    type: Command['type']
    execute: () => void
    undo: () => void
    data?: any
    canMerge?: boolean
  }): Command {
    return {
      type: options.type,
      execute: options.execute,
      undo: options.undo,
      data: options.data,
      canMerge: options.canMerge
    }
  }

  /**
   * Create an element command
   */
  createElementCommand(
    type: 'create' | 'update' | 'delete',
    options: {
      elementId?: string
      element?: Partial<CanvasElement>
      oldState?: any
      newState?: any
      onExecute: (arg?: any) => void
      onUndo: (arg?: any) => void
    }
  ): ElementCommand {
    const command: ElementCommand = {
      type,
      elementId: options.elementId,
      element: options.element,
      oldState: options.oldState,
      newState: options.newState,
      execute: () => {
        if (type === 'create') {
          options.onExecute(options.element)
        } else if (type === 'update') {
          options.onExecute(options.elementId, options.newState)
        } else if (type === 'delete') {
          options.onExecute(options.elementId || options.element?.id)
        }
      },
      undo: () => {
        if (type === 'create') {
          options.onUndo(options.element?.id)
        } else if (type === 'update') {
          options.onUndo(options.elementId, options.oldState)
        } else if (type === 'delete') {
          options.onUndo(options.element)
        }
      }
    }
    
    return command
  }

  /**
   * Create a batch command
   */
  createBatchCommand(commands: Command[]): BatchCommand {
    return {
      type: 'batch',
      commands,
      execute: () => {
        commands.forEach(cmd => cmd.execute())
      },
      undo: () => {
        // Undo in reverse order
        for (let i = commands.length - 1; i >= 0; i--) {
          commands[i].undo()
        }
      }
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcut(shortcut: string): boolean {
    const normalizedShortcut = shortcut.toLowerCase().replace('cmd', 'ctrl')
    
    if (normalizedShortcut === 'ctrl+z') {
      return this.undo()
    } else if (normalizedShortcut === 'ctrl+y' || normalizedShortcut === 'ctrl+shift+z') {
      return this.redo()
    }
    
    return false
  }

  /**
   * Check if two commands can be merged
   */
  private canMergeCommands(cmd1: Command, cmd2: Command): boolean {
    if (!cmd1.canMerge || !cmd2.canMerge) return false
    if (cmd1.type !== cmd2.type) return false
    
    // Check if they're both update commands for the same element
    if (cmd1.type === 'update' && cmd2.type === 'update') {
      const elem1 = cmd1 as ElementCommand
      const elem2 = cmd2 as ElementCommand
      
      // Check if both commands operate on the same element
      // Either via elementId field or data.elementId
      const elem1Id = elem1.elementId || elem1.data?.elementId
      const elem2Id = elem2.elementId || elem2.data?.elementId
      
      if (elem1Id && elem2Id && elem1Id === elem2Id) {
        return true
      }
    }
    
    return false
  }

  /**
   * Merge two commands
   */
  private mergeCommands(target: Command, source: Command): void {
    if (target.type === 'update' && source.type === 'update') {
      const targetCmd = target as ElementCommand
      const sourceCmd = source as ElementCommand
      
      // Keep the old state from target, use new state from source
      targetCmd.newState = sourceCmd.newState
      
      // Update execute function to use the new state
      const originalExecute = targetCmd.execute
      targetCmd.execute = () => {
        sourceCmd.execute()
      }
    }
  }

  /**
   * Get undo/redo counts
   */
  getUndoRedoCounts(): { undoCount: number; redoCount: number } {
    return {
      undoCount: this.currentIndex + 1,
      redoCount: this.history.length - this.currentIndex - 1
    }
  }
}