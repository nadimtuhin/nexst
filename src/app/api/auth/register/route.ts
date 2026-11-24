import 'reflect-metadata'
import { AuthController } from '@/server/controllers/auth.controller'
import { createRouteHandler } from '@/server/core/route-handler'
import { RegisterDto } from '@/server/dto/auth.dto'

// POST /api/auth/register - register a new user
export const POST = createRouteHandler(AuthController, 'register', RegisterDto)
