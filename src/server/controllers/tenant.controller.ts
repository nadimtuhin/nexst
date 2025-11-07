import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '../decorators'
import { TenantService } from '../services/tenant.service'
import {
  CreateTenantDto,
  UpdateTenantDto,
  GetTenantsQueryDto,
} from '../dto/tenant.dto'

/**
 * Tenant controller - handles HTTP requests for tenant operations
 * Only active when multi-tenancy is enabled
 */
@Controller('/tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  /**
   * GET /tenants - Get all tenants
   */
  @Get()
  async getTenants(@Query() query: GetTenantsQueryDto) {
    const result = await this.tenantService.findAll(query)
    return result
  }

  /**
   * GET /tenants/with-counts - Get all tenants with user counts
   */
  @Get('/with-counts')
  async getTenantsWithCounts() {
    const tenants = await this.tenantService.findAllWithUserCounts()
    return { data: tenants }
  }

  /**
   * GET /tenants/active - Get active tenants
   */
  @Get('/active')
  async getActiveTenants() {
    const tenants = await this.tenantService.findActive()
    return {
      data: tenants,
      total: tenants.length,
    }
  }

  /**
   * GET /tenants/:id - Get a tenant by ID
   */
  @Get('/:id')
  async getTenant(@Param('id') id: string) {
    const tenantId = parseInt(id, 10)
    const tenant = await this.tenantService.findByIdWithUserCount(tenantId)
    return { data: tenant }
  }

  /**
   * GET /tenants/:id/user-count - Get tenant user count
   */
  @Get('/:id/user-count')
  async getTenantUserCount(@Param('id') id: string) {
    const tenantId = parseInt(id, 10)
    const count = await this.tenantService.getUserCount(tenantId)
    return {
      data: { tenantId, userCount: count },
    }
  }

  /**
   * GET /tenants/slug/:slug - Get a tenant by slug
   */
  @Get('/slug/:slug')
  async getTenantBySlug(@Param('slug') slug: string) {
    const tenant = await this.tenantService.findBySlug(slug)
    return { data: tenant }
  }

  /**
   * GET /tenants/domain/:domain - Get a tenant by domain
   */
  @Get('/domain/:domain')
  async getTenantByDomain(@Param('domain') domain: string) {
    const tenant = await this.tenantService.findByDomain(domain)
    return { data: tenant }
  }

  /**
   * POST /tenants - Create a new tenant
   */
  @Post()
  async createTenant(@Body() createTenantDto: CreateTenantDto) {
    const tenant = await this.tenantService.create(createTenantDto)
    return {
      data: tenant,
      message: 'Tenant created successfully',
    }
  }

  /**
   * PUT /tenants/:id - Update a tenant
   */
  @Put('/:id')
  async updateTenant(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto
  ) {
    const tenantId = parseInt(id, 10)
    const tenant = await this.tenantService.update(tenantId, updateTenantDto)
    return {
      data: tenant,
      message: 'Tenant updated successfully',
    }
  }

  /**
   * PUT /tenants/:id/suspend - Suspend a tenant
   */
  @Put('/:id/suspend')
  async suspendTenant(@Param('id') id: string) {
    const tenantId = parseInt(id, 10)
    const tenant = await this.tenantService.suspend(tenantId)
    return {
      data: tenant,
      message: 'Tenant suspended successfully',
    }
  }

  /**
   * PUT /tenants/:id/activate - Activate a tenant
   */
  @Put('/:id/activate')
  async activateTenant(@Param('id') id: string) {
    const tenantId = parseInt(id, 10)
    const tenant = await this.tenantService.activate(tenantId)
    return {
      data: tenant,
      message: 'Tenant activated successfully',
    }
  }

  /**
   * PUT /tenants/:id/deactivate - Deactivate a tenant
   */
  @Put('/:id/deactivate')
  async deactivateTenant(@Param('id') id: string) {
    const tenantId = parseInt(id, 10)
    const tenant = await this.tenantService.deactivate(tenantId)
    return {
      data: tenant,
      message: 'Tenant deactivated successfully',
    }
  }

  /**
   * DELETE /tenants/:id - Delete a tenant
   */
  @Delete('/:id')
  async deleteTenant(@Param('id') id: string) {
    const tenantId = parseInt(id, 10)
    await this.tenantService.delete(tenantId)
    return {
      message: 'Tenant deleted successfully',
    }
  }
}
