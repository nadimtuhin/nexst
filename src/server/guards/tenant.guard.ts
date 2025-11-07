import { NextRequest } from 'next/server'
import { Injectable } from '../decorators'
import { UnauthorizedException, NotFoundException } from '../filters'
import { TenantRepository } from '../database/repositories/tenant.repository'
import { ConfigService } from '../../config/config.service'
import { LoggerService } from '../logger/logger.service'
import { TenantStatus } from '@prisma/client'

/**
 * Tenant Guard
 * Validates tenant context and adds tenant to request
 * Only active when multi-tenancy is enabled
 */
@Injectable()
export class TenantGuard {
  private readonly logger: LoggerService

  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly config: ConfigService,
    logger: LoggerService
  ) {
    this.logger = logger.setContext('TenantGuard')
  }

  /**
   * Check if the request has a valid tenant context
   * @param context - Route context containing request
   * @returns True if valid tenant context
   * @throws UnauthorizedException if tenant context is invalid
   */
  async canActivate(context: any): Promise<boolean> {
    const { request } = context

    // Skip tenant validation if multi-tenancy is disabled
    if (!this.config.multiTenant.enabled) {
      this.logger.debug('Multi-tenancy disabled, skipping tenant validation')
      return true
    }

    // Extract tenant identifier from request
    const tenantIdentifier = this.extractTenantIdentifier(request)

    if (!tenantIdentifier) {
      this.logger.debug('No tenant identifier provided')
      throw new UnauthorizedException(
        'Tenant context required. Provide X-Tenant-ID header or X-Tenant-Slug header.'
      )
    }

    try {
      // Resolve tenant
      const tenant = await this.resolveTenant(tenantIdentifier)

      if (!tenant) {
        this.logger.warn(`Tenant not found: ${tenantIdentifier.value}`)
        throw new NotFoundException('Tenant not found')
      }

      // Check tenant status
      if (tenant.status !== TenantStatus.ACTIVE) {
        this.logger.warn(
          `Inactive tenant attempted access: ${tenant.id} (${tenant.status})`
        )
        throw new UnauthorizedException(
          `Tenant is ${tenant.status.toLowerCase()}`
        )
      }

      // Add tenant to request context
      ;(request as any).tenant = tenant
      ;(request as any).tenantId = tenant.id

      this.logger.debug(`Tenant validated: ${tenant.id} (${tenant.slug})`)
      return true
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      ) {
        throw error
      }

      this.logger.error('Tenant validation failed', (error as Error).stack)
      throw new UnauthorizedException('Invalid tenant context')
    }
  }

  /**
   * Extract tenant identifier from request
   * Supports: X-Tenant-ID, X-Tenant-Slug, and subdomain
   */
  private extractTenantIdentifier(
    request: NextRequest
  ): { type: 'id' | 'slug' | 'domain'; value: string } | null {
    // Check X-Tenant-ID header
    const tenantId = request.headers.get('x-tenant-id')
    if (tenantId) {
      return { type: 'id', value: tenantId }
    }

    // Check X-Tenant-Slug header
    const tenantSlug = request.headers.get('x-tenant-slug')
    if (tenantSlug) {
      return { type: 'slug', value: tenantSlug }
    }

    // Check subdomain
    const host = request.headers.get('host')
    if (host) {
      const subdomain = this.extractSubdomain(host)
      if (subdomain) {
        return { type: 'slug', value: subdomain }
      }
    }

    return null
  }

  /**
   * Extract subdomain from host
   * e.g., "acme.example.com" -> "acme"
   */
  private extractSubdomain(host: string): string | null {
    // Remove port if present
    const hostname = host.split(':')[0]

    // Split by dots
    const parts = hostname.split('.')

    // Need at least 3 parts for subdomain (subdomain.domain.tld)
    if (parts.length >= 3) {
      // Return first part as subdomain
      return parts[0]
    }

    return null
  }

  /**
   * Resolve tenant by identifier
   */
  private async resolveTenant(identifier: {
    type: 'id' | 'slug' | 'domain'
    value: string
  }) {
    switch (identifier.type) {
      case 'id': {
        const id = parseInt(identifier.value, 10)
        if (isNaN(id)) {
          return null
        }
        return this.tenantRepository.findById(id)
      }
      case 'slug':
        return this.tenantRepository.findBySlug(identifier.value)
      case 'domain':
        return this.tenantRepository.findByDomain(identifier.value)
      default:
        return null
    }
  }

  /**
   * Extract tenant from authenticated request
   * Helper method for controllers
   * @param request - Next.js request
   * @returns Tenant or null
   */
  static getTenantFromRequest(request: NextRequest): any {
    return (request as any).tenant || null
  }

  /**
   * Extract tenant ID from authenticated request
   * @param request - Next.js request
   * @returns Tenant ID or null
   */
  static getTenantIdFromRequest(request: NextRequest): number | null {
    return (request as any).tenantId || null
  }
}
