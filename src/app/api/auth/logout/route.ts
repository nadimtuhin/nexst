import 'reflect-metadata'
import { AuthController } from '@/server/controllers/auth.controller'
import { createRouteHandler } from '@/server/core/route-handler'
import { RefreshTokenDto } from '@/server/dto/auth.dto'

// POST /api/auth/logout - revoke a refresh token
export const POST = createRouteHandler(AuthController, 'logout', RefreshTokenDto)
