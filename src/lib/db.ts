// Check if Prisma is available
let PrismaClient: any
let db: any

try {
  PrismaClient = require('@prisma/client').PrismaClient
  
  // Prevent multiple instances in development
  const globalForPrisma = global as unknown as { prisma: any }
  
  db = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
  
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = db
  }
} catch (error) {
  // Prisma not available, use mock
  console.warn('Prisma not configured, using mock database')
  
  // Mock database for testing when Prisma is not available
  db = {
    user: {
      findUnique: jest?.fn ? jest.fn(async () => null) : async () => null,
      findFirst: jest?.fn ? jest.fn(async () => null) : async () => null,
      findMany: jest?.fn ? jest.fn(async () => []) : async () => [],
      create: jest?.fn ? jest.fn(async (data: any) => ({
        id: '1',
        ...data.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })) : async (data: any) => ({
        id: '1',
        ...data.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      update: jest?.fn ? jest.fn(async (params: any) => ({
        id: params.where.id,
        ...params.data,
        updatedAt: new Date(),
      })) : async (params: any) => ({
        id: params.where.id,
        ...params.data,
        updatedAt: new Date(),
      }),
      delete: jest?.fn ? jest.fn(async () => ({ id: '1' })) : async () => ({ id: '1' }),
    },
    board: {
      findUnique: jest?.fn ? jest.fn(async () => null) : async () => null,
      findFirst: jest?.fn ? jest.fn(async () => null) : async () => null,
      findMany: jest?.fn ? jest.fn(async () => []) : async () => [],
      create: jest?.fn ? jest.fn(async (data: any) => ({
        id: '1',
        ...data.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })) : async (data: any) => ({
        id: '1',
        ...data.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      update: jest?.fn ? jest.fn(async (params: any) => ({
        id: params.where.id,
        ...params.data,
        updatedAt: new Date(),
      })) : async (params: any) => ({
        id: params.where.id,
        ...params.data,
        updatedAt: new Date(),
      }),
      delete: jest?.fn ? jest.fn(async () => ({ id: '1' })) : async () => ({ id: '1' }),
    },
    element: {
      findUnique: jest?.fn ? jest.fn(async () => null) : async () => null,
      findMany: jest?.fn ? jest.fn(async () => []) : async () => [],
      create: jest?.fn ? jest.fn(async (data: any) => ({
        id: '1',
        ...data.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })) : async (data: any) => ({
        id: '1',
        ...data.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      update: jest?.fn ? jest.fn(async (params: any) => ({
        id: params.where.id,
        ...params.data,
        updatedAt: new Date(),
      })) : async (params: any) => ({
        id: params.where.id,
        ...params.data,
        updatedAt: new Date(),
      }),
      delete: jest?.fn ? jest.fn(async () => ({ id: '1' })) : async () => ({ id: '1' }),
      deleteMany: jest?.fn ? jest.fn(async () => ({ count: 1 })) : async () => ({ count: 1 }),
    },
  }
}

export { db }

// Export mock database separately for testing
export const mockDb = {
  user: {
    findUnique: async () => null,
    findFirst: async () => null,
    findMany: async () => [],
    create: async (data: any) => ({
      id: '1',
      ...data.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    update: async (params: any) => ({
      id: params.where.id,
      ...params.data,
      updatedAt: new Date(),
    }),
    delete: async () => ({ id: '1' }),
  },
  board: {
    findUnique: async () => null,
    findFirst: async () => null,
    findMany: async () => [],
    create: async (data: any) => ({
      id: '1',
      ...data.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    update: async (params: any) => ({
      id: params.where.id,
      ...params.data,
      updatedAt: new Date(),
    }),
    delete: async () => ({ id: '1' }),
  },
  element: {
    findUnique: async () => null,
    findMany: async () => [],
    create: async (data: any) => ({
      id: '1',
      ...data.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    update: async (params: any) => ({
      id: params.where.id,
      ...params.data,
      updatedAt: new Date(),
    }),
    delete: async () => ({ id: '1' }),
    deleteMany: async () => ({ count: 1 }),
  },
}

export { db as prisma }