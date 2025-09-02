import { CursorPosition, UserCursor, RenderedCursor, CursorMessage } from './types'

interface CursorSyncOptions {
  broadcast: (message: CursorMessage) => void
  smoothing?: boolean
  throttleMs?: number
  showTrail?: boolean
  trailLength?: number
}

interface CursorState extends UserCursor {
  trail: CursorPosition[]
  targetPosition?: CursorPosition
  lastBroadcast?: number
}

export class CursorSync {
  private remoteCursors: Map<string, CursorState> = new Map()
  private localCursorState: CursorState | null = null
  private options: Required<CursorSyncOptions>
  private throttleTimer: NodeJS.Timeout | null = null
  private animationFrame: number | null = null
  private lastLocalPosition: CursorPosition | null = null

  constructor(options: CursorSyncOptions) {
    this.options = {
      broadcast: options.broadcast,
      smoothing: options.smoothing ?? true,
      throttleMs: options.throttleMs ?? 50,
      showTrail: options.showTrail ?? false,
      trailLength: options.trailLength ?? 10
    }

    if (this.options.smoothing) {
      this.startAnimationLoop()
    }
  }

  /**
   * Update local cursor position and broadcast
   */
  updateLocalCursor(userId: string, position: CursorPosition): void {
    this.lastLocalPosition = position

    // Throttle broadcasts
    if (this.throttleTimer) {
      return
    }

    this.broadcastCursorPosition(userId, position)

    this.throttleTimer = setTimeout(() => {
      this.throttleTimer = null
      if (this.lastLocalPosition && 
          (this.lastLocalPosition.x !== position.x || 
           this.lastLocalPosition.y !== position.y)) {
        this.broadcastCursorPosition(userId, this.lastLocalPosition)
      }
    }, this.options.throttleMs)
  }

  /**
   * Broadcast cursor position
   */
  private broadcastCursorPosition(userId: string, position: CursorPosition): void {
    this.options.broadcast({
      type: 'cursor-move',
      userId,
      position
    })
  }

  /**
   * Update remote cursor position
   */
  updateRemoteCursor(cursor: UserCursor): void {
    const existing = this.remoteCursors.get(cursor.userId)
    
    const trail = existing?.trail || []
    if (this.options.showTrail) {
      trail.push(cursor.position)
      if (trail.length > this.options.trailLength) {
        trail.shift()
      }
    }

    const cursorState: CursorState = {
      ...cursor,
      trail,
      targetPosition: cursor.position
    }

    if (this.options.smoothing && existing) {
      // Keep current position for smooth interpolation
      cursorState.position = existing.position
    }

    this.remoteCursors.set(cursor.userId, cursorState)
  }

  /**
   * Remove remote cursor
   */
  removeRemoteCursor(userId: string): void {
    this.remoteCursors.delete(userId)
  }

  /**
   * Get specific remote cursor
   */
  getRemoteCursor(userId: string): UserCursor | undefined {
    const state = this.remoteCursors.get(userId)
    if (!state) return undefined

    return {
      userId: state.userId,
      position: state.position,
      color: state.color,
      name: state.name
    }
  }

  /**
   * Get all remote cursors
   */
  getAllRemoteCursors(): UserCursor[] {
    return Array.from(this.remoteCursors.values()).map(state => ({
      userId: state.userId,
      position: state.position,
      color: state.color,
      name: state.name
    }))
  }

  /**
   * Get smoothed position for a cursor
   */
  getSmoothedPosition(userId: string): CursorPosition {
    const state = this.remoteCursors.get(userId)
    if (!state) {
      return { x: 0, y: 0, timestamp: Date.now() }
    }

    if (!this.options.smoothing || !state.targetPosition) {
      return state.position
    }

    // Linear interpolation
    const alpha = 0.2 // Smoothing factor
    const smoothed: CursorPosition = {
      x: state.position.x + (state.targetPosition.x - state.position.x) * alpha,
      y: state.position.y + (state.targetPosition.y - state.position.y) * alpha,
      timestamp: Date.now()
    }

    return smoothed
  }

  /**
   * Render cursor visual
   */
  renderCursor(userId: string): RenderedCursor | null {
    const state = this.remoteCursors.get(userId)
    if (!state) return null

    const position = this.options.smoothing 
      ? this.getSmoothedPosition(userId)
      : state.position

    const rendered: RenderedCursor = {
      type: 'cursor',
      position,
      color: state.color,
      label: state.name
    }

    if (this.options.showTrail && state.trail.length > 0) {
      rendered.trail = [...state.trail]
    }

    return rendered
  }

  /**
   * Start animation loop for smooth cursor movement
   */
  private startAnimationLoop(): void {
    const animate = () => {
      // Update smoothed positions
      for (const [userId, state] of this.remoteCursors.entries()) {
        if (state.targetPosition) {
          const smoothed = this.getSmoothedPosition(userId)
          state.position = smoothed

          // Check if reached target
          const dx = Math.abs(smoothed.x - state.targetPosition.x)
          const dy = Math.abs(smoothed.y - state.targetPosition.y)
          if (dx < 1 && dy < 1) {
            state.position = state.targetPosition
            state.targetPosition = undefined
          }
        }
      }

      this.animationFrame = requestAnimationFrame(animate)
    }

    this.animationFrame = requestAnimationFrame(animate)
  }

  /**
   * Clear all remote cursors
   */
  clearAll(): void {
    this.remoteCursors.clear()
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer)
      this.throttleTimer = null
    }

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }

    this.clearAll()
  }
}