import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
})

// Initialize Redis Client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
})

redis.on('error', (err) => {
  console.error('Redis Client Error:', err)
})

redis.on('connect', () => {
  console.log('Redis Client Connected')
})

// Board Operations
export const boardService = {
  async createBoard(data: {
    title: string
    description?: string
    ownerId: string
    visibility?: 'PRIVATE' | 'PUBLIC' | 'TEAM'
  }) {
    return prisma.board.create({
      data: {
        title: data.title,
        description: data.description,
        ownerId: data.ownerId,
        visibility: data.visibility || 'PRIVATE',
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    })
  },

  async getBoard(boardId: string) {
    return prisma.board.findUnique({
      where: { id: boardId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        elements: true,
      },
    })
  },

  async updateBoard(boardId: string, data: any) {
    return prisma.board.update({
      where: { id: boardId },
      data: {
        ...data,
        lastAccessed: new Date(),
      },
    })
  },

  async deleteBoard(boardId: string) {
    return prisma.board.delete({
      where: { id: boardId },
    })
  },

  async getUserBoards(userId: string) {
    const [owned, collaborated] = await Promise.all([
      prisma.board.findMany({
        where: { ownerId: userId },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.boardCollaborator.findMany({
        where: { userId },
        include: {
          board: {
            include: {
              owner: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                },
              },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      }),
    ])

    return {
      owned,
      collaborated: collaborated.map((c) => c.board),
    }
  },
}

// Element Operations
export const elementService = {
  async createElement(data: {
    boardId: string
    type: string
    data: any
    position: { x: number; y: number }
    dimensions: { width: number; height: number }
    style?: any
    creatorId: string
  }) {
    const element = await prisma.element.create({
      data,
    })

    // Cache in Redis for real-time access
    await redis.setex(
      `element:${element.id}`,
      3600, // 1 hour TTL
      JSON.stringify(element)
    )

    return element
  },

  async updateElement(elementId: string, updates: any) {
    const element = await prisma.element.update({
      where: { id: elementId },
      data: updates,
    })

    // Update Redis cache
    await redis.setex(
      `element:${elementId}`,
      3600,
      JSON.stringify(element)
    )

    return element
  },

  async deleteElement(elementId: string) {
    await prisma.element.delete({
      where: { id: elementId },
    })

    // Remove from Redis cache
    await redis.del(`element:${elementId}`)
  },

  async getBoardElements(boardId: string) {
    // Try Redis cache first
    const cached = await redis.get(`board:${boardId}:elements`)
    if (cached) {
      return JSON.parse(cached)
    }

    // Fallback to database
    const elements = await prisma.element.findMany({
      where: { boardId },
      orderBy: { createdAt: 'asc' },
    })

    // Cache for future requests
    await redis.setex(
      `board:${boardId}:elements`,
      300, // 5 minutes TTL
      JSON.stringify(elements)
    )

    return elements
  },
}

// Collaboration Operations
export const collaborationService = {
  async addCollaborator(boardId: string, userId: string, permissions: {
    canEdit?: boolean
    canComment?: boolean
  } = {}) {
    return prisma.boardCollaborator.create({
      data: {
        boardId,
        userId,
        canEdit: permissions.canEdit !== false,
        canComment: permissions.canComment !== false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    })
  },

  async removeCollaborator(boardId: string, userId: string) {
    return prisma.boardCollaborator.delete({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
    })
  },

  async getCollaborators(boardId: string) {
    return prisma.boardCollaborator.findMany({
      where: { boardId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    })
  },
}

// Version Control Operations
export const versionService = {
  async createVersion(boardId: string, createdBy: string, message?: string) {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { elements: true },
    })

    if (!board) {
      throw new Error('Board not found')
    }

    const lastVersion = await prisma.boardVersion.findFirst({
      where: { boardId },
      orderBy: { versionNumber: 'desc' },
    })

    const versionNumber = (lastVersion?.versionNumber || 0) + 1

    return prisma.boardVersion.create({
      data: {
        boardId,
        versionNumber,
        canvasData: board.canvasData as any,
        createdBy,
        message,
      },
    })
  },

  async getVersions(boardId: string, limit = 10) {
    return prisma.boardVersion.findMany({
      where: { boardId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    })
  },

  async restoreVersion(boardId: string, versionId: string) {
    const version = await prisma.boardVersion.findUnique({
      where: { id: versionId },
    })

    if (!version || version.boardId !== boardId) {
      throw new Error('Version not found')
    }

    return prisma.board.update({
      where: { id: boardId },
      data: {
        canvasData: version.canvasData as any,
      },
    })
  },
}

// Session Management
export const sessionService = {
  async createSession(userId: string, token: string, ipAddress?: string, userAgent?: string) {
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour expiry

    return prisma.session.create({
      data: {
        userId,
        token,
        ipAddress,
        userAgent,
        expiresAt,
      },
    })
  },

  async validateSession(token: string) {
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
            role: true,
          },
        },
      },
    })

    if (!session || session.expiresAt < new Date()) {
      return null
    }

    return session
  },

  async deleteSession(token: string) {
    return prisma.session.delete({
      where: { token },
    })
  },

  async cleanExpiredSessions() {
    return prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })
  },
}

// Real-time State Management with Redis
export const realtimeService = {
  async storeCursor(boardId: string, userId: string, position: { x: number; y: number }) {
    const key = `board:${boardId}:cursor:${userId}`
    await redis.setex(key, 30, JSON.stringify(position)) // 30 second TTL
  },

  async getCursors(boardId: string) {
    const pattern = `board:${boardId}:cursor:*`
    const keys = await redis.keys(pattern)
    
    const cursors: any[] = []
    for (const key of keys) {
      const userId = key.split(':').pop()
      const position = await redis.get(key)
      if (position && userId) {
        cursors.push({
          userId,
          position: JSON.parse(position),
        })
      }
    }
    
    return cursors
  },

  async removeCursor(boardId: string, userId: string) {
    const key = `board:${boardId}:cursor:${userId}`
    await redis.del(key)
  },

  async lockElement(elementId: string, userId: string, duration = 5) {
    const key = `element:${elementId}:lock`
    const result = await redis.set(key, userId, 'EX', duration, 'NX')
    return result === 'OK'
  },

  async unlockElement(elementId: string, userId: string) {
    const key = `element:${elementId}:lock`
    const currentLock = await redis.get(key)
    
    if (currentLock === userId) {
      await redis.del(key)
      return true
    }
    
    return false
  },

  async isElementLocked(elementId: string) {
    const key = `element:${elementId}:lock`
    const lock = await redis.get(key)
    return lock !== null ? lock : false
  },
}

// Activity Logging
export const activityService = {
  async logActivity(data: {
    userId?: string
    boardId?: string
    action: string
    details?: any
    ipAddress?: string
  }) {
    return prisma.activityLog.create({
      data: {
        userId: data.userId,
        boardId: data.boardId,
        action: data.action,
        details: data.details || {},
        ipAddress: data.ipAddress,
      },
    })
  },

  async getActivityLogs(filters: {
    userId?: string
    boardId?: string
    limit?: number
  }) {
    return prisma.activityLog.findMany({
      where: {
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.boardId && { boardId: filters.boardId }),
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    })
  },
}

// Cleanup function for graceful shutdown
export async function cleanup() {
  await prisma.$disconnect()
  redis.disconnect()
}

export { prisma, redis }