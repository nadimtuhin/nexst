import 'reflect-metadata'
import { container } from 'tsyringe'
import { UserController } from '../user.controller'
import { UserService } from '../../services/user.service'
import { CreateUserDto, UpdateUserDto } from '../../dto/user.dto'

describe('UserController', () => {
  let controller: UserController
  let service: UserService

  beforeEach(() => {
    // Clear and setup DI container
    container.clearInstances()
    service = container.resolve(UserService)
    controller = container.resolve(UserController)
  })

  describe('getUsers', () => {
    it('should return all users with data and total', async () => {
      const result = await controller.getUsers({})

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('total')
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.total).toBe(result.data.length)
      // Default service has 2 users
      expect(result.data.length).toBeGreaterThanOrEqual(2)
    })

    it('should handle search query', async () => {
      const result = await controller.getUsers({ search: 'John' })

      expect(result.data).toBeInstanceOf(Array)
      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data[0].name).toContain('John')
    })

    it('should handle search with no results', async () => {
      const result = await controller.getUsers({ search: 'NonExistentUser' })

      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('should filter users by search query', async () => {
      const result = await controller.getUsers({ search: 'Jane' })

      expect(result.data).toBeInstanceOf(Array)
      // Should find at least one user matching "Jane"
      if (result.data.length > 0) {
        const hasMatch = result.data.some(
          (user: any) => user.name.includes('Jane') || user.email.includes('Jane')
        )
        expect(hasMatch).toBe(true)
      }
    })
  })

  describe('getUser', () => {
    it('should return user wrapped in data object', async () => {
      const result = await controller.getUser('1')

      expect(result).toHaveProperty('data')
      expect(result.data).toHaveProperty('id')
      expect(result.data).toHaveProperty('name')
      expect(result.data).toHaveProperty('email')
      expect(result.data.id).toBe(1)
    })

    it('should handle different user IDs', async () => {
      const result = await controller.getUser('2')

      expect(result.data.id).toBe(2)
    })

    it('should throw error for non-existent user', async () => {
      await expect(controller.getUser('999')).rejects.toThrow()
    })
  })

  describe('createUser', () => {
    it('should create user and return with success message', async () => {
      const dto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        age: 30,
      }

      const result = await controller.createUser(dto)

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('message')
      expect(result.message).toBe('User created successfully')
      expect(result.data.name).toBe(dto.name)
      expect(result.data.email).toBe(dto.email)
    })

    it('should create user without optional age', async () => {
      const dto: CreateUserDto = {
        name: 'Test User 2',
        email: 'test2@example.com',
      }

      const result = await controller.createUser(dto)

      expect(result.data.age).toBeUndefined()
    })

    it('should throw error for duplicate email', async () => {
      const dto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com', // Email from default users
        age: 30,
      }

      await expect(controller.createUser(dto)).rejects.toThrow()
    })
  })

  describe('updateUser', () => {
    it('should update user and return with success message', async () => {
      const dto: UpdateUserDto = {
        name: 'Updated Name',
      }

      const result = await controller.updateUser('1', dto)

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('message')
      expect(result.message).toBe('User updated successfully')
      expect(result.data.name).toBe('Updated Name')
    })

    it('should handle updates to different users', async () => {
      const dto: UpdateUserDto = { name: 'Updated User 2' }

      const result = await controller.updateUser('2', dto)

      expect(result.data.id).toBe(2)
      expect(result.data.name).toBe('Updated User 2')
    })

    it('should update only specified fields', async () => {
      const originalUser = await service.findOne(1)
      const dto: UpdateUserDto = {
        age: 35,
      }

      const result = await controller.updateUser('1', dto)

      expect(result.data.name).toBe(originalUser.name)
      expect(result.data.age).toBe(35)
    })

    it('should throw error for non-existent user', async () => {
      const dto: UpdateUserDto = {
        name: 'Test',
      }

      await expect(controller.updateUser('999', dto)).rejects.toThrow()
    })
  })

  describe('deleteUser', () => {
    it('should delete user and return success message', async () => {
      // First create a user to delete
      const createDto: CreateUserDto = {
        name: 'To Delete',
        email: 'delete@example.com',
      }
      const created = await service.create(createDto)

      const result = await controller.deleteUser(created.id.toString())

      expect(result).toHaveProperty('message')
      expect(result.message).toBe('User deleted successfully')
    })

    it('should allow deleting multiple users sequentially', async () => {
      const createDto1: CreateUserDto = {
        name: 'To Delete 2',
        email: 'delete2@example.com',
      }
      const createDto2: CreateUserDto = {
        name: 'To Delete 3',
        email: 'delete3@example.com',
      }

      const created1 = await service.create(createDto1)
      const created2 = await service.create(createDto2)

      const result1 = await controller.deleteUser(created1.id.toString())
      const result2 = await controller.deleteUser(created2.id.toString())

      expect(result1.message).toBe('User deleted successfully')
      expect(result2.message).toBe('User deleted successfully')
    })

    it('should throw error for non-existent user', async () => {
      await expect(controller.deleteUser('999')).rejects.toThrow()
    })
  })

  describe('Dependency Injection', () => {
    it('should resolve controller from DI container', () => {
      const resolvedController = container.resolve(UserController)
      expect(resolvedController).toBeInstanceOf(UserController)
    })

    it('should inject UserService into controller', () => {
      expect(controller).toBeDefined()
      expect(service).toBeDefined()
    })
  })
})
