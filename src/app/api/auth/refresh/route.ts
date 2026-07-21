import { NextRequest } from 'next/server'
import { handleRoute } from '@/server/core/route-handler'
import { AuthController } from '@/server/controllers/auth.controller'
import { RefreshTokenDto } from '@/server/dto/auth.dto'

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
export async function POST(request: NextRequest) {
  return handleRoute(AuthController, 'refresh', { request, dto: RefreshTokenDto })
}
