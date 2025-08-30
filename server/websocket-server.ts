import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { authenticateSocket } from './middleware/authMiddleware'
import { setupCollaborationHandlers } from './handlers/collaborationHandlers'

let io: SocketIOServer | undefined

// Store board state and connected users
const boards = new Map<string, {
  elements: any[]
  collaborators: Map<string, any>
}>()

// User management
const users = new Map<string, {
  id: string
  name: string
  boardId: string
  cursor?: { x: number; y: number }
  color: string
}>()

// Generate random color for user cursor
function generateUserColor(): string {
  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
    '#10B981', '#EF4444', '#6366F1', '#14B8A6'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

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

      // Handle user joining a board
      socket.on('join-board', ({ boardId, userId, userName }) => {
        // Leave previous board if any
        const previousBoardId = users.get(socket.id)?.boardId
        if (previousBoardId) {
          socket.leave(previousBoardId)
          
          // Remove from previous board's collaborators
          const previousBoard = boards.get(previousBoardId)
          if (previousBoard) {
            previousBoard.collaborators.delete(socket.id)
            socket.to(previousBoardId).emit('collaborator-left', { userId: socket.id })
          }
        }

        // Join new board
        socket.join(boardId)
        
        // Initialize board if doesn't exist
        if (!boards.has(boardId)) {
          boards.set(boardId, {
            elements: [],
            collaborators: new Map()
          })
        }

        // Add user to board
        const user = {
          id: socket.id,
          name: userName || `User ${socket.id.slice(0, 6)}`,
          boardId,
          color: generateUserColor()
        }
        users.set(socket.id, user)
        
        const board = boards.get(boardId)!
        board.collaborators.set(socket.id, user)

        // Send current board state to new user
        socket.emit('board-state', {
          elements: board.elements,
          collaborators: Array.from(board.collaborators.values())
        })

        // Notify other users
        socket.to(boardId).emit('collaborator-joined', user)
      })

      // Handle cursor movement
      socket.on('cursor-move', ({ x, y }) => {
        const user = users.get(socket.id)
        if (user) {
          user.cursor = { x, y }
          socket.to(user.boardId).emit('cursor-update', {
            userId: socket.id,
            cursor: { x, y },
            color: user.color,
            name: user.name
          })
        }
      })

      // Handle element operations
      socket.on('element-create', (element) => {
        const user = users.get(socket.id)
        if (user) {
          const board = boards.get(user.boardId)
          if (board) {
            board.elements.push(element)
            socket.to(user.boardId).emit('element-created', {
              element,
              userId: socket.id
            })
          }
        }
      })

      socket.on('element-update', (updates) => {
        const user = users.get(socket.id)
        if (user) {
          const board = boards.get(user.boardId)
          if (board) {
            const elementIndex = board.elements.findIndex(el => el.id === updates.id)
            if (elementIndex !== -1) {
              board.elements[elementIndex] = { ...board.elements[elementIndex], ...updates }
              socket.to(user.boardId).emit('element-updated', {
                updates,
                userId: socket.id
              })
            }
          }
        }
      })

      socket.on('element-delete', (elementId) => {
        const user = users.get(socket.id)
        if (user) {
          const board = boards.get(user.boardId)
          if (board) {
            board.elements = board.elements.filter(el => el.id !== elementId)
            socket.to(user.boardId).emit('element-deleted', {
              elementId,
              userId: socket.id
            })
          }
        }
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
        
        const user = users.get(socket.id)
        if (user) {
          const board = boards.get(user.boardId)
          if (board) {
            board.collaborators.delete(socket.id)
            socket.to(user.boardId).emit('collaborator-left', {
              userId: socket.id
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

export function getBoardState(boardId: string) {
  return boards.get(boardId)
}

export function getConnectedUsers() {
  return Array.from(users.values())
}