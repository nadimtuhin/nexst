// @ts-nocheck
import { Tenant } from '@prisma/client'
import { Injectable } from '../decorators'
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '../filters'
import {
  CreateTenantDto,
  UpdateTenantDto,
  GetTenantsQueryDto,
} from '../dto/tenant.dto'
import { TenantRepository } from '../database/repositories/tenant.repository'
import { ConfigService } from '../../config/config.service'

/**
 * Tenant service - handles business logic for tenant operations
 * Only active when multi-tenancy is enabled
 */
@Injectable()
export class TenantService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly config: ConfigService
  ) {}

  /**
   * Check if multi-tenancy is enabled
   */
  private ensureMultiTenancyEnabled(): void {
    if (!this.config.multiTenant.enabled) {
      throw new BadRequestException(
        'Multi-tenancy is not enabled. Set MULTI_TENANT_ENABLED=true in your environment configuration.'
      )
    }
  }

  /**
   * Get all tenants with optional filtering
   */
  async findAll(query?: GetTenantsQueryDto) {
    this.ensureMultiTenancyEnabled()

    const page = query?.page ? parseInt(query.page as any, 10) : undefined
    const limit = query?.limit ? parseInt(query.limit as any, 10) : undefined
    const search = query?.search
    const status = query?.status

    // If pagination is requested, use pagination
    if (page && limit) {
      return this.tenantRepository.findTenants({
        search,
        status,
        page,
        limit,
      })
    }

    // Otherwise, find all with optional filters
    const result = await this.tenantRepository.findTenants({ search, status })
    return {
      data: result.data,
      meta: result.meta,
    }
  }

  /**
   * Get all tenants with user counts
   */
  async findAllWithUserCounts() {
    this.ensureMultiTenancyEnabled()
    return this.tenantRepository.findAllWithUserCounts()
  }

  /**
   * Get active tenants
   */
  async findActive(): Promise<Tenant[]> {
    this.ensureMultiTenancyEnabled()
    return this.tenantRepository.findActiveTenants()
  }

  /**
   * Get a tenant by ID
   */
  async findById(id: number): Promise<Tenant> {
    this.ensureMultiTenancyEnabled()

    const tenant = await this.tenantRepository.findById(id)

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`)
    }

    return tenant
  }

  /**
   * Get a tenant by ID with user count
   */
  async findByIdWithUserCount(id: number) {
    this.ensureMultiTenancyEnabled()

    const tenant = await this.tenantRepository.findByIdWithUserCount(id)

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`)
    }

    return tenant
  }

  /**
   * Get a tenant by slug
   */
  async findBySlug(slug: string): Promise<Tenant> {
    this.ensureMultiTenancyEnabled()

    const tenant = await this.tenantRepository.findBySlug(slug)

    if (!tenant) {
      throw new NotFoundException(`Tenant with slug "${slug}" not found`)
    }

    return tenant
  }

  /**
   * Get a tenant by domain
   */
  async findByDomain(domain: string): Promise<Tenant> {
    this.ensureMultiTenancyEnabled()

    const tenant = await this.tenantRepository.findByDomain(domain)

    if (!tenant) {
      throw new NotFoundException(`Tenant with domain "${domain}" not found`)
    }

    return tenant
  }

  /**
   * Create a new tenant
   */
  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    this.ensureMultiTenancyEnabled()

    // Check if slug already exists
    const slugExists = await this.tenantRepository.slugExists(
      createTenantDto.slug
    )

    if (slugExists) {
      throw new ConflictException('Tenant with this slug already exists')
    }

    // Check if domain already exists (if provided)
    if (createTenantDto.domain) {
      const domainExists = await this.tenantRepository.domainExists(
        createTenantDto.domain
      )

      if (domainExists) {
        throw new ConflictException('Tenant with this domain already exists')
      }
    }

    return this.tenantRepository.createTenant(createTenantDto)
  }

  /**
   * Update a tenant
   */
  async update(id: number, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    this.ensureMultiTenancyEnabled()

    // Check if tenant exists
    const tenant = await this.findById(id)

    // Check if slug is being changed and already exists
    if (updateTenantDto.slug && updateTenantDto.slug !== tenant.slug) {
      const slugExists = await this.tenantRepository.slugExists(
        updateTenantDto.slug,
        id
      )

      if (slugExists) {
        throw new ConflictException('Tenant with this slug already exists')
      }
    }

    // Check if domain is being changed and already exists
    if (updateTenantDto.domain && updateTenantDto.domain !== tenant.domain) {
      const domainExists = await this.tenantRepository.domainExists(
        updateTenantDto.domain,
        id
      )

      if (domainExists) {
        throw new ConflictException('Tenant with this domain already exists')
      }
    }

    return this.tenantRepository.updateTenant(id, updateTenantDto)
  }

  /**
   * Suspend a tenant
   */
  async suspend(id: number): Promise<Tenant> {
    this.ensureMultiTenancyEnabled()

    // Check if tenant exists
    await this.findById(id)

    return this.tenantRepository.suspendTenant(id)
  }

  /**
   * Activate a tenant
   */
  async activate(id: number): Promise<Tenant> {
    this.ensureMultiTenancyEnabled()

    // Check if tenant exists
    await this.findById(id)

    return this.tenantRepository.activateTenant(id)
  }

  /**
   * Deactivate a tenant
   */
  async deactivate(id: number): Promise<Tenant> {
    this.ensureMultiTenancyEnabled()

    // Check if tenant exists
    await this.findById(id)

    return this.tenantRepository.deactivateTenant(id)
  }

  /**
   * Delete a tenant
   */
  async delete(id: number): Promise<void> {
    this.ensureMultiTenancyEnabled()

    // Check if tenant exists
    await this.findById(id)

    // Check if tenant has users
    const userCount = await this.tenantRepository.countTenantUsers(id)

    if (userCount > 0) {
      throw new BadRequestException(
        `Cannot delete tenant with ${userCount} users. Please remove or reassign users first.`
      )
    }

    await this.tenantRepository.delete(id)
  }

  /**
   * Get tenant user count
   */
  async getUserCount(id: number): Promise<number> {
    this.ensureMultiTenancyEnabled()

    // Check if tenant exists
    await this.findById(id)

    return this.tenantRepository.countTenantUsers(id)
  }
}
