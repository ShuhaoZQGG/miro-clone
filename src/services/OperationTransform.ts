export interface Operation {
  id: string
  type: 'create' | 'update' | 'delete' | 'move'
  elementId?: string
  element?: any
  oldState?: any
  newState?: any
  timestamp: number
  userId: string
}

export interface TransformResult {
  op1: Operation | null
  op2: Operation | null
}

export interface ConflictResult {
  winner: Operation
  loser: Operation
}

export class OperationTransform {
  private operationQueue: Operation[] = []
  private operationHistory: Operation[] = []
  private readonly MAX_HISTORY_SIZE = 100

  transform(op1: Operation, op2: Operation): TransformResult {
    const key = `${op1.type}-${op2.type}`
    
    switch (key) {
      case 'create-create':
        return { op1, op2 }
      
      case 'create-update':
        return { op1, op2 }
      
      case 'create-delete':
        return { op1, op2: null }
      
      case 'update-create':
        return { op1, op2 }
      
      case 'update-update':
        if (op1.elementId === op2.elementId) {
          return {
            op1: null,
            op2: { ...op2, oldState: op1.newState }
          }
        }
        return { op1, op2 }
      
      case 'update-delete':
        if (op1.elementId === op2.elementId) {
          return { op1: null, op2 }
        }
        return { op1, op2 }
      
      case 'update-move':
        if (op1.elementId === op2.elementId) {
          return {
            op1,
            op2: { ...op2, oldState: { ...op2.oldState, ...op1.newState } }
          }
        }
        return { op1, op2 }
      
      case 'delete-create':
        return { op1, op2 }
      
      case 'delete-update':
        if (op1.elementId === op2.elementId) {
          return { op1, op2: null }
        }
        return { op1, op2 }
      
      case 'delete-delete':
        if (op1.elementId === op2.elementId) {
          return { op1: null, op2: null }
        }
        return { op1, op2 }
      
      case 'delete-move':
        if (op1.elementId === op2.elementId) {
          return { op1, op2: null }
        }
        return { op1, op2 }
      
      case 'move-create':
        return { op1, op2 }
      
      case 'move-update':
        if (op1.elementId === op2.elementId) {
          return {
            op1,
            op2: { ...op2, oldState: { ...op2.oldState, ...op1.newState } }
          }
        }
        return { op1, op2 }
      
      case 'move-delete':
        if (op1.elementId === op2.elementId) {
          return { op1: null, op2 }
        }
        return { op1, op2 }
      
      case 'move-move':
        if (op1.elementId === op2.elementId) {
          return {
            op1: null,
            op2: { ...op2, oldState: op1.newState }
          }
        }
        return { op1, op2 }
      
      default:
        return { op1, op2 }
    }
  }

  addToQueue(operation: Operation): void {
    this.operationQueue.push(operation)
  }

  processQueue(): Operation[] {
    if (this.operationQueue.length === 0) return []

    const processed: Operation[] = []
    const queue = [...this.operationQueue]
    this.operationQueue = []

    for (let i = 0; i < queue.length; i++) {
      let currentOp: Operation | null = queue[i]
      
      for (let j = i + 1; j < queue.length; j++) {
        if (currentOp === null) break
        
        const nextOp = queue[j]
        const result = this.transform(currentOp, nextOp)
        
        currentOp = result.op1
        queue[j] = result.op2 as Operation
      }
      
      if (currentOp !== null) {
        processed.push(currentOp)
        this.addToHistory(currentOp)
      }
    }

    return processed.filter(op => op !== null)
  }

  clearQueue(): void {
    this.operationQueue = []
  }

  getQueueSize(): number {
    return this.operationQueue.length
  }

  resolveConflict(op1: Operation, op2: Operation): ConflictResult {
    if (op1.timestamp > op2.timestamp) {
      return { winner: op1, loser: op2 }
    }
    return { winner: op2, loser: op1 }
  }

  mergeOperations(op1: Operation, op2: Operation): Operation {
    if (op1.elementId !== op2.elementId || op1.type !== 'update' || op2.type !== 'update') {
      return op2
    }

    return {
      ...op2,
      newState: {
        ...op1.newState,
        ...op2.newState
      }
    }
  }

  addToHistory(operation: Operation): void {
    this.operationHistory.push(operation)
    
    if (this.operationHistory.length > this.MAX_HISTORY_SIZE) {
      this.operationHistory = this.operationHistory.slice(-this.MAX_HISTORY_SIZE)
    }
  }

  getHistory(): Operation[] {
    return [...this.operationHistory]
  }

  getHistorySize(): number {
    return this.operationHistory.length
  }

  clearHistory(): void {
    this.operationHistory = []
  }

  getOperationsSince(timestamp: number): Operation[] {
    return this.operationHistory.filter(op => op.timestamp > timestamp)
  }

  applyOperations(operations: Operation[], currentState: any): any {
    const state = { ...currentState }

    for (const op of operations) {
      switch (op.type) {
        case 'create':
          if (op.element) {
            state[op.element.id] = op.element
          }
          break
        
        case 'update':
          if (op.elementId && state[op.elementId]) {
            state[op.elementId] = {
              ...state[op.elementId],
              ...op.newState
            }
          }
          break
        
        case 'delete':
          if (op.elementId) {
            delete state[op.elementId]
          }
          break
        
        case 'move':
          if (op.elementId && state[op.elementId]) {
            state[op.elementId] = {
              ...state[op.elementId],
              ...op.newState
            }
          }
          break
      }
    }

    return state
  }
}