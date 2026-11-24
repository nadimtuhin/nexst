import 'reflect-metadata'
import { AuthController } from '@/server/controllers/auth.controller'
import { createRouteHandler } from '@/server/core/route-handler'
import { LoginDto } from '@/server/dto/auth.dto'

// POST /api/auth/login - log in a user
export const POST = createRouteHandler(AuthController, 'login', LoginDto)
