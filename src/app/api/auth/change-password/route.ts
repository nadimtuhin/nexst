import 'reflect-metadata'
import { AuthController } from '@/server/controllers/auth.controller'
import { createRouteHandler } from '@/server/core/route-handler'
import { ChangePasswordDto } from '@/server/dto/auth.dto'

// POST /api/auth/change-password - change the password (requires a bearer token;
// AuthGuard is applied on the controller method)
export const POST = createRouteHandler(
  AuthController,
  'changePassword',
  ChangePasswordDto
)
