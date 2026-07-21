import 'reflect-metadata'
import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/server/container/container'
import { AuditLogService } from '@/server/audit'
import { AuthService } from '@/server/auth/auth.service'
import { UserRole } from '@prisma/client'

/**
 * GET /api/audit-logs
 * Admin-only endpoint to query audit logs.
 * Query params: action, userId, targetType, from, to, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 })
    }

    const authService = container.resolve(AuthService)
    const user = await authService.validateToken(token)

    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const q = (k: string) => url.searchParams.get(k) ?? undefined

    const filter = {
      action: q('action') as any,
      userId: q('userId') ? parseInt(q('userId')!, 10) : undefined,
      targetType: q('targetType'),
      from: q('from') ? new Date(q('from')!) : undefined,
      to: q('to') ? new Date(q('to')!) : undefined,
      page: q('page') ? parseInt(q('page')!, 10) : 1,
      limit: q('limit') ? parseInt(q('limit')!, 10) : 50,
    }

    const auditLogService = container.resolve(AuditLogService)
    const result = await auditLogService.query(filter)

    return NextResponse.json({ data: result.data, meta: { total: result.total, page: result.page, limit: result.limit } })
  } catch (error: any) {
    const status = error.statusCode ?? 500
    return NextResponse.json({ statusCode: status, message: error.message ?? 'Internal server error' }, { status })
  }
}
