import 'reflect-metadata'
import { TenantController } from '@/server/controllers/tenant.controller'
import { createRouteHandler } from '@/server/core/route-handler'
import { CreateTenantDto } from '@/server/dto/tenant.dto'

const controller = TenantController

/**
 * GET /api/tenants
 * Get all tenants (requires admin role)
 */
export const GET = createRouteHandler(controller, 'getTenants')

/**
 * POST /api/tenants
 * Create a new tenant (requires admin role)
 */
export const POST = createRouteHandler(controller, 'createTenant', CreateTenantDto)
