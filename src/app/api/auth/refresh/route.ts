import 'reflect-metadata'
import { AuthController } from '@/server/controllers/auth.controller'
import { createRouteHandler } from '@/server/core/route-handler'
import { RefreshTokenDto } from '@/server/dto/auth.dto'

// POST /api/auth/refresh - rotate the refresh token and issue a new access token
export const POST = createRouteHandler(AuthController, 'refresh', RefreshTokenDto)
