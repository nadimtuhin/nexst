import 'reflect-metadata'
import { AuthController } from '@/server/controllers/auth.controller'
import { createRouteHandler } from '@/server/core/route-handler'

// GET /api/auth/me - current authenticated user (requires a bearer token;
// AuthGuard is applied on the controller method)
export const GET = createRouteHandler(AuthController, 'me')
