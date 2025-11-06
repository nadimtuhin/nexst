import 'reflect-metadata'
import { container } from 'tsyringe'
import { PrismaService } from '../prisma.service'
import { LoggerService } from '../../logger/logger.service'

describe.skip('PrismaService', () => {
  let prismaService: PrismaService

  beforeAll(() => {
    // Register LoggerService if not already registered
    if (!container.isRegistered(LoggerService)) {
      container.registerSingleton(LoggerService)
    }
  })

  beforeEach(async () => {
    prismaService = container.resolve(PrismaService)
    await prismaService.onModuleInit()
    // Clean database before each test
    await prismaService.cleanDatabase()
  })

  afterEach(async () => {
    await prismaService.cleanDatabase()
  })

  afterAll(async () => {
    await prismaService.onModuleDestroy()
    container.clearInstances()
  })

  describe('Connection Management', () => {
    it('should connect to database', async () => {
      // Test a simple query to ensure connection works
      const result = await prismaService.$queryRaw`SELECT 1 as result`
      expect(result).toBeDefined()
    })

    it('should be a singleton', () => {
      const instance1 = container.resolve(PrismaService)
      const instance2 = container.resolve(PrismaService)
      expect(instance1).toBe(instance2)
    })
  })

  describe('Database Operations', () => {
    it('should create a user', async () => {
      const user = await prismaService.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          age: 25,
        },
      })

      expect(user).toMatchObject({
        email: 'test@example.com',
        name: 'Test User',
        age: 25,
      })
      expect(user.id).toBeDefined()
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)
    })

    it('should find a user by id', async () => {
      const created = await prismaService.user.create({
        data: {
          email: 'find@example.com',
          name: 'Find User',
          age: 30,
        },
      })

      const found = await prismaService.user.findUnique({
        where: { id: created.id },
      })

      expect(found).toMatchObject({
        id: created.id,
        email: 'find@example.com',
        name: 'Find User',
        age: 30,
      })
    })

    it('should update a user', async () => {
      const created = await prismaService.user.create({
        data: {
          email: 'update@example.com',
          name: 'Update User',
          age: 35,
        },
      })

      const updated = await prismaService.user.update({
        where: { id: created.id },
        data: { age: 36 },
      })

      expect(updated.age).toBe(36)
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        created.updatedAt.getTime()
      )
    })

    it('should delete a user', async () => {
      const created = await prismaService.user.create({
        data: {
          email: 'delete@example.com',
          name: 'Delete User',
          age: 40,
        },
      })

      await prismaService.user.delete({
        where: { id: created.id },
      })

      const found = await prismaService.user.findUnique({
        where: { id: created.id },
      })

      expect(found).toBeNull()
    })

    it('should enforce unique email constraint', async () => {
      await prismaService.user.create({
        data: {
          email: 'unique@example.com',
          name: 'User 1',
          age: 25,
        },
      })

      await expect(
        prismaService.user.create({
          data: {
            email: 'unique@example.com',
            name: 'User 2',
            age: 30,
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('cleanDatabase', () => {
    it('should remove all users from database', async () => {
      // Create multiple users
      await prismaService.user.createMany({
        data: [
          { email: 'user1@example.com', name: 'User 1', age: 25 },
          { email: 'user2@example.com', name: 'User 2', age: 30 },
          { email: 'user3@example.com', name: 'User 3', age: 35 },
        ],
      })

      // Verify users exist
      const beforeCount = await prismaService.user.count()
      expect(beforeCount).toBe(3)

      // Clean database
      await prismaService.cleanDatabase()

      // Verify users are gone
      const afterCount = await prismaService.user.count()
      expect(afterCount).toBe(0)
    })
  })

  describe('Transaction Support', () => {
    it('should support transactions', async () => {
      const result = await prismaService.$transaction(async (tx) => {
        const user1 = await tx.user.create({
          data: {
            email: 'tx1@example.com',
            name: 'Transaction User 1',
            age: 25,
          },
        })

        const user2 = await tx.user.create({
          data: {
            email: 'tx2@example.com',
            name: 'Transaction User 2',
            age: 30,
          },
        })

        return [user1, user2]
      })

      expect(result).toHaveLength(2)
      expect(result[0].email).toBe('tx1@example.com')
      expect(result[1].email).toBe('tx2@example.com')
    })

    it('should rollback transaction on error', async () => {
      await expect(
        prismaService.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              email: 'rollback@example.com',
              name: 'Rollback User',
              age: 25,
            },
          })

          // Throw error to rollback
          throw new Error('Transaction failed')
        })
      ).rejects.toThrow('Transaction failed')

      // Verify user was not created
      const user = await prismaService.user.findUnique({
        where: { email: 'rollback@example.com' },
      })
      expect(user).toBeNull()
    })
  })
})
