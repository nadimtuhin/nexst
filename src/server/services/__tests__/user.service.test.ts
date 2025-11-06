import 'reflect-metadata'
import { container } from 'tsyringe'
import { UserService } from '../user.service'
import { UserRepository } from '../../database/repositories/user.repository'
import { PrismaService } from '../../database/prisma.service'
import { LoggerService } from '../../logger/logger.service'
import { NotFoundException, ConflictException } from '../../filters'
import { CreateUserDto, UpdateUserDto } from '../../dto/user.dto'

describe('UserService', () => {
  let userService: UserService
  let prismaService: PrismaService
  let johnDoeId: number
  let janeSmithId: number

  beforeAll(() => {
    // Register services
    if (!container.isRegistered(LoggerService)) {
      container.registerSingleton(LoggerService)
    }
    if (!container.isRegistered(PrismaService)) {
      container.registerSingleton(PrismaService)
    }
    if (!container.isRegistered(UserRepository)) {
      container.registerSingleton(UserRepository)
    }
    if (!container.isRegistered(UserService)) {
      container.registerSingleton(UserService)
    }
  })

  beforeEach(async () => {
    prismaService = container.resolve(PrismaService)
    userService = container.resolve(UserService)

    await prismaService.onModuleInit()
    await prismaService.cleanDatabase()

    // Create test data
    const johnDoe = await prismaService.user.create({
      data: {
        email: 'john@example.com',
        name: 'John Doe',
        age: 30,
      },
    })
    johnDoeId = johnDoe.id

    const janeSmith = await prismaService.user.create({
      data: {
        email: 'jane@example.com',
        name: 'Jane Smith',
        age: 25,
      },
    })
    janeSmithId = janeSmith.id
  })

  afterEach(async () => {
    await prismaService.cleanDatabase()
  })

  afterAll(async () => {
    await prismaService.onModuleDestroy()
    container.clearInstances()
  })

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = await userService.findAll()
      expect(users).toHaveLength(2)
      expect(users.some((u) => u.name === 'John Doe')).toBe(true)
      expect(users.some((u) => u.name === 'Jane Smith')).toBe(true)
    })

    it('should filter users by search query', async () => {
      const users = await userService.findAll({ search: 'jane' })
      expect(users).toHaveLength(1)
      expect(users[0].name).toBe('Jane Smith')
    })

    it('should search case-insensitively', async () => {
      const users = await userService.findAll({ search: 'JOHN' })
      expect(users).toHaveLength(1)
      expect(users[0].name).toBe('John Doe')
    })

    it('should search by email', async () => {
      const users = await userService.findAll({ search: 'jane@' })
      expect(users).toHaveLength(1)
      expect(users[0].email).toBe('jane@example.com')
    })

    it('should paginate users', async () => {
      // Create more users for pagination test
      await userService.create({
        name: 'User 3',
        email: 'user3@example.com',
        age: 20,
      })
      await userService.create({
        name: 'User 4',
        email: 'user4@example.com',
        age: 22,
      })
      await userService.create({
        name: 'User 5',
        email: 'user5@example.com',
        age: 24,
      })

      const page1 = await userService.findAll({ page: '1', limit: '2' })
      expect(page1).toHaveLength(2)

      const page2 = await userService.findAll({ page: '2', limit: '2' })
      expect(page2).toHaveLength(2)

      const page3 = await userService.findAll({ page: '3', limit: '2' })
      expect(page3).toHaveLength(1) // Only 1 user on last page
    })

    it('should combine search with pagination', async () => {
      // Create users with similar names
      await userService.create({
        name: 'John Smith',
        email: 'johnsmith@example.com',
        age: 28,
      })
      await userService.create({
        name: 'Johnny Appleseed',
        email: 'johnny@example.com',
        age: 32,
      })

      const users = await userService.findAll({
        search: 'john',
        page: '1',
        limit: '2',
      })

      expect(users).toHaveLength(2)
      expect(users.every((u) => u.name.toLowerCase().includes('john'))).toBe(
        true
      )
    })

    it('should return empty array when no users match search', async () => {
      const users = await userService.findAll({ search: 'nonexistent' })
      expect(users).toEqual([])
    })
  })

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const user = await userService.findOne(johnDoeId)
      expect(user.id).toBe(johnDoeId)
      expect(user.name).toBe('John Doe')
      expect(user.email).toBe('john@example.com')
    })

    it('should throw NotFoundException if user not found', async () => {
      await expect(userService.findOne(999999)).rejects.toThrow(
        NotFoundException
      )
      await expect(userService.findOne(999999)).rejects.toThrow(
        'User with ID 999999 not found'
      )
    })
  })

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        name: 'New User',
        email: 'newuser@example.com',
        age: 28,
      }

      const user = await userService.create(createUserDto)
      expect(user.name).toBe('New User')
      expect(user.email).toBe('newuser@example.com')
      expect(user.age).toBe(28)
      expect(user.id).toBeDefined()
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)
    })

    it('should create a user without age', async () => {
      const createUserDto: CreateUserDto = {
        name: 'No Age User',
        email: 'noage@example.com',
      }

      const user = await userService.create(createUserDto)
      expect(user.name).toBe('No Age User')
      expect(user.age).toBeNull()
    })

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Duplicate User',
        email: 'john@example.com', // Already exists
        age: 30,
      }

      await expect(userService.create(createUserDto)).rejects.toThrow(
        ConflictException
      )
      await expect(userService.create(createUserDto)).rejects.toThrow(
        'User with this email already exists'
      )
    })

    it('should persist user to database', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Persist User',
        email: 'persist@example.com',
        age: 35,
      }

      const created = await userService.create(createUserDto)

      // Verify it persists by fetching directly from database
      const found = await prismaService.user.findUnique({
        where: { id: created.id },
      })

      expect(found).toBeDefined()
      expect(found?.email).toBe('persist@example.com')
    })
  })

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      }

      const user = await userService.update(johnDoeId, updateUserDto)
      expect(user.name).toBe('Updated Name')
      expect(user.email).toBe('john@example.com') // Email unchanged
      expect(user.age).toBe(30) // Age unchanged
    })

    it('should update multiple fields', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'New Name',
        age: 35,
      }

      const user = await userService.update(johnDoeId, updateUserDto)
      expect(user.name).toBe('New Name')
      expect(user.age).toBe(35)
    })

    it('should update email if not duplicate', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'newemail@example.com',
      }

      const user = await userService.update(johnDoeId, updateUserDto)
      expect(user.email).toBe('newemail@example.com')
    })

    it('should throw NotFoundException if user not found', async () => {
      await expect(
        userService.update(999999, { name: 'Test' })
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw ConflictException if new email already exists', async () => {
      await expect(
        userService.update(johnDoeId, { email: 'jane@example.com' })
      ).rejects.toThrow(ConflictException)
      await expect(
        userService.update(johnDoeId, { email: 'jane@example.com' })
      ).rejects.toThrow('User with this email already exists')
    })

    it('should allow updating to same email', async () => {
      // Should not throw conflict when updating to the same email
      const user = await userService.update(johnDoeId, {
        email: 'john@example.com',
        name: 'John Updated',
      })

      expect(user.email).toBe('john@example.com')
      expect(user.name).toBe('John Updated')
    })

    it('should persist update to database', async () => {
      await userService.update(johnDoeId, { age: 99 })

      // Verify it persists by fetching directly from database
      const found = await prismaService.user.findUnique({
        where: { id: johnDoeId },
      })

      expect(found?.age).toBe(99)
    })
  })

  describe('remove', () => {
    it('should delete a user', async () => {
      await userService.remove(johnDoeId)

      // Verify user is deleted
      await expect(userService.findOne(johnDoeId)).rejects.toThrow(
        NotFoundException
      )
    })

    it('should throw NotFoundException if user not found', async () => {
      await expect(userService.remove(999999)).rejects.toThrow(
        NotFoundException
      )
    })

    it('should persist deletion to database', async () => {
      await userService.remove(johnDoeId)

      // Verify deletion by querying database directly
      const found = await prismaService.user.findUnique({
        where: { id: johnDoeId },
      })

      expect(found).toBeNull()
    })

    it('should not affect other users', async () => {
      await userService.remove(johnDoeId)

      // Jane should still exist
      const jane = await userService.findOne(janeSmithId)
      expect(jane.name).toBe('Jane Smith')
    })
  })

  describe('Business Logic', () => {
    it('should maintain data integrity across operations', async () => {
      // Create a user
      const created = await userService.create({
        name: 'Test User',
        email: 'test@example.com',
        age: 25,
      })

      // Update the user
      const updated = await userService.update(created.id, { age: 30 })
      expect(updated.id).toBe(created.id)
      expect(updated.age).toBe(30)

      // Find the user
      const found = await userService.findOne(created.id)
      expect(found.age).toBe(30)

      // Delete the user
      await userService.remove(created.id)
      await expect(userService.findOne(created.id)).rejects.toThrow(
        NotFoundException
      )
    })

    it('should handle concurrent operations safely', async () => {
      // Create multiple users concurrently
      const promises = Array.from({ length: 5 }, (_, i) =>
        userService.create({
          name: `Concurrent User ${i}`,
          email: `concurrent${i}@example.com`,
          age: 20 + i,
        })
      )

      const users = await Promise.all(promises)
      expect(users).toHaveLength(5)

      // Verify all users exist
      const allUsers = await userService.findAll()
      expect(allUsers).toHaveLength(7) // 5 new + 2 initial
    })
  })
})
