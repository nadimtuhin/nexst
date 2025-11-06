import 'reflect-metadata'
import { container } from 'tsyringe'
import { UserRepository } from '../user.repository'
import { PrismaService } from '../../prisma.service'
import { LoggerService } from '../../../logger/logger.service'

describe('UserRepository', () => {
  let userRepository: UserRepository
  let prismaService: PrismaService

  beforeAll(() => {
    // Register services
    if (!container.isRegistered(LoggerService)) {
      container.registerSingleton(LoggerService)
    }
    if (!container.isRegistered(PrismaService)) {
      container.registerSingleton(PrismaService)
    }
  })

  beforeEach(async () => {
    prismaService = container.resolve(PrismaService)
    userRepository = container.resolve(UserRepository)
    await prismaService.onModuleInit()
    await prismaService.cleanDatabase()
  })

  afterEach(async () => {
    await prismaService.cleanDatabase()
  })

  afterAll(async () => {
    await prismaService.onModuleDestroy()
    container.clearInstances()
  })

  describe('Basic CRUD Operations (from BaseRepository)', () => {
    describe('findAll', () => {
      it('should return all users', async () => {
        await prismaService.user.createMany({
          data: [
            { email: 'user1@example.com', name: 'User 1', age: 25 },
            { email: 'user2@example.com', name: 'User 2', age: 30 },
            { email: 'user3@example.com', name: 'User 3', age: 35 },
          ],
        })

        const users = await userRepository.findAll()
        expect(users).toHaveLength(3)
      })

      it('should return empty array when no users exist', async () => {
        const users = await userRepository.findAll()
        expect(users).toEqual([])
      })

      it('should support ordering', async () => {
        await prismaService.user.createMany({
          data: [
            { email: 'a@example.com', name: 'Alice', age: 30 },
            { email: 'b@example.com', name: 'Bob', age: 25 },
            { email: 'c@example.com', name: 'Charlie', age: 35 },
          ],
        })

        const users = await userRepository.findAll({
          orderBy: { age: 'asc' },
        })

        expect(users[0].age).toBe(25)
        expect(users[1].age).toBe(30)
        expect(users[2].age).toBe(35)
      })
    })

    describe('findById', () => {
      it('should find a user by id', async () => {
        const created = await prismaService.user.create({
          data: { email: 'find@example.com', name: 'Find User', age: 25 },
        })

        const found = await userRepository.findById(created.id)
        expect(found).toMatchObject({
          id: created.id,
          email: 'find@example.com',
          name: 'Find User',
          age: 25,
        })
      })

      it('should return null for non-existent id', async () => {
        const found = await userRepository.findById(999999)
        expect(found).toBeNull()
      })
    })

    describe('create', () => {
      it('should create a new user', async () => {
        const user = await userRepository.create({
          email: 'create@example.com',
          name: 'Create User',
          age: 28,
        })

        expect(user).toMatchObject({
          email: 'create@example.com',
          name: 'Create User',
          age: 28,
        })
        expect(user.id).toBeDefined()
        expect(user.createdAt).toBeInstanceOf(Date)
        expect(user.updatedAt).toBeInstanceOf(Date)
      })

      it('should create a user without age', async () => {
        const user = await userRepository.create({
          email: 'noage@example.com',
          name: 'No Age User',
        })

        expect(user.age).toBeNull()
      })
    })

    describe('update', () => {
      it('should update a user', async () => {
        const created = await userRepository.create({
          email: 'update@example.com',
          name: 'Update User',
          age: 30,
        })

        const updated = await userRepository.update(created.id, {
          name: 'Updated Name',
          age: 31,
        })

        expect(updated).toMatchObject({
          id: created.id,
          email: 'update@example.com',
          name: 'Updated Name',
          age: 31,
        })
      })

      it('should throw error when updating non-existent user', async () => {
        await expect(
          userRepository.update(999999, { name: 'Test' })
        ).rejects.toThrow()
      })
    })

    describe('delete', () => {
      it('should delete a user', async () => {
        const created = await userRepository.create({
          email: 'delete@example.com',
          name: 'Delete User',
          age: 35,
        })

        await userRepository.delete(created.id)

        const found = await userRepository.findById(created.id)
        expect(found).toBeNull()
      })

      it('should throw error when deleting non-existent user', async () => {
        await expect(userRepository.delete(999999)).rejects.toThrow()
      })
    })

    describe('count', () => {
      it('should count all users', async () => {
        await prismaService.user.createMany({
          data: [
            { email: 'count1@example.com', name: 'User 1', age: 25 },
            { email: 'count2@example.com', name: 'User 2', age: 30 },
            { email: 'count3@example.com', name: 'User 3', age: 35 },
          ],
        })

        const count = await userRepository.count()
        expect(count).toBe(3)
      })

      it('should return 0 when no users exist', async () => {
        const count = await userRepository.count()
        expect(count).toBe(0)
      })
    })

    describe('exists', () => {
      it('should return true if user exists', async () => {
        const created = await userRepository.create({
          email: 'exists@example.com',
          name: 'Exists User',
          age: 25,
        })

        const exists = await userRepository.exists({ id: created.id })
        expect(exists).toBe(true)
      })

      it('should return false if user does not exist', async () => {
        const exists = await userRepository.exists({ id: 999999 })
        expect(exists).toBe(false)
      })
    })
  })

  describe('Pagination (from BaseRepository)', () => {
    beforeEach(async () => {
      // Create 15 users for pagination tests
      const users = Array.from({ length: 15 }, (_, i) => ({
        email: `user${i + 1}@example.com`,
        name: `User ${i + 1}`,
        age: 20 + i,
      }))
      await prismaService.user.createMany({ data: users })
    })

    it('should return paginated results', async () => {
      const result = await userRepository.findWithPagination(1, 5)

      expect(result.data).toHaveLength(5)
      expect(result.meta).toMatchObject({
        page: 1,
        limit: 5,
        total: 15,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: false,
      })
    })

    it('should return second page', async () => {
      const result = await userRepository.findWithPagination(2, 5)

      expect(result.data).toHaveLength(5)
      expect(result.meta).toMatchObject({
        page: 2,
        limit: 5,
        total: 15,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: true,
      })
    })

    it('should return last page', async () => {
      const result = await userRepository.findWithPagination(3, 5)

      expect(result.data).toHaveLength(5)
      expect(result.meta).toMatchObject({
        page: 3,
        limit: 5,
        total: 15,
        totalPages: 3,
        hasNextPage: false,
        hasPrevPage: true,
      })
    })

    it('should handle empty last page', async () => {
      const result = await userRepository.findWithPagination(4, 5)

      expect(result.data).toHaveLength(0)
      expect(result.meta).toMatchObject({
        page: 4,
        limit: 5,
        total: 15,
        totalPages: 3,
        hasNextPage: false,
        hasPrevPage: true,
      })
    })
  })

  describe('Domain-Specific Methods', () => {
    describe('findByEmail', () => {
      it('should find user by email', async () => {
        await userRepository.create({
          email: 'find@example.com',
          name: 'Find User',
          age: 25,
        })

        const found = await userRepository.findByEmail('find@example.com')
        expect(found).toMatchObject({
          email: 'find@example.com',
          name: 'Find User',
        })
      })

      it('should return null for non-existent email', async () => {
        const found = await userRepository.findByEmail('nonexistent@example.com')
        expect(found).toBeNull()
      })

      it('should be case-sensitive', async () => {
        await userRepository.create({
          email: 'test@example.com',
          name: 'Test User',
          age: 25,
        })

        const found = await userRepository.findByEmail('TEST@example.com')
        expect(found).toBeNull()
      })
    })

    describe('emailExists', () => {
      it('should return true if email exists', async () => {
        await userRepository.create({
          email: 'exists@example.com',
          name: 'Exists User',
          age: 25,
        })

        const exists = await userRepository.emailExists('exists@example.com')
        expect(exists).toBe(true)
      })

      it('should return false if email does not exist', async () => {
        const exists = await userRepository.emailExists('nonexistent@example.com')
        expect(exists).toBe(false)
      })

      it('should exclude specified user id', async () => {
        const user = await userRepository.create({
          email: 'exclude@example.com',
          name: 'Exclude User',
          age: 25,
        })

        // Should return false when excluding the only user with this email
        const exists = await userRepository.emailExists(
          'exclude@example.com',
          user.id
        )
        expect(exists).toBe(false)
      })

      it('should return true if email exists for different user', async () => {
        const user1 = await userRepository.create({
          email: 'user1@example.com',
          name: 'User 1',
          age: 25,
        })

        await userRepository.create({
          email: 'user2@example.com',
          name: 'User 2',
          age: 30,
        })

        const exists = await userRepository.emailExists(
          'user2@example.com',
          user1.id
        )
        expect(exists).toBe(true)
      })
    })

    describe('findByAgeRange', () => {
      beforeEach(async () => {
        await prismaService.user.createMany({
          data: [
            { email: 'young@example.com', name: 'Young User', age: 20 },
            { email: 'mid1@example.com', name: 'Mid User 1', age: 25 },
            { email: 'mid2@example.com', name: 'Mid User 2', age: 30 },
            { email: 'old@example.com', name: 'Old User', age: 40 },
            { email: 'noage@example.com', name: 'No Age User', age: null },
          ],
        })
      })

      it('should find users in age range', async () => {
        const users = await userRepository.findByAgeRange(25, 35)
        expect(users).toHaveLength(2)
        expect(users.every((u) => u.age! >= 25 && u.age! <= 35)).toBe(true)
      })

      it('should find users with minimum age only', async () => {
        const users = await userRepository.findByAgeRange(30)
        expect(users).toHaveLength(2)
        expect(users.every((u) => u.age! >= 30)).toBe(true)
      })

      it('should find users with maximum age only', async () => {
        const users = await userRepository.findByAgeRange(undefined, 25)
        expect(users).toHaveLength(2)
        expect(users.every((u) => u.age! <= 25)).toBe(true)
      })

      it('should return all users with age when no range specified', async () => {
        const users = await userRepository.findByAgeRange()
        expect(users).toHaveLength(4) // Excludes null age
      })
    })

    describe('findUsers', () => {
      beforeEach(async () => {
        await prismaService.user.createMany({
          data: [
            { email: 'alice@example.com', name: 'Alice Smith', age: 25 },
            { email: 'bob@example.com', name: 'Bob Johnson', age: 30 },
            { email: 'charlie@example.com', name: 'Charlie Brown', age: 35 },
            { email: 'david@example.com', name: 'David Wilson', age: 40 },
            { email: 'eve@example.com', name: 'Eve Davis', age: 45 },
          ],
        })
      })

      it('should find users with pagination', async () => {
        const result = await userRepository.findUsers({ page: 1, limit: 3 })

        expect(result.data).toHaveLength(3)
        expect(result.meta).toMatchObject({
          page: 1,
          limit: 3,
          total: 5,
          totalPages: 2,
        })
      })

      it('should search by name', async () => {
        const result = await userRepository.findUsers({ search: 'alice' })

        expect(result.data).toHaveLength(1)
        expect(result.data[0].name).toBe('Alice Smith')
      })

      it('should search by email', async () => {
        const result = await userRepository.findUsers({ search: 'bob@' })

        expect(result.data).toHaveLength(1)
        expect(result.data[0].email).toBe('bob@example.com')
      })

      it('should search case-insensitively', async () => {
        const result = await userRepository.findUsers({ search: 'CHARLIE' })

        expect(result.data).toHaveLength(1)
        expect(result.data[0].name).toBe('Charlie Brown')
      })

      it('should combine search with pagination', async () => {
        const result = await userRepository.findUsers({
          search: 'smith', // Only matches Alice Smith
          page: 1,
          limit: 10,
        })

        expect(result.data).toHaveLength(1)
        expect(result.meta.total).toBe(1)
      })

      it('should return empty results for no matches', async () => {
        const result = await userRepository.findUsers({ search: 'xyz' })

        expect(result.data).toHaveLength(0)
        expect(result.meta.total).toBe(0)
      })

      it('should return all users when no filters provided', async () => {
        const result = await userRepository.findUsers({})

        expect(result.data).toHaveLength(5)
        expect(result.meta.total).toBe(5)
      })
    })
  })

  describe('Bulk Operations (from BaseRepository)', () => {
    describe('createMany', () => {
      it('should create multiple users', async () => {
        const count = await userRepository.createMany([
          { email: 'bulk1@example.com', name: 'Bulk User 1', age: 25 },
          { email: 'bulk2@example.com', name: 'Bulk User 2', age: 30 },
          { email: 'bulk3@example.com', name: 'Bulk User 3', age: 35 },
        ])

        expect(count).toBe(3)

        const users = await userRepository.findAll()
        expect(users).toHaveLength(3)
      })
    })

    describe('deleteMany', () => {
      it('should delete multiple users by condition', async () => {
        await prismaService.user.createMany({
          data: [
            { email: 'delete1@example.com', name: 'Delete User 1', age: 25 },
            { email: 'delete2@example.com', name: 'Delete User 2', age: 30 },
            { email: 'keep@example.com', name: 'Keep User', age: 40 },
          ],
        })

        const count = await userRepository.deleteMany({
          age: { lte: 30 },
        })

        expect(count).toBe(2)

        const remaining = await userRepository.findAll()
        expect(remaining).toHaveLength(1)
        expect(remaining[0].email).toBe('keep@example.com')
      })
    })

    describe('updateMany', () => {
      it('should update multiple users', async () => {
        await prismaService.user.createMany({
          data: [
            { email: 'update1@example.com', name: 'Update User 1', age: 25 },
            { email: 'update2@example.com', name: 'Update User 2', age: 30 },
            { email: 'skip@example.com', name: 'Skip User', age: 40 },
          ],
        })

        const count = await userRepository.updateMany(
          { age: { lte: 30 } },
          { age: 99 }
        )

        expect(count).toBe(2)

        const updated = await userRepository.findAll({
          where: { age: 99 },
        })
        expect(updated).toHaveLength(2)
      })
    })
  })

  describe('Upsert (from BaseRepository)', () => {
    it('should create user if not exists', async () => {
      const user = await userRepository.upsert(
        { email: 'upsert@example.com' },
        { email: 'upsert@example.com', name: 'Upsert User', age: 25 },
        { age: 30 }
      )

      expect(user).toMatchObject({
        email: 'upsert@example.com',
        name: 'Upsert User',
        age: 25,
      })
    })

    it('should update user if exists', async () => {
      const created = await userRepository.create({
        email: 'upsert@example.com',
        name: 'Original User',
        age: 25,
      })

      const updated = await userRepository.upsert(
        { email: 'upsert@example.com' },
        { email: 'upsert@example.com', name: 'New User', age: 99 },
        { age: 30 }
      )

      expect(updated).toMatchObject({
        id: created.id,
        email: 'upsert@example.com',
        name: 'Original User', // Name not updated
        age: 30, // Age updated
      })
    })
  })
})
