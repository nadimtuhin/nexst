import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '../decorators'
import { UserService } from '../services/user.service'
import { CreateUserDto, UpdateUserDto, GetUsersQueryDto } from '../dto/user.dto'

/**
 * User controller - handles HTTP requests for user operations
 */
@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * GET /users - Get all users
   */
  @Get()
  async getUsers(@Query() query: GetUsersQueryDto) {
    const users = await this.userService.findAll(query)
    return {
      data: users,
      total: users.length,
    }
  }

  /**
   * GET /users/:id - Get a user by ID
   */
  @Get('/:id')
  async getUser(@Param('id') id: string) {
    const userId = parseInt(id, 10)
    const user = await this.userService.findOne(userId)
    return { data: user }
  }

  /**
   * POST /users - Create a new user
   */
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto)
    return {
      data: user,
      message: 'User created successfully',
    }
  }

  /**
   * PUT /users/:id - Update a user
   */
  @Put('/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ) {
    const userId = parseInt(id, 10)
    const user = await this.userService.update(userId, updateUserDto)
    return {
      data: user,
      message: 'User updated successfully',
    }
  }

  /**
   * DELETE /users/:id - Delete a user
   */
  @Delete('/:id')
  async deleteUser(@Param('id') id: string) {
    const userId = parseInt(id, 10)
    await this.userService.remove(userId)
    return {
      message: 'User deleted successfully',
    }
  }
}
