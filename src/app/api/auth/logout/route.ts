import { NextRequest } from 'next/server'
import { handleRoute } from '@/server/core/route-handler'
import { AuthController } from '@/server/controllers/auth.controller'

/**
 * POST /api/auth/logout
 * Logout user (revoke refresh token)
 */
export async function POST(request: NextRequest) {
  return handleRoute(AuthController, 'logout', { request })
}
