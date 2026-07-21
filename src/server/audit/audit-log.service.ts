import { Injectable } from '../decorators'
import { AuditLogRepository } from '../database/repositories/audit-log.repository'
import { LoggerService } from '../logger/logger.service'
import { CreateAuditLogDto, AuditLogFilter } from './audit.types'
import { NextRequest } from 'next/server'

/**
 * AuditLog Service
 * Thin wrapper — records audit events fire-and-forget (errors are logged, never thrown).
 */
@Injectable()
export class AuditLogService {
  private readonly logger: LoggerService

  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    logger: LoggerService
  ) {
    this.logger = logger.setContext('AuditLogService')
  }

  /**
   * Record an audit event. Never throws — failures are logged only.
   */
  async log(dto: CreateAuditLogDto): Promise<void> {
    try {
      await this.auditLogRepository.create(dto)
    } catch (error) {
      this.logger.error(
        `Failed to write audit log for action ${dto.action}: ${(error as Error).message}`
      )
    }
  }

  /**
   * Query audit logs (admin only).
   */
  async query(filter: AuditLogFilter = {}) {
    return this.auditLogRepository.findMany(filter)
  }

  /**
   * Extract IP + UserAgent from a Next.js request for audit context.
   */
  static extractRequestMeta(
    request: NextRequest
  ): { ipAddress?: string; userAgent?: string } {
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      undefined
    const userAgent = request.headers.get('user-agent') ?? undefined
    return { ipAddress, userAgent }
  }
}
