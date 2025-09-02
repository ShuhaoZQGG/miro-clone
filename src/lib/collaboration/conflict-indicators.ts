import { CanvasElement } from '@/types'

interface ConflictOptions {
  timeout?: number // Auto-clear timeout in milliseconds
}

interface ConflictIndicatorData {
  type: 'conflict-indicator'
  elementBounds: {
    x: number
    y: number
    width: number
    height: number
  }
  users: string[]
  severity: 'low' | 'high'
  color: string
}

interface EditingRecord {
  userId: string
  timestamp: number
}

export class ConflictIndicator {
  private editingMap: Map<string, EditingRecord[]> = new Map()
  private timeout: number
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor(options: ConflictOptions = {}) {
    this.timeout = options.timeout || 30000 // Default 30 seconds
    this.startCleanupTimer()
  }

  /**
   * Start editing an element
   */
  startEditing(elementId: string, userId: string): void {
    const records = this.editingMap.get(elementId) || []
    
    // Remove existing record for this user if any
    const filteredRecords = records.filter(r => r.userId !== userId)
    
    // Add new record
    filteredRecords.push({
      userId,
      timestamp: Date.now()
    })
    
    this.editingMap.set(elementId, filteredRecords)
  }

  /**
   * Stop editing an element
   */
  stopEditing(elementId: string, userId: string): void {
    const records = this.editingMap.get(elementId)
    if (!records) return
    
    const filteredRecords = records.filter(r => r.userId !== userId)
    
    if (filteredRecords.length === 0) {
      this.editingMap.delete(elementId)
    } else {
      this.editingMap.set(elementId, filteredRecords)
    }
  }

  /**
   * Detect if there's a conflict for an element
   */
  detectConflict(elementId: string, userId: string): boolean {
    const records = this.editingMap.get(elementId)
    if (!records || records.length === 0) return false
    
    // Check if other users are editing
    return records.some(r => r.userId !== userId)
  }

  /**
   * Get list of users editing an element
   */
  getConflictingUsers(elementId: string): string[] {
    const records = this.editingMap.get(elementId)
    if (!records) return []
    
    return records.map(r => r.userId)
  }

  /**
   * Create visual indicator for conflicted element
   */
  renderIndicator(element: CanvasElement, users: string[]): ConflictIndicatorData {
    const userCount = users.length
    const severity = userCount > 2 ? 'high' : 'low'
    const color = severity === 'high' ? '#FF0000' : '#FFA500'
    
    return {
      type: 'conflict-indicator',
      elementBounds: {
        x: element.position.x,
        y: element.position.y,
        width: element.size.width,
        height: element.size.height
      },
      users,
      severity,
      color
    }
  }

  /**
   * Clear all conflict tracking
   */
  clearAll(): void {
    this.editingMap.clear()
  }

  /**
   * Start cleanup timer to remove stale conflicts
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupStaleConflicts()
    }, 5000) // Check every 5 seconds
  }

  /**
   * Remove conflicts that have exceeded timeout
   */
  private cleanupStaleConflicts(): void {
    const now = Date.now()
    
    for (const [elementId, records] of this.editingMap.entries()) {
      const activeRecords = records.filter(r => {
        return (now - r.timestamp) < this.timeout
      })
      
      if (activeRecords.length === 0) {
        this.editingMap.delete(elementId)
      } else if (activeRecords.length !== records.length) {
        this.editingMap.set(elementId, activeRecords)
      }
    }
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.clearAll()
  }
}