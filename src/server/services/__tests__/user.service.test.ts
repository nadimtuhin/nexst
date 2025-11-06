import 'reflect-metadata'
import { UserService } from '../user.service'
import { NotFoundException, ConflictException } from '../../filters'
import { CreateUserDto, UpdateUserDto } from '../../dto/user.dto'

describe('UserService', () => {
  let userService: UserService

  beforeEach(() => {
    userService = new UserService()
  })

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = await userService.findAll()
      expect(users).toHaveLength(2)
      expect(users[0].name).toBe('John Doe')
    })

    it('should filter users by search query', async () => {
      const users = await userService.findAll({ search: 'jane' })
      expect(users).toHaveLength(1)
      expect(users[0].name).toBe('Jane Smith')
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

      const users = await userService.findAll({ page: 1, limit: 2 })
      expect(users).toHaveLength(2)
    })
  })

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const user = await userService.findOne(1)
      expect(user.id).toBe(1)
      expect(user.name).toBe('John Doe')
    })

    it('should throw NotFoundException if user not found', async () => {
      await expect(userService.findOne(999)).rejects.toThrow(NotFoundException)
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
      expect(user.id).toBeDefined()
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
    })
  })

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      }

      const user = await userService.update(1, updateUserDto)
      expect(user.name).toBe('Updated Name')
      expect(user.email).toBe('john@example.com') // Email unchanged
    })

    it('should throw NotFoundException if user not found', async () => {
      await expect(userService.update(999, { name: 'Test' })).rejects.toThrow(
        NotFoundException
      )
    })

    it('should throw ConflictException if new email already exists', async () => {
      await expect(
        userService.update(1, { email: 'jane@example.com' })
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('remove', () => {
    it('should delete a user', async () => {
      await userService.remove(1)
      await expect(userService.findOne(1)).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException if user not found', async () => {
      await expect(userService.remove(999)).rejects.toThrow(NotFoundException)
    })
  })
})
