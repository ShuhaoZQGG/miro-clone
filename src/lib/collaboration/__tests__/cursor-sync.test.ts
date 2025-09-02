import { CursorSync } from '../cursor-sync'
import { CursorPosition, UserCursor } from '../types'

describe('CursorSync', () => {
  let cursorSync: CursorSync
  let mockBroadcast: jest.Mock

  beforeEach(() => {
    mockBroadcast = jest.fn()
    cursorSync = new CursorSync({
      broadcast: mockBroadcast,
      smoothing: true,
      throttleMs: 50
    })
  })

  afterEach(() => {
    cursorSync.dispose()
  })

  describe('updateLocalCursor', () => {
    it('should broadcast cursor position', () => {
      const position: CursorPosition = {
        x: 100,
        y: 200,
        timestamp: Date.now()
      }

      cursorSync.updateLocalCursor('user-1', position)

      expect(mockBroadcast).toHaveBeenCalledWith({
        type: 'cursor-move',
        userId: 'user-1',
        position
      })
    })

    it('should throttle cursor updates', () => {
      jest.useFakeTimers()

      for (let i = 0; i < 10; i++) {
        cursorSync.updateLocalCursor('user-1', {
          x: 100 + i,
          y: 200 + i,
          timestamp: Date.now()
        })
      }

      // Should only broadcast once immediately
      expect(mockBroadcast).toHaveBeenCalledTimes(1)

      // Advance time past throttle
      jest.advanceTimersByTime(60)

      // Should have broadcast the last update
      expect(mockBroadcast).toHaveBeenCalledTimes(2)

      jest.useRealTimers()
    })
  })

  describe('updateRemoteCursor', () => {
    it('should store remote cursor position', () => {
      const cursor: UserCursor = {
        userId: 'user-2',
        position: { x: 150, y: 250, timestamp: Date.now() },
        color: '#00FF00',
        name: 'John Doe'
      }

      cursorSync.updateRemoteCursor(cursor)
      
      const remoteCursor = cursorSync.getRemoteCursor('user-2')
      expect(remoteCursor).toEqual(cursor)
    })

    it('should apply smoothing to remote cursors', () => {
      const position1: CursorPosition = { x: 100, y: 100, timestamp: Date.now() }
      const position2: CursorPosition = { x: 200, y: 200, timestamp: Date.now() + 100 }

      cursorSync.updateRemoteCursor({
        userId: 'user-2',
        position: position1,
        color: '#00FF00',
        name: 'John'
      })

      cursorSync.updateRemoteCursor({
        userId: 'user-2',
        position: position2,
        color: '#00FF00',
        name: 'John'
      })

      const smoothed = cursorSync.getSmoothedPosition('user-2')
      
      // Should be interpolating between positions
      expect(smoothed.x).toBeGreaterThan(position1.x)
      expect(smoothed.x).toBeLessThanOrEqual(position2.x)
      expect(smoothed.y).toBeGreaterThan(position1.y)
      expect(smoothed.y).toBeLessThanOrEqual(position2.y)
    })
  })

  describe('removeRemoteCursor', () => {
    it('should remove cursor when user disconnects', () => {
      cursorSync.updateRemoteCursor({
        userId: 'user-2',
        position: { x: 150, y: 250, timestamp: Date.now() },
        color: '#00FF00',
        name: 'John'
      })

      cursorSync.removeRemoteCursor('user-2')
      
      const remoteCursor = cursorSync.getRemoteCursor('user-2')
      expect(remoteCursor).toBeUndefined()
    })
  })

  describe('getAllRemoteCursors', () => {
    it('should return all active remote cursors', () => {
      cursorSync.updateRemoteCursor({
        userId: 'user-2',
        position: { x: 150, y: 250, timestamp: Date.now() },
        color: '#00FF00',
        name: 'John'
      })

      cursorSync.updateRemoteCursor({
        userId: 'user-3',
        position: { x: 300, y: 400, timestamp: Date.now() },
        color: '#0000FF',
        name: 'Jane'
      })

      const allCursors = cursorSync.getAllRemoteCursors()
      expect(allCursors).toHaveLength(2)
      expect(allCursors.find(c => c.userId === 'user-2')).toBeDefined()
      expect(allCursors.find(c => c.userId === 'user-3')).toBeDefined()
    })
  })

  describe('renderCursor', () => {
    it('should create visual representation of cursor', () => {
      const cursor: UserCursor = {
        userId: 'user-2',
        position: { x: 150, y: 250, timestamp: Date.now() },
        color: '#00FF00',
        name: 'John Doe'
      }

      cursorSync.updateRemoteCursor(cursor)
      const rendered = cursorSync.renderCursor('user-2')

      expect(rendered).toBeDefined()
      expect(rendered?.type).toBe('cursor')
      expect(rendered?.position).toEqual(cursor.position)
      expect(rendered?.color).toBe('#00FF00')
      expect(rendered?.label).toBe('John Doe')
    })

    it('should include cursor trail when enabled', () => {
      cursorSync = new CursorSync({
        broadcast: mockBroadcast,
        smoothing: true,
        throttleMs: 50,
        showTrail: true
      })

      // Add multiple positions to create trail
      for (let i = 0; i < 5; i++) {
        cursorSync.updateRemoteCursor({
          userId: 'user-2',
          position: { x: 100 + i * 10, y: 100 + i * 10, timestamp: Date.now() + i * 100 },
          color: '#00FF00',
          name: 'John'
        })
      }

      const rendered = cursorSync.renderCursor('user-2')
      expect(rendered?.trail).toBeDefined()
      expect(rendered?.trail?.length).toBeGreaterThan(0)
    })
  })

  describe('interpolation', () => {
    it('should smoothly interpolate cursor positions', () => {
      jest.useFakeTimers()

      const pos1: CursorPosition = { x: 100, y: 100, timestamp: 0 }
      const pos2: CursorPosition = { x: 200, y: 200, timestamp: 100 }

      cursorSync.updateRemoteCursor({
        userId: 'user-2',
        position: pos1,
        color: '#00FF00',
        name: 'John'
      })

      jest.advanceTimersByTime(50)

      cursorSync.updateRemoteCursor({
        userId: 'user-2',
        position: pos2,
        color: '#00FF00',
        name: 'John'
      })

      const interpolated = cursorSync.getSmoothedPosition('user-2')
      
      // With alpha=0.2, should be 20% of the way from pos1 to pos2
      // x: 100 + (200-100) * 0.2 = 120
      // y: 100 + (200-100) * 0.2 = 120
      expect(interpolated.x).toBeCloseTo(120, 0)
      expect(interpolated.y).toBeCloseTo(120, 0)

      jest.useRealTimers()
    })
  })

  describe('clearAll', () => {
    it('should remove all remote cursors', () => {
      cursorSync.updateRemoteCursor({
        userId: 'user-2',
        position: { x: 150, y: 250, timestamp: Date.now() },
        color: '#00FF00',
        name: 'John'
      })

      cursorSync.updateRemoteCursor({
        userId: 'user-3',
        position: { x: 300, y: 400, timestamp: Date.now() },
        color: '#0000FF',
        name: 'Jane'
      })

      cursorSync.clearAll()
      
      const allCursors = cursorSync.getAllRemoteCursors()
      expect(allCursors).toHaveLength(0)
    })
  })
})