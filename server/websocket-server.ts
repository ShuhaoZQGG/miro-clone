import express from 'express'
import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

interface UserPresence {
  userId: string
  displayName: string
  avatarColor: string
  cursor?: { x: number; y: number }
  selection?: string[]
  lastSeen: Date
  isActive: boolean
}

interface Operation {
  id: string
  type: 'create' | 'update' | 'delete' | 'move'
  elementId?: string
  element?: any
  oldState?: any
  newState?: any
  timestamp: number
  userId: string
}

interface Room {
  boardId: string
  users: Map<string, UserPresence>
  operations: Operation[]
  messageQueue: Operation[]
}

const rooms = new Map<string, Room>()
const MESSAGE_BATCH_INTERVAL = 50
const MAX_BATCH_SIZE = 10

function getOrCreateRoom(boardId: string): Room {
  if (!rooms.has(boardId)) {
    rooms.set(boardId, {
      boardId,
      users: new Map(),
      operations: [],
      messageQueue: []
    })
  }
  return rooms.get(boardId)!
}

function transformOperations(op1: Operation, op2: Operation): [Operation | null, Operation | null] {
  const transformMatrix: Record<string, (a: Operation, b: Operation) => [Operation | null, Operation | null]> = {
    'create-create': (a, b) => [a, b],
    'create-update': (a, b) => [a, b],
    'create-delete': (a, b) => [a, null],
    'update-update': (a, b) => {
      if (a.elementId === b.elementId) {
        return [null, { ...b, oldState: a.newState }]
      }
      return [a, b]
    },
    'update-delete': (a, b) => a.elementId === b.elementId ? [null, b] : [a, b],
    'delete-delete': (a, b) => a.elementId === b.elementId ? [null, null] : [a, b]
  }

  const key = `${op1.type}-${op2.type}`
  const transform = transformMatrix[key] || ((a: Operation, b: Operation) => [a, b])
  return transform(op1, op2)
}

io.on('connection', (socket: Socket) => {
  console.log('New client connected:', socket.id)
  
  let currentBoardId: string | null = null
  let currentUserId: string = ''
  let batchTimer: NodeJS.Timeout | null = null

  socket.on('join', ({ boardId, userId, displayName }) => {
    currentBoardId = boardId
    currentUserId = userId || uuidv4()
    
    socket.join(boardId)
    const room = getOrCreateRoom(boardId)
    
    const userPresence: UserPresence = {
      userId: currentUserId,
      displayName: displayName || `User ${currentUserId.slice(0, 6)}`,
      avatarColor: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      lastSeen: new Date(),
      isActive: true
    }
    
    room.users.set(socket.id, userPresence)
    
    socket.emit('joined', {
      users: Array.from(room.users.values()),
      operations: room.operations.slice(-100)
    })
    
    socket.to(boardId).emit('user_joined', userPresence)
  })

  socket.on('leave', ({ boardId }) => {
    if (boardId && rooms.has(boardId)) {
      socket.leave(boardId)
      const room = rooms.get(boardId)!
      const user = room.users.get(socket.id)
      
      if (user) {
        room.users.delete(socket.id)
        socket.to(boardId).emit('user_left', { userId: user.userId })
      }
      
      if (room.users.size === 0) {
        rooms.delete(boardId)
      }
    }
  })

  socket.on('cursor', ({ position }) => {
    if (!currentBoardId || !rooms.has(currentBoardId)) return
    
    const room = rooms.get(currentBoardId)!
    const user = room.users.get(socket.id)
    
    if (user) {
      user.cursor = position
      user.lastSeen = new Date()
      socket.to(currentBoardId).emit('cursor_update', {
        userId: user.userId,
        position
      })
    }
  })

  socket.on('operation', (op: Omit<Operation, 'id' | 'timestamp' | 'userId'>) => {
    if (!currentBoardId || !currentUserId) return
    
    const room = getOrCreateRoom(currentBoardId)
    const operation: Operation = {
      ...op,
      id: uuidv4(),
      timestamp: Date.now(),
      userId: currentUserId
    }
    
    room.operations.push(operation)
    room.messageQueue.push(operation)
    
    if (!batchTimer) {
      batchTimer = setTimeout(() => {
        if (room.messageQueue.length > 0) {
          const batch = room.messageQueue.splice(0, MAX_BATCH_SIZE)
          socket.to(currentBoardId!).emit('operations_batch', batch)
        }
        batchTimer = null
      }, MESSAGE_BATCH_INTERVAL)
    }
    
    if (room.messageQueue.length >= MAX_BATCH_SIZE) {
      if (batchTimer) {
        clearTimeout(batchTimer)
        batchTimer = null
      }
      const batch = room.messageQueue.splice(0, MAX_BATCH_SIZE)
      socket.to(currentBoardId).emit('operations_batch', batch)
    }
  })

  socket.on('selection', ({ elementIds }) => {
    if (!currentBoardId || !rooms.has(currentBoardId)) return
    
    const room = rooms.get(currentBoardId)!
    const user = room.users.get(socket.id)
    
    if (user) {
      user.selection = elementIds
      socket.to(currentBoardId).emit('selection_update', {
        userId: user.userId,
        elementIds
      })
    }
  })

  socket.on('ping', ({ timestamp }) => {
    socket.emit('pong', {
      timestamp,
      serverTime: Date.now()
    })
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
    
    if (currentBoardId && rooms.has(currentBoardId)) {
      const room = rooms.get(currentBoardId)!
      const user = room.users.get(socket.id)
      
      if (user) {
        room.users.delete(socket.id)
        socket.to(currentBoardId).emit('user_left', { userId: user.userId })
      }
      
      if (room.users.size === 0) {
        rooms.delete(currentBoardId)
      }
    }
    
    if (batchTimer) {
      clearTimeout(batchTimer)
    }
  })
})

const PORT = process.env.WS_PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`)
})

export { io, httpServer }