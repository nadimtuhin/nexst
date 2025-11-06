import { Injectable } from '../decorators'
import { NotFoundException, ConflictException } from '../filters'
import { CreateUserDto, UpdateUserDto, GetUsersQueryDto } from '../dto/user.dto'

export interface User {
  id: number
  name: string
  email: string
  age?: number
  createdAt: Date
}

/**
 * User service - handles business logic for user operations
 */
@Injectable()
export class UserService {
  private users: User[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      createdAt: new Date(),
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      age: 25,
      createdAt: new Date(),
    },
  ]
  private nextId = 3

  /**
   * Get all users with optional filtering
   */
  async findAll(query?: GetUsersQueryDto): Promise<User[]> {
    let users = [...this.users]

    // Apply search filter if provided
    if (query?.search) {
      const search = query.search.toLowerCase()
      users = users.filter(
        (user) =>
          user.name.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)
      )
    }

    // Apply pagination if provided
    if (query?.page && query?.limit) {
      const start = (query.page - 1) * query.limit
      const end = start + query.limit
      users = users.slice(start, end)
    }

    return users
  }

  /**
   * Get a user by ID
   */
  async findOne(id: number): Promise<User> {
    const user = this.users.find((u) => u.id === id)

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
    const existingUser = this.users.find((u) => u.email === createUserDto.email)

    if (existingUser) {
      throw new ConflictException('User with this email already exists')
    }

    const newUser: User = {
      id: this.nextId++,
      ...createUserDto,
      createdAt: new Date(),
    }

    this.users.push(newUser)
    return newUser
  }

  /**
   * Update a user
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id)

    // Check if email is being changed and already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = this.users.find((u) => u.email === updateUserDto.email)

      if (existingUser) {
        throw new ConflictException('User with this email already exists')
      }
    }

    // Update user properties
    Object.assign(user, updateUserDto)

    return user
  }

  /**
   * Delete a user
   */
  async remove(id: number): Promise<void> {
    const index = this.users.findIndex((u) => u.id === id)

    if (index === -1) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    this.users.splice(index, 1)
  }
}
