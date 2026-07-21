import { Injectable } from '../../decorators'
import { PrismaService } from '../prisma.service'
import { CreateAuditLogDto, AuditLogFilter } from '../../audit/audit.types'

/**
 * AuditLog Repository
 * Append-only — no BaseRepository needed.
 */
@Injectable()
export class AuditLogRepository {
  protected modelName = 'auditLog'

  constructor(private readonly prisma: PrismaService) {}

  private get model(): any {
    return (this.prisma as any)[this.modelName]
  }

  async create(dto: CreateAuditLogDto) {
    return this.model.create({
      data: {
        action: dto.action,
        userId: dto.userId ?? null,
        targetId: dto.targetId ?? null,
        targetType: dto.targetType ?? null,
        metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
        ipAddress: dto.ipAddress ?? null,
        userAgent: dto.userAgent ?? null,
      },
    })
  }

  async findMany(filter: AuditLogFilter = {}) {
    const { action, userId, targetType, from, to, page = 1, limit = 50 } = filter

    const where: any = {}
    if (action) where.action = action
    if (userId !== undefined) where.userId = userId
    if (targetType) where.targetType = targetType
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = from
      if (to) where.createdAt.lte = to
    }

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.model.count({ where }),
    ])

    return { data, total, page, limit }
  }
}
