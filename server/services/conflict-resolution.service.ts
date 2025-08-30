// Operation Transformation (OT) for conflict resolution
// This implements a simplified OT algorithm for collaborative editing

export interface Operation {
  id: string
  type: 'create' | 'update' | 'delete' | 'move' | 'resize' | 'style'
  elementId?: string
  userId: string
  timestamp: number
  sequence: number
  data: any
  boardId: string
}

export interface TransformResult {
  operation1: Operation | null
  operation2: Operation | null
}

export class ConflictResolver {
  private operationHistory: Map<string, Operation[]> = new Map()
  private sequenceNumbers: Map<string, number> = new Map()

  // Transform two concurrent operations
  transform(op1: Operation, op2: Operation): TransformResult {
    // If operations are on different elements, no transformation needed
    if (op1.elementId !== op2.elementId) {
      return { operation1: op1, operation2: op2 }
    }

    // Handle transformations based on operation types
    if (op1.type === 'delete' && op2.type === 'delete') {
      // Both trying to delete same element - only one succeeds
      return { operation1: null, operation2: null }
    }

    if (op1.type === 'delete') {
      // op1 deletes, op2 does something else - op2 becomes no-op
      return { operation1: op1, operation2: null }
    }

    if (op2.type === 'delete') {
      // op2 deletes, op1 does something else - op1 becomes no-op
      return { operation1: null, operation2: op2 }
    }

    if (op1.type === 'move' && op2.type === 'move') {
      // Both moving - use timestamp to determine winner
      if (op1.timestamp < op2.timestamp) {
        return { operation1: op1, operation2: null }
      } else {
        return { operation1: null, operation2: op2 }
      }
    }

    if (op1.type === 'update' && op2.type === 'update') {
      // Both updating - merge changes if possible
      const merged = this.mergeUpdates(op1, op2)
      return { operation1: merged, operation2: null }
    }

    if (op1.type === 'resize' && op2.type === 'resize') {
      // Both resizing - use timestamp to determine winner
      if (op1.timestamp < op2.timestamp) {
        return { operation1: op1, operation2: null }
      } else {
        return { operation1: null, operation2: op2 }
      }
    }

    // Default: both operations can proceed
    return { operation1: op1, operation2: op2 }
  }

  // Merge two update operations
  private mergeUpdates(op1: Operation, op2: Operation): Operation {
    const mergedData = { ...op1.data }
    
    // Iterate through op2 data and merge non-conflicting properties
    for (const key in op2.data) {
      if (!(key in op1.data) || op1.timestamp > op2.timestamp) {
        mergedData[key] = op2.data[key]
      }
    }

    return {
      ...op1,
      data: mergedData,
      timestamp: Math.max(op1.timestamp, op2.timestamp),
    }
  }

  // Apply an operation to the board state
  applyOperation(boardState: any, operation: Operation): any {
    const newState = { ...boardState }

    switch (operation.type) {
      case 'create':
        if (!newState.elements) {
          newState.elements = []
        }
        newState.elements.push({
          id: operation.elementId,
          ...operation.data,
        })
        break

      case 'update':
        if (newState.elements) {
          const index = newState.elements.findIndex(
            (el: any) => el.id === operation.elementId
          )
          if (index !== -1) {
            newState.elements[index] = {
              ...newState.elements[index],
              ...operation.data,
            }
          }
        }
        break

      case 'delete':
        if (newState.elements) {
          newState.elements = newState.elements.filter(
            (el: any) => el.id !== operation.elementId
          )
        }
        break

      case 'move':
        if (newState.elements) {
          const index = newState.elements.findIndex(
            (el: any) => el.id === operation.elementId
          )
          if (index !== -1) {
            newState.elements[index].position = operation.data.position
          }
        }
        break

      case 'resize':
        if (newState.elements) {
          const index = newState.elements.findIndex(
            (el: any) => el.id === operation.elementId
          )
          if (index !== -1) {
            newState.elements[index].dimensions = operation.data.dimensions
          }
        }
        break

      case 'style':
        if (newState.elements) {
          const index = newState.elements.findIndex(
            (el: any) => el.id === operation.elementId
          )
          if (index !== -1) {
            newState.elements[index].style = {
              ...newState.elements[index].style,
              ...operation.data.style,
            }
          }
        }
        break
    }

    return newState
  }

  // Get the next sequence number for a board
  getNextSequence(boardId: string): number {
    const current = this.sequenceNumbers.get(boardId) || 0
    const next = current + 1
    this.sequenceNumbers.set(boardId, next)
    return next
  }

  // Add operation to history
  addToHistory(operation: Operation) {
    const boardHistory = this.operationHistory.get(operation.boardId) || []
    boardHistory.push(operation)
    
    // Keep only last 1000 operations per board
    if (boardHistory.length > 1000) {
      boardHistory.shift()
    }
    
    this.operationHistory.set(operation.boardId, boardHistory)
  }

  // Get operations since a specific sequence number
  getOperationsSince(boardId: string, sinceSequence: number): Operation[] {
    const history = this.operationHistory.get(boardId) || []
    return history.filter(op => op.sequence > sinceSequence)
  }

