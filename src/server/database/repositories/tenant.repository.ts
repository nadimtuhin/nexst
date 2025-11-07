import { Tenant, TenantStatus } from '@prisma/client'
import { Injectable } from '../../decorators'
import { PrismaService } from '../prisma.service'
import { BaseRepository } from './base.repository'

export interface FindTenantsOptions {
  search?: string
  status?: TenantStatus
  page?: number
  limit?: number
}

export interface CreateTenantData {
  name: string
  slug: string
  domain?: string
  status?: TenantStatus
  settings?: string
}

export interface UpdateTenantData {
  name?: string
  slug?: string
  domain?: string
  status?: TenantStatus
  settings?: string
}

/**
 * Tenant Repository
 * Handles all database operations for Tenant model
 */
@Injectable()
export class TenantRepository extends BaseRepository<Tenant> {
  protected modelName = 'tenant'

  constructor(prisma: PrismaService) {
    super(prisma)
  }

  /**
   * Find tenants with search and pagination
   */
  async findTenants(options: FindTenantsOptions = {}) {
    const { search, status, page = 1, limit = 10 } = options

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
        { domain: { contains: search } },
      ]
    }

    if (status) {
      where.status = status
    }

    return this.findWithPagination(page, limit, { where })
  }

  /**
   * Find tenant by slug
   */
  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.findOne({ slug })
  }

  /**
   * Find tenant by domain
   */
  async findByDomain(domain: string): Promise<Tenant | null> {
    return this.findOne({ domain })
  }

  /**
   * Check if slug exists
   */
  async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    const where: any = { slug }
    if (excludeId) {
      where.id = { not: excludeId }
    }
    return this.exists(where)
  }

  /**
   * Check if domain exists
   */
  async domainExists(domain: string, excludeId?: number): Promise<boolean> {
    const where: any = { domain }
    if (excludeId) {
      where.id = { not: excludeId }
    }
    return this.exists(where)
  }

  /**
   * Find active tenants
   */
  async findActiveTenants(): Promise<Tenant[]> {
    return this.findAll({
      where: {
        status: TenantStatus.ACTIVE,
      },
      orderBy: {
        name: 'asc',
      },
    })
  }

  /**
   * Create tenant
   */
  async createTenant(data: CreateTenantData): Promise<Tenant> {
    return this.create(data)
  }

  /**
   * Update tenant
   */
  async updateTenant(id: number, data: UpdateTenantData): Promise<Tenant> {
    return this.update(id, data)
  }

  /**
   * Suspend tenant
   */
  async suspendTenant(id: number): Promise<Tenant> {
    return this.update(id, { status: TenantStatus.SUSPENDED })
  }

  /**
   * Activate tenant
   */
  async activateTenant(id: number): Promise<Tenant> {
    return this.update(id, { status: TenantStatus.ACTIVE })
  }

  /**
   * Deactivate tenant
   */
  async deactivateTenant(id: number): Promise<Tenant> {
    return this.update(id, { status: TenantStatus.INACTIVE })
  }

  /**
   * Count users in tenant
   */
  async countTenantUsers(tenantId: number): Promise<number> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    return tenant?._count.users ?? 0
  }

  /**
   * Get tenant with user count
   */
  async findByIdWithUserCount(id: number) {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })
  }

  /**
   * Get all tenants with user counts
   */
  async findAllWithUserCounts() {
    return this.prisma.tenant.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }
}
