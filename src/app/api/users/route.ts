import 'reflect-metadata'
import { UserController } from '@/server/controllers/user.controller'
import { createRouteHandler } from '@/server/core/route-handler'
import { CreateUserDto } from '@/server/dto/user.dto'

const controller = UserController

// GET /api/users
export const GET = createRouteHandler(controller, 'getUsers')

// POST /api/users
export const POST = createRouteHandler(controller, 'createUser', CreateUserDto)