  // Resolve conflicts for a batch of operations
  resolveConflicts(
    localOps: Operation[],
    remoteOps: Operation[]
  ): { toApply: Operation[]; toSend: Operation[] } {
    const toApply: Operation[] = []
    const toSend: Operation[] = []

    // Sort operations by sequence number
    localOps.sort((a, b) => a.sequence - b.sequence)
    remoteOps.sort((a, b) => a.sequence - b.sequence)

    // Transform each local operation against all remote operations
    for (const localOp of localOps) {
      let transformedLocal: Operation | null = localOp

      for (const remoteOp of remoteOps) {
        if (transformedLocal) {
          const result = this.transform(transformedLocal, remoteOp)
          transformedLocal = result.operation1
        }
      }

      if (transformedLocal) {
        toSend.push(transformedLocal)
      }
    }

    // Transform each remote operation against all local operations
    for (const remoteOp of remoteOps) {
      let transformedRemote: Operation | null = remoteOp

      for (const localOp of localOps) {
        if (transformedRemote) {
          const result = this.transform(localOp, transformedRemote)
          transformedRemote = result.operation2
        }
      }

      if (transformedRemote) {
        toApply.push(transformedRemote)
      }
    }

    return { toApply, toSend }
  }

  // Clear history for a board
  clearBoardHistory(boardId: string) {
    this.operationHistory.delete(boardId)
    this.sequenceNumbers.delete(boardId)
  }
}

// Vector Clock for distributed consistency
export class VectorClock {
  private clocks: Map<string, Map<string, number>> = new Map()

  // Increment clock for a user on a board
  increment(boardId: string, userId: string): Map<string, number> {
    if (!this.clocks.has(boardId)) {
      this.clocks.set(boardId, new Map())
    }

    const boardClock = this.clocks.get(boardId)!
    const current = boardClock.get(userId) || 0
    boardClock.set(userId, current + 1)

    return new Map(boardClock)
  }

  // Update clock with received vector
  update(boardId: string, receivedClock: Map<string, number>) {
    if (!this.clocks.has(boardId)) {
      this.clocks.set(boardId, new Map())
    }

    const boardClock = this.clocks.get(boardId)!

    for (const [userId, timestamp] of receivedClock) {
      const current = boardClock.get(userId) || 0
      boardClock.set(userId, Math.max(current, timestamp))
    }
  }

  // Check if one clock happens before another
  happensBefore(
    boardId: string,
    clock1: Map<string, number>,
    clock2: Map<string, number>
  ): boolean {
    let atLeastOneLess = false
    
    for (const [userId, time1] of clock1) {
      const time2 = clock2.get(userId) || 0
      if (time1 > time2) {
        return false
      }
      if (time1 < time2) {
        atLeastOneLess = true
      }
    }

    // Check for users in clock2 but not in clock1
    for (const userId of clock2.keys()) {
      if (!clock1.has(userId) && clock2.get(userId)! > 0) {
        atLeastOneLess = true
      }
    }

    return atLeastOneLess
  }

  // Check if two clocks are concurrent (neither happens before the other)
  areConcurrent(
    boardId: string,
    clock1: Map<string, number>,
    clock2: Map<string, number>
  ): boolean {
    return !this.happensBefore(boardId, clock1, clock2) &&
           !this.happensBefore(boardId, clock2, clock1)
  }

  // Get current clock for a board
  getClock(boardId: string): Map<string, number> {
    return new Map(this.clocks.get(boardId) || new Map())
  }

  // Clear clock for a board
  clearBoardClock(boardId: string) {
    this.clocks.delete(boardId)
  }
}

// Singleton instances
export const conflictResolver = new ConflictResolver()
export const vectorClock = new VectorClock()

// CRDT-based Last-Write-Wins Element Set
export class LWWElementSet {
  private addSet: Map<string, { element: any; timestamp: number }> = new Map()
  private removeSet: Map<string, number> = new Map()

  // Add an element
  add(elementId: string, element: any, timestamp: number) {
    const existing = this.addSet.get(elementId)
    
    if (!existing || existing.timestamp < timestamp) {
      this.addSet.set(elementId, { element, timestamp })
    }
  }

  // Remove an element
  remove(elementId: string, timestamp: number) {
    const existing = this.removeSet.get(elementId)
    
    if (!existing || existing < timestamp) {
      this.removeSet.set(elementId, timestamp)
    }
  }

  // Check if element exists
  exists(elementId: string): boolean {
    const addTime = this.addSet.get(elementId)
    const removeTime = this.removeSet.get(elementId)

    if (!addTime) return false
    if (!removeTime) return true
    
    return addTime.timestamp > removeTime
  }

  // Get all existing elements
  getElements(): any[] {
    const elements = []
    
    for (const [elementId, data] of this.addSet) {
      if (this.exists(elementId)) {
        elements.push(data.element)
      }
    }
    
    return elements
  }

  // Merge with another LWW set
  merge(other: LWWElementSet) {
    // Merge add sets
    for (const [elementId, data] of other.addSet) {
      this.add(elementId, data.element, data.timestamp)
    }

    // Merge remove sets
    for (const [elementId, timestamp] of other.removeSet) {
      this.remove(elementId, timestamp)
    }
  }

  // Get state for synchronization
  getState() {
    return {
      addSet: Array.from(this.addSet.entries()),
      removeSet: Array.from(this.removeSet.entries()),
    }
  }

  // Load state from synchronization
  setState(state: { addSet: [string, any][]; removeSet: [string, number][] }) {
    this.addSet = new Map(state.addSet)
    this.removeSet = new Map(state.removeSet)
  }
}

export default {
  conflictResolver,
  vectorClock,
  LWWElementSet,
}