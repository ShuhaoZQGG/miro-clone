import { io, Socket } from 'socket.io-client'
import { v4 as uuidv4 } from 'uuid'

export interface UserPresence {
  userId: string
  displayName: string
  avatarColor: string
  cursor?: { x: number; y: number }
  selection?: string[]
  lastSeen: Date
  isActive: boolean
}

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

type ConnectionState = 'disconnected' | 'connecting' | 'connected'

interface RealtimeManagerConfig {
  wsUrl?: string
  boardId: string
  userId?: string
  displayName?: string
  onConnectionChange?: (state: ConnectionState) => void
  onUsersUpdate?: (users: UserPresence[]) => void
  onOperations?: (operations: Operation[]) => void
  onCursorUpdate?: (userId: string, position: { x: number; y: number }) => void
  onSelectionUpdate?: (userId: string, elementIds: string[]) => void
}

export class RealtimeManager {
  private socket: Socket | null = null
  private connectionState: ConnectionState = 'disconnected'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private config: RealtimeManagerConfig
  private pingInterval: NodeJS.Timeout | null = null
  private cursorThrottleTimer: NodeJS.Timeout | null = null
  private lastCursorPosition: { x: number; y: number } | null = null
  private operationQueue: Operation[] = []

  constructor(config: RealtimeManagerConfig) {
    this.config = {
      wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
      ...config
    }
  }

  connect(): void {
    if (this.socket?.connected) {
      console.warn('Already connected to WebSocket server')
      return
    }

    this.setConnectionState('connecting')

    this.socket = io(this.config.wsUrl!, {
      transports: ['websocket'],
      reconnection: false
    })

    this.setupEventHandlers()
    this.startPingInterval()
  }

  private setupEventHandlers(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server')
      this.setConnectionState('connected')
      this.reconnectAttempts = 0
      
      this.socket!.emit('join', {
        boardId: this.config.boardId,
        userId: this.config.userId || uuidv4(),
        displayName: this.config.displayName
      })
    })

    this.socket.on('joined', ({ users, operations }) => {
      this.config.onUsersUpdate?.(users)
      if (operations.length > 0) {
        this.config.onOperations?.(operations)
      }
    })

    this.socket.on('user_joined', (user: UserPresence) => {
      console.log('User joined:', user.displayName)
    })

    this.socket.on('user_left', ({ userId }) => {
      console.log('User left:', userId)
    })

    this.socket.on('cursor_update', ({ userId, position }) => {
      this.config.onCursorUpdate?.(userId, position)
    })

    this.socket.on('selection_update', ({ userId, elementIds }) => {
      this.config.onSelectionUpdate?.(userId, elementIds)
    })

    this.socket.on('operations_batch', (operations: Operation[]) => {
      this.handleRemoteOperations(operations)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason)
      this.setConnectionState('disconnected')
      this.handleDisconnection()
    })

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error)
    })

    this.socket.on('pong', ({ timestamp, serverTime }) => {
      const latency = Date.now() - timestamp
      console.log(`Latency: ${latency}ms`)
    })
  }

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state
    this.config.onConnectionChange?.(state)
  }

  private handleDisconnection(): void {
    this.stopPingInterval()

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
      console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts + 1})`)
      
      setTimeout(() => {
        this.reconnectAttempts++
        this.connect()
      }, delay)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }

  private handleRemoteOperations(operations: Operation[]): void {
    for (const op of operations) {
      if (this.operationQueue.length > 0) {
        const transformed = this.transformWithQueue(op)
        if (transformed) {
          this.config.onOperations?.([transformed])
        }
      } else {
        this.config.onOperations?.([op])
      }
    }
  }

  private transformWithQueue(remoteOp: Operation): Operation | null {
    let result: Operation | null = remoteOp
    
    for (const localOp of this.operationQueue) {
      if (!result) break
      
      const [transformedLocal, transformedRemote] = this.transformOperations(localOp, result)
      result = transformedRemote
    }
    
    return result
  }

  private transformOperations(op1: Operation, op2: Operation): [Operation | null, Operation | null] {
    if (op1.type === 'create' && op2.type === 'create') {
      return [op1, op2]
    }
    
    if (op1.type === 'update' && op2.type === 'update' && op1.elementId === op2.elementId) {
      if (op1.timestamp < op2.timestamp) {
        return [null, { ...op2, oldState: op1.newState }]
      } else {
        return [{ ...op1, oldState: op2.newState }, null]
      }
    }
    
    if ((op1.type === 'delete' || op2.type === 'delete') && op1.elementId === op2.elementId) {
      return [null, null]
    }
    
    return [op1, op2]
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping', { timestamp: Date.now() })
      }
    }, 30000)
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  sendOperation(operation: Omit<Operation, 'id' | 'timestamp' | 'userId'>): void {
    if (!this.socket?.connected) {
      console.warn('Cannot send operation: not connected')
      return
    }

    const fullOperation: Operation = {
      ...operation,
      id: uuidv4(),
      timestamp: Date.now(),
      userId: this.config.userId || 'anonymous'
    }

    this.operationQueue.push(fullOperation)
    this.socket.emit('operation', operation)

    setTimeout(() => {
      const index = this.operationQueue.findIndex(op => op.id === fullOperation.id)
      if (index !== -1) {
        this.operationQueue.splice(index, 1)
      }
    }, 5000)
  }

  updateCursor(position: { x: number; y: number }): void {
    if (!this.socket?.connected) return

    this.lastCursorPosition = position

    if (!this.cursorThrottleTimer) {
      this.cursorThrottleTimer = setTimeout(() => {
        if (this.lastCursorPosition) {
          this.socket!.emit('cursor', { position: this.lastCursorPosition })
        }
        this.cursorThrottleTimer = null
      }, 30)
    }
  }

  updateSelection(elementIds: string[]): void {
    if (!this.socket?.connected) return
    this.socket.emit('selection', { elementIds })
  }

  disconnect(): void {
    this.stopPingInterval()
    
    if (this.socket) {
      this.socket.emit('leave', { boardId: this.config.boardId })
      this.socket.disconnect()
      this.socket = null
    }
    
    this.setConnectionState('disconnected')
    this.reconnectAttempts = 0
  }

  getConnectionState(): ConnectionState {
    return this.connectionState
  }

  isConnected(): boolean {
    return this.connectionState === 'connected'
  }
}