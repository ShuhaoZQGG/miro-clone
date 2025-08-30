import { renderHook, act, waitFor } from '@testing-library/react'
import { io, Socket } from 'socket.io-client'
import { useWebSocket } from '../useWebSocket'

jest.mock('socket.io-client')

describe('useWebSocket', () => {
  let mockSocket: Partial<Socket>
  let mockEmit: jest.Mock
  let mockOn: jest.Mock
  let mockOff: jest.Mock
  let mockConnect: jest.Mock
  let mockDisconnect: jest.Mock

  beforeEach(() => {
    mockEmit = jest.fn()
    mockOn = jest.fn()
    mockOff = jest.fn()
    mockConnect = jest.fn()
    mockDisconnect = jest.fn()

    mockSocket = {
      emit: mockEmit,
      on: mockOn,
      off: mockOff,
      connect: mockConnect,
      disconnect: mockDisconnect,
      connected: false,
      id: 'test-socket-id'
    }

    ;(io as jest.Mock).mockReturnValue(mockSocket as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize socket connection', () => {
    const { result } = renderHook(() => useWebSocket('test-board-123'))

    expect(io).toHaveBeenCalledWith(expect.stringContaining('localhost:3001'), {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })
  })

  it('should connect to board on mount', async () => {
    const { result } = renderHook(() => useWebSocket('test-board-123'))

    await act(async () => {
      result.current.connect('test-user', 'Test User')
    })

    expect(mockConnect).toHaveBeenCalled()
    expect(mockEmit).toHaveBeenCalledWith('join', {
      boardId: 'test-board-123',
      userId: 'test-user',
      displayName: 'Test User'
    })
  })

  it('should handle connection state changes', async () => {
    const { result } = renderHook(() => useWebSocket('test-board-123'))

    expect(result.current.isConnected).toBe(false)

    await act(async () => {
      result.current.connect('test-user', 'Test User')
      const connectHandler = mockOn.mock.calls.find(call => call[0] === 'connect')?.[1]
      connectHandler?.()
    })

    expect(result.current.isConnected).toBe(true)
  })

  it('should handle user presence updates', async () => {
    const { result } = renderHook(() => useWebSocket('test-board-123'))

    await act(async () => {
      result.current.connect('test-user', 'Test User')
      const joinedHandler = mockOn.mock.calls.find(call => call[0] === 'joined')?.[1]
      joinedHandler?.({
        users: [
          { userId: 'user1', displayName: 'User 1', avatarColor: '#ff0000' },
          { userId: 'user2', displayName: 'User 2', avatarColor: '#00ff00' }
        ],
        operations: []
      })
    })

    expect(result.current.users).toHaveLength(2)
    expect(result.current.users[0].userId).toBe('user1')
  })

  it('should send cursor position updates', async () => {
    const { result } = renderHook(() => useWebSocket('test-board-123'))

    await act(async () => {
      result.current.connect('test-user', 'Test User')
      const connectHandler = mockOn.mock.calls.find(call => call[0] === 'connect')?.[1]
      mockSocket.connected = true
      connectHandler?.()
      result.current.sendCursorPosition({ x: 100, y: 200 })
    })

    const calls = mockEmit.mock.calls
    const cursorCall = calls.find(call => call[0] === 'cursor')
    expect(cursorCall).toBeDefined()
    expect(cursorCall?.[1]).toEqual({
      position: { x: 100, y: 200 }
    })
  })

  it('should send operations', async () => {
    const { result } = renderHook(() => useWebSocket('test-board-123'))

    const operation = {
      type: 'create' as const,
      element: { id: 'elem1', type: 'rectangle' }
    }

    await act(async () => {
      result.current.connect('test-user', 'Test User')
      const connectHandler = mockOn.mock.calls.find(call => call[0] === 'connect')?.[1]
      mockSocket.connected = true
      connectHandler?.()
      result.current.sendOperation(operation)
    })

    const calls = mockEmit.mock.calls
    const operationCall = calls.find(call => call[0] === 'operation')
    expect(operationCall).toBeDefined()
    expect(operationCall?.[1]).toEqual(operation)
  })

  it('should handle incoming operations batch', async () => {
    const { result } = renderHook(() => useWebSocket('test-board-123'))
    const onOperation = jest.fn()

    await act(async () => {
      result.current.connect('test-user', 'Test User')
      result.current.onOperation(onOperation)
      
      const batchHandler = mockOn.mock.calls.find(call => call[0] === 'operations_batch')?.[1]
      batchHandler?.([
        { id: 'op1', type: 'create', userId: 'user1', timestamp: Date.now() },
        { id: 'op2', type: 'update', userId: 'user2', timestamp: Date.now() }
      ])
    })

    expect(onOperation).toHaveBeenCalledTimes(2)
  })

  it('should handle selection updates', async () => {
    const { result } = renderHook(() => useWebSocket('test-board-123'))

    await act(async () => {
      result.current.connect('test-user', 'Test User')
      const connectHandler = mockOn.mock.calls.find(call => call[0] === 'connect')?.[1]
      mockSocket.connected = true
      connectHandler?.()
      result.current.sendSelection(['elem1', 'elem2'])
    })

    const calls = mockEmit.mock.calls
    const selectionCall = calls.find(call => call[0] === 'selection')
    expect(selectionCall).toBeDefined()
    expect(selectionCall?.[1]).toEqual({
      elementIds: ['elem1', 'elem2']
    })
  })

  it('should handle disconnection', async () => {
    const { result } = renderHook(() => useWebSocket('test-board-123'))

    await act(async () => {
      result.current.connect('test-user', 'Test User')
      result.current.disconnect()
    })

    expect(mockEmit).toHaveBeenCalledWith('leave', { boardId: 'test-board-123' })
    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('should handle reconnection attempts', async () => {
    const { result } = renderHook(() => useWebSocket('test-board-123'))

    await act(async () => {
      result.current.connect('test-user', 'Test User')
      const disconnectHandler = mockOn.mock.calls.find(call => call[0] === 'disconnect')?.[1]
      disconnectHandler?.()
    })

    expect(result.current.isConnected).toBe(false)

    await act(async () => {
      const reconnectHandler = mockOn.mock.calls.find(call => call[0] === 'reconnect')?.[1]
      reconnectHandler?.()
    })

    expect(mockEmit).toHaveBeenCalledWith('join', expect.any(Object))
  })

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket('test-board-123'))

    unmount()

    expect(mockOff).toHaveBeenCalled()
    expect(mockDisconnect).toHaveBeenCalled()
  })
})