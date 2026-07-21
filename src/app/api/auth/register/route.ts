import { NextRequest } from 'next/server'
import { handleRoute } from '@/server/core/route-handler'
import { AuthController } from '@/server/controllers/auth.controller'
import { RegisterDto } from '@/server/dto/auth.dto'

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(request: NextRequest) {
  return handleRoute(AuthController, 'register', { request, dto: RegisterDto })
}
