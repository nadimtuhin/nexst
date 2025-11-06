import 'reflect-metadata'
import { UserController } from '@/server/controllers/user.controller'
import { createRouteHandler } from '@/server/core/route-handler'
import { UpdateUserDto } from '@/server/dto/user.dto'

const controller = UserController

// GET /api/users/:id
export const GET = createRouteHandler(controller, 'getUser')

// PUT /api/users/:id
export const PUT = createRouteHandler(controller, 'updateUser', UpdateUserDto)

// DELETE /api/users/:id
export const DELETE = createRouteHandler(controller, 'deleteUser')
