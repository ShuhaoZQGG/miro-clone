import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface UserPresence {
  userId: string
  displayName: string
  avatarColor: string
  cursor?: { x: number; y: number }
  selection?: string[]
  lastSeen?: Date
  isActive?: boolean
}

interface Operation {
  id?: string
  type: 'create' | 'update' | 'delete' | 'move'
  elementId?: string
  element?: any
  oldState?: any
  newState?: any
  timestamp?: number
  userId?: string
}

interface UseWebSocketReturn {
  isConnected: boolean
  users: UserPresence[]
  connect: (userId: string, displayName: string) => void
  disconnect: () => void
  sendCursorPosition: (position: { x: number; y: number }) => void
  sendOperation: (operation: Omit<Operation, 'id' | 'timestamp' | 'userId'>) => void
  sendSelection: (elementIds: string[]) => void
  onOperation: (callback: (operation: Operation) => void) => void
  onCursorUpdate: (callback: (data: { userId: string; position: { x: number; y: number } }) => void) => void
  onSelectionUpdate: (callback: (data: { userId: string; elementIds: string[] }) => void) => void
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'

export function useWebSocket(boardId: string): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [users, setUsers] = useState<UserPresence[]>([])
  const socketRef = useRef<Socket | null>(null)
  const operationCallbackRef = useRef<((operation: Operation) => void) | null>(null)
  const cursorCallbackRef = useRef<((data: { userId: string; position: { x: number; y: number } }) => void) | null>(null)
  const selectionCallbackRef = useRef<((data: { userId: string; elementIds: string[] }) => void) | null>(null)
  const userInfoRef = useRef<{ userId: string; displayName: string } | null>(null)

  useEffect(() => {
    socketRef.current = io(WS_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      setIsConnected(true)
      console.log('Connected to WebSocket server')
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Disconnected from WebSocket server')
    })

    socket.on('reconnect', () => {
      if (userInfoRef.current) {
        socket.emit('join', {
          boardId,
          userId: userInfoRef.current.userId,
          displayName: userInfoRef.current.displayName
        })
      }
    })

    socket.on('joined', ({ users, operations }) => {
      setUsers(users)
      console.log('Joined board with users:', users)
    })

    socket.on('user_joined', (user: UserPresence) => {
      setUsers(prev => [...prev.filter(u => u.userId !== user.userId), user])
    })

    socket.on('user_left', ({ userId }) => {
      setUsers(prev => prev.filter(u => u.userId !== userId))
    })

    socket.on('cursor_update', (data: { userId: string; position: { x: number; y: number } }) => {
      setUsers(prev => prev.map(u => 
        u.userId === data.userId ? { ...u, cursor: data.position } : u
      ))
      cursorCallbackRef.current?.(data)
    })

    socket.on('selection_update', (data: { userId: string; elementIds: string[] }) => {
      setUsers(prev => prev.map(u => 
        u.userId === data.userId ? { ...u, selection: data.elementIds } : u
      ))
      selectionCallbackRef.current?.(data)
    })

    socket.on('operations_batch', (operations: Operation[]) => {
      operations.forEach(op => {
        operationCallbackRef.current?.(op)
      })
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('reconnect')
      socket.off('joined')
      socket.off('user_joined')
      socket.off('user_left')
      socket.off('cursor_update')
      socket.off('selection_update')
      socket.off('operations_batch')
      socket.disconnect()
    }
  }, [boardId])

  const connect = useCallback((userId: string, displayName: string) => {
    if (!socketRef.current) return
    
    userInfoRef.current = { userId, displayName }
    socketRef.current.connect()
    socketRef.current.emit('join', { boardId, userId, displayName })
  }, [boardId])

  const disconnect = useCallback(() => {
    if (!socketRef.current) return
    
    socketRef.current.emit('leave', { boardId })
    socketRef.current.disconnect()
    userInfoRef.current = null
  }, [boardId])

  const sendCursorPosition = useCallback((position: { x: number; y: number }) => {
    if (!socketRef.current?.connected) return
    socketRef.current.emit('cursor', { position })
  }, [])

  const sendOperation = useCallback((operation: Omit<Operation, 'id' | 'timestamp' | 'userId'>) => {
    if (!socketRef.current?.connected) return
    socketRef.current.emit('operation', operation)
  }, [])

  const sendSelection = useCallback((elementIds: string[]) => {
    if (!socketRef.current?.connected) return
    socketRef.current.emit('selection', { elementIds })
  }, [])

  const onOperation = useCallback((callback: (operation: Operation) => void) => {
    operationCallbackRef.current = callback
  }, [])

  const onCursorUpdate = useCallback((callback: (data: { userId: string; position: { x: number; y: number } }) => void) => {
    cursorCallbackRef.current = callback
  }, [])

  const onSelectionUpdate = useCallback((callback: (data: { userId: string; elementIds: string[] }) => void) => {
    selectionCallbackRef.current = callback
  }, [])

  return {
    isConnected,
    users,
    connect,
    disconnect,
    sendCursorPosition,
    sendOperation,
    sendSelection,
    onOperation,
    onCursorUpdate,
    onSelectionUpdate
  }
}