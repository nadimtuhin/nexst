import { NextRequest } from 'next/server'
import { handleRoute } from '@/server/core/route-handler'
import { AuthController } from '@/server/controllers/auth.controller'

/**
 * POST /api/auth/login
 * User login
 */
export async function POST(request: NextRequest) {
  return handleRoute(AuthController, 'login', { request })
}
