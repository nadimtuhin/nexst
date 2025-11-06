import { NextRequest } from 'next/server'
import { handleRoute } from '@/server/core/route-handler'
import { AuthController } from '@/server/controllers/auth.controller'
import { AuthGuard } from '@/server/guards/auth.guard'

/**
 * POST /api/auth/change-password
 * Change user password
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  return handleRoute(AuthController, 'changePassword', {
    request,
    guards: [AuthGuard],
  })
}
