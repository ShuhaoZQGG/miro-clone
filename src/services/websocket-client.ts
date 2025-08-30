import { io, Socket } from 'socket.io-client'
import { useCanvasStore } from '@/store/useCanvasStore'

export interface Collaborator {
  id: string
  name: string
  color: string
  cursor?: { x: number; y: number }
}

class WebSocketClient {
  private socket: Socket | null = null
  private boardId: string | null = null
  private userId: string | null = null
  private userName: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor() {
    // Initialize socket connection
    this.connect()
  }

  private connect() {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
    
    this.socket = io(socketUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    if (!this.socket) return

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server')
      this.reconnectAttempts = 0
      useCanvasStore.getState().setConnectionStatus(true)
      
      // Rejoin board if was previously connected
      if (this.boardId && this.userId) {
        this.joinBoard(this.boardId, this.userId, this.userName || undefined)
      }
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason)
      useCanvasStore.getState().setConnectionStatus(false)
    })

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached')
        useCanvasStore.getState().setConnectionStatus(false)
      }
    })

    // Board state events
    this.socket.on('board-state', ({ elements, collaborators }) => {
      const store = useCanvasStore.getState()
      store.setElements(elements)
      
      // Update collaborators
      const collaboratorMap = new Map<string, Collaborator>()
      collaborators.forEach((collab: Collaborator) => {
        collaboratorMap.set(collab.id, collab)
      })
      store.setCollaborators(collaboratorMap)
    })

    // Collaborator events
    this.socket.on('collaborator-joined', (user: Collaborator) => {
      const store = useCanvasStore.getState()
      const collaborators = new Map(store.collaborators)
      collaborators.set(user.id, user)
      store.setCollaborators(collaborators)
    })

    this.socket.on('collaborator-left', ({ userId }) => {
      const store = useCanvasStore.getState()
      const collaborators = new Map(store.collaborators)
      collaborators.delete(userId)
      store.setCollaborators(collaborators)
    })

    // Cursor events
    this.socket.on('cursor-update', ({ userId, cursor, color, name }) => {
      const store = useCanvasStore.getState()
      const collaborators = new Map(store.collaborators)
      const collaborator = collaborators.get(userId)
      
      if (collaborator) {
        collaborator.cursor = cursor
      } else {
        collaborators.set(userId, { id: userId, name, color, cursor })
      }
      
      store.setCollaborators(collaborators)
    })

    // Element events
    this.socket.on('element-created', ({ element, userId }) => {
      if (userId !== this.socket?.id) {
        const store = useCanvasStore.getState()
        store.addElement(element)
      }
    })

    this.socket.on('element-updated', ({ updates, userId }) => {
      if (userId !== this.socket?.id) {
        const store = useCanvasStore.getState()
        store.updateElement(updates.id, updates)
      }
    })

    this.socket.on('element-deleted', ({ elementId, userId }) => {
      if (userId !== this.socket?.id) {
        const store = useCanvasStore.getState()
        store.deleteElement(elementId)
      }
    })

    this.socket.on('elements-batch-updated', ({ updates, userId }) => {
      if (userId !== this.socket?.id) {
        const store = useCanvasStore.getState()
        updates.forEach((update: any) => {
          store.updateElement(update.id, update)
        })
      }
    })
  }

  // Public methods
  public joinBoard(boardId: string, userId: string, userName?: string) {
    this.boardId = boardId
    this.userId = userId
    this.userName = userName
    
    if (this.socket?.connected) {
      this.socket.emit('join-board', { boardId, userId, userName })
    }
  }

  public leaveBoard() {
    if (this.socket?.connected && this.boardId) {
      this.socket.emit('leave-board', { boardId: this.boardId })
    }
    this.boardId = null
  }

  public sendCursorPosition(x: number, y: number) {
    if (this.socket?.connected) {
      this.socket.emit('cursor-move', { x, y })
    }
  }

  public createElement(element: any) {
    if (this.socket?.connected) {
      this.socket.emit('element-create', element)
    }
  }

  public updateElement(updates: any) {
    if (this.socket?.connected) {
      this.socket.emit('element-update', updates)
    }
  }

  public deleteElement(elementId: string) {
    if (this.socket?.connected) {
      this.socket.emit('element-delete', elementId)
    }
  }

  public batchUpdateElements(updates: any[]) {
    if (this.socket?.connected) {
      this.socket.emit('elements-batch-update', updates)
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false
  }

  public getSocketId(): string | undefined {
    return this.socket?.id
  }
}

// Create singleton instance
const websocketClient = new WebSocketClient()

export default websocketClient