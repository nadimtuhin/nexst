import { NextRequest } from 'next/server'
import { handleRoute } from '@/server/core/route-handler'
import { AuthController } from '@/server/controllers/auth.controller'
import { AuthGuard } from '@/server/guards/auth.guard'

/**
 * GET /api/auth/me
 * Get current authenticated user
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  return handleRoute(AuthController, 'me', {
    request,
    guards: [AuthGuard],
  })
}
