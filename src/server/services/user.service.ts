import { User } from '@prisma/client'
import { Injectable } from '../decorators'
import { NotFoundException, ConflictException } from '../filters'
import { CreateUserDto, UpdateUserDto, GetUsersQueryDto } from '../dto/user.dto'
import { UserRepository } from '../database/repositories/user.repository'

/**
 * User service - handles business logic for user operations
 * Now uses repository pattern with database persistence
 */
@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Get all users with optional filtering
   */
  async findAll(query?: GetUsersQueryDto): Promise<User[]> {
    const page = query?.page ? parseInt(query.page as any, 10) : undefined
    const limit = query?.limit ? parseInt(query.limit as any, 10) : undefined
    const search = query?.search

    // If pagination is requested, use pagination
    if (page && limit) {
      const result = await this.userRepository.findUsers({
        search,
        page,
        limit,
      })
      return result.data
    }

    // Otherwise, find all with optional search
    if (search) {
      const result = await this.userRepository.findUsers({ search })
      return result.data
    }

    // No filters, return all
    return this.userRepository.findAll()
  }

  /**
   * Get a user by ID
   */
  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findById(id)

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    return user
  }

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const emailExists = await this.userRepository.emailExists(
      createUserDto.email
    )

    if (emailExists) {
      throw new ConflictException('User with this email already exists')
    }

    return this.userRepository.create(createUserDto)
  }

  /**
   * Update a user
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    // Check if user exists
    const user = await this.findOne(id)

    // Check if email is being changed and already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailExists = await this.userRepository.emailExists(
        updateUserDto.email,
        id
      )

      if (emailExists) {
        throw new ConflictException('User with this email already exists')
      }
    }

    return this.userRepository.update(id, updateUserDto)
  }

  /**
   * Delete a user
   */
  async remove(id: number): Promise<void> {
    // Check if user exists
    await this.findOne(id)

    await this.userRepository.delete(id)
  }
}
