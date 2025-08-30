import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { authenticateSocket } from './middleware/authMiddleware'
import { setupCollaborationHandlers } from './handlers/collaborationHandlers'
import { applyRateLimiting, clearRateLimitForSocket } from './middleware/rateLimitMiddleware'
import { 
  boardService, 
  elementService, 
  collaborationService,
  realtimeService,
  activityService 
} from './services/database.service'
import { 
  conflictResolver, 
  vectorClock,
  Operation,
  LWWElementSet 
} from './services/conflict-resolution.service'

let io: SocketIOServer | undefined

// In-memory cache for active boards
const activeBoards = new Map<string, {
  lwwSet: LWWElementSet
  lastActivity: number
}>()

// User management
const users = new Map<string, {
  id: string
  name: string
  boardId: string
  cursor?: { x: number; y: number }
  color: string
  dbUserId?: string // Database user ID
}>()

// Generate random color for user cursor
function generateUserColor(): string {
  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
    '#10B981', '#EF4444', '#6366F1', '#14B8A6'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Clean up inactive boards from memory
setInterval(() => {
  const now = Date.now()
  const timeout = 30 * 60 * 1000 // 30 minutes
  
  for (const [boardId, board] of activeBoards) {
    if (now - board.lastActivity > timeout) {
      activeBoards.delete(boardId)
      conflictResolver.clearBoardHistory(boardId)
      vectorClock.clearBoardClock(boardId)
    }
  }
}, 5 * 60 * 1000) // Check every 5 minutes

export function initializeSocketServer(httpServer: HTTPServer) {
  if (!io) {
    io = new SocketIOServer(httpServer, {
      path: '/socket.io/',
      cors: {
        origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000
    })

    // Use authentication middleware
    io.use(authenticateSocket)
    
    // Setup collaboration handlers
    setupCollaborationHandlers(io)
    
    // Additional real-time handlers
    io.on('connection', (socket: Socket) => {
      console.log('New client connected:', socket.id)
      
      // Apply rate limiting to this socket
      applyRateLimiting(socket)

      // Handle user joining a board
      socket.on('join-board', async ({ boardId, userId, userName }) => {
        try {
          // Leave previous board if any
          const previousBoardId = users.get(socket.id)?.boardId
          if (previousBoardId) {
            socket.leave(previousBoardId)
            await realtimeService.removeCursor(previousBoardId, socket.id)
            socket.to(previousBoardId).emit('collaborator-left', { userId: socket.id })
          }

          // Join new board room
          socket.join(boardId)
          
          // Initialize board in memory if doesn't exist
          if (!activeBoards.has(boardId)) {
            activeBoards.set(boardId, {
              lwwSet: new LWWElementSet(),
              lastActivity: Date.now()
            })
            
            // Load elements from database
            const elements = await elementService.getBoardElements(boardId)
            const lwwSet = activeBoards.get(boardId)!.lwwSet
            
            elements.forEach((element: any) => {
              lwwSet.add(element.id, element, new Date(element.updatedAt).getTime())
            })
          }
          
          // Update last activity
          const activeBoard = activeBoards.get(boardId)!
          activeBoard.lastActivity = Date.now()

          // Add user to board
          const user = {
            id: socket.id,
            name: userName || `User ${socket.id.slice(0, 6)}`,
            boardId,
            color: generateUserColor(),
            dbUserId: userId
          }
          users.set(socket.id, user)

          // Get board state from database
          const board = await boardService.getBoard(boardId)
          const collaborators = await collaborationService.getCollaborators(boardId)
          const cursors = await realtimeService.getCursors(boardId)

          // Send current board state to new user
          socket.emit('board-state', {
            elements: activeBoard.lwwSet.getElements(),
            collaborators: collaborators.map(c => ({
              id: c.user.id,
              name: c.user.fullName || c.user.username,
              color: generateUserColor()
            })),
            cursors
          })

          // Log activity
          await activityService.logActivity({
            userId,
            boardId,
            action: 'joined_board',
            details: { userName }
          })

          // Notify other users
          socket.to(boardId).emit('collaborator-joined', user)
        } catch (error) {
          console.error('Error joining board:', error)
          socket.emit('error', { message: 'Failed to join board' })
        }
      })

      // Handle cursor movement
      socket.on('cursor-move', async ({ x, y }) => {
        const user = users.get(socket.id)
        if (user) {
          user.cursor = { x, y }
          
          // Store cursor in Redis for persistence
          await realtimeService.storeCursor(user.boardId, socket.id, { x, y })
          
          socket.to(user.boardId).emit('cursor-update', {
            userId: socket.id,
            cursor: { x, y },
            color: user.color,
            name: user.name
          })
        }
      })

      // Handle element operations with conflict resolution
      socket.on('element-create', async (element) => {
        const user = users.get(socket.id)
        if (user && user.dbUserId) {
          try {
            const activeBoard = activeBoards.get(user.boardId)
            if (!activeBoard) return

            // Create operation
            const operation: Operation = {
              id: `op-${Date.now()}-${Math.random()}`,
              type: 'create',
              elementId: element.id,
              userId: user.dbUserId,
              timestamp: Date.now(),
              sequence: conflictResolver.getNextSequence(user.boardId),
              data: element,
              boardId: user.boardId
            }

            // Add to history
            conflictResolver.addToHistory(operation)
            
            // Update vector clock
            const clock = vectorClock.increment(user.boardId, user.dbUserId)

            // Add to LWW set
            activeBoard.lwwSet.add(element.id, element, operation.timestamp)
            activeBoard.lastActivity = Date.now()

            // Persist to database
            await elementService.createElement({
              boardId: user.boardId,
              type: element.type,
              data: element.data || {},
              position: element.position || { x: 0, y: 0 },
              dimensions: element.dimensions || { width: 100, height: 100 },
              style: element.style,
              creatorId: user.dbUserId
            })

            // Broadcast to other users
            socket.to(user.boardId).emit('element-created', {
              element,
              userId: socket.id,
              operation,
              vectorClock: Array.from(clock.entries())
            })

            // Log activity
            await activityService.logActivity({
              userId: user.dbUserId,
              boardId: user.boardId,
              action: 'element_created',
              details: { elementId: element.id, type: element.type }
            })
          } catch (error) {
            console.error('Error creating element:', error)
            socket.emit('error', { message: 'Failed to create element' })
          }
        }
      })

      socket.on('element-update', async (updates) => {
        const user = users.get(socket.id)
        if (user && user.dbUserId) {
          try {
            const activeBoard = activeBoards.get(user.boardId)
            if (!activeBoard) return

            // Try to acquire lock on element
            const locked = await realtimeService.lockElement(updates.id, user.dbUserId)
            if (!locked) {
              socket.emit('element-locked', { elementId: updates.id })
              return
            }

            // Create operation
            const operation: Operation = {
              id: `op-${Date.now()}-${Math.random()}`,
              type: 'update',
              elementId: updates.id,
              userId: user.dbUserId,
              timestamp: Date.now(),
              sequence: conflictResolver.getNextSequence(user.boardId),
              data: updates,
              boardId: user.boardId
            }

            // Add to history
            conflictResolver.addToHistory(operation)
            
            // Update vector clock
            const clock = vectorClock.increment(user.boardId, user.dbUserId)

            // Update in LWW set
            const elements = activeBoard.lwwSet.getElements()
            const element = elements.find(el => el.id === updates.id)
            if (element) {
              const updatedElement = { ...element, ...updates }
              activeBoard.lwwSet.add(updates.id, updatedElement, operation.timestamp)
              activeBoard.lastActivity = Date.now()

              // Persist to database
              await elementService.updateElement(updates.id, updates)
            }

            // Release lock
            await realtimeService.unlockElement(updates.id, user.dbUserId)

            // Broadcast to other users
            socket.to(user.boardId).emit('element-updated', {
              updates,
              userId: socket.id,
              operation,
              vectorClock: Array.from(clock.entries())
            })
          } catch (error) {
            console.error('Error updating element:', error)
            socket.emit('error', { message: 'Failed to update element' })
          }
        }
      })

      socket.on('element-delete', async (elementId) => {
        const user = users.get(socket.id)
        if (user && user.dbUserId) {
          try {
            const activeBoard = activeBoards.get(user.boardId)
            if (!activeBoard) return

            // Create operation
            const operation: Operation = {
              id: `op-${Date.now()}-${Math.random()}`,
              type: 'delete',
              elementId,
              userId: user.dbUserId,
              timestamp: Date.now(),
              sequence: conflictResolver.getNextSequence(user.boardId),
              data: {},
              boardId: user.boardId
            }

            // Add to history
            conflictResolver.addToHistory(operation)
            
            // Update vector clock
            const clock = vectorClock.increment(user.boardId, user.dbUserId)

            // Remove from LWW set
            activeBoard.lwwSet.remove(elementId, operation.timestamp)
            activeBoard.lastActivity = Date.now()

            // Persist to database
            await elementService.deleteElement(elementId)

            // Broadcast to other users
            socket.to(user.boardId).emit('element-deleted', {
              elementId,
              userId: socket.id,
              operation,
              vectorClock: Array.from(clock.entries())
            })

            // Log activity
            await activityService.logActivity({
              userId: user.dbUserId,
              boardId: user.boardId,
              action: 'element_deleted',
              details: { elementId }
            })
          } catch (error) {
            console.error('Error deleting element:', error)
            socket.emit('error', { message: 'Failed to delete element' })
          }
        }
      })

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log('Client disconnected:', socket.id)
        
        // Clear rate limit data for this socket
        clearRateLimitForSocket(socket.id)
        
        const user = users.get(socket.id)
        if (user) {
          // Remove cursor from Redis
          await realtimeService.removeCursor(user.boardId, socket.id)
          
          // Notify other users
          socket.to(user.boardId).emit('collaborator-left', {
            userId: socket.id
          })
          
          // Log activity if database user
          if (user.dbUserId) {
            await activityService.logActivity({
              userId: user.dbUserId,
              boardId: user.boardId,
              action: 'left_board',
              details: { socketId: socket.id }
            })
          }
          
          users.delete(socket.id)
        }
      })
    })

    console.log('Socket.IO server initialized with collaboration features')
  }
  return io
}

export function getSocketServer() {
  return io
}

export async function getBoardState(boardId: string) {
  const activeBoard = activeBoards.get(boardId)
  if (activeBoard) {
    return {
      elements: activeBoard.lwwSet.getElements(),
      lastActivity: activeBoard.lastActivity
    }
  }
  
  // Load from database if not in memory
  const board = await boardService.getBoard(boardId)
  if (board) {
    return {
      elements: board.elements,
      board: board
    }
  }
  
  return null
}

export function getConnectedUsers() {
  return Array.from(users.values())
}

export function getActiveBoardsInfo() {
  const info = []
  for (const [boardId, board] of activeBoards) {
    info.push({
      boardId,
      elementCount: board.lwwSet.getElements().length,
      lastActivity: new Date(board.lastActivity).toISOString(),
      connectedUsers: Array.from(users.values()).filter(u => u.boardId === boardId).length
    })
  }
  return info
}