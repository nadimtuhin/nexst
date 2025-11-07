import 'reflect-metadata'
import { TenantController } from '@/server/controllers/tenant.controller'
import { createRouteHandler } from '@/server/core/route-handler'
import { UpdateTenantDto } from '@/server/dto/tenant.dto'

const controller = TenantController

/**
 * GET /api/tenants/:id
 * Get a tenant by ID (requires admin role)
 */
export const GET = createRouteHandler(controller, 'getTenant')

/**
 * PUT /api/tenants/:id
 * Update a tenant (requires admin role)
 */
export const PUT = createRouteHandler(controller, 'updateTenant', UpdateTenantDto)

/**
 * DELETE /api/tenants/:id
 * Delete a tenant (requires admin role)
 */
export const DELETE = createRouteHandler(controller, 'deleteTenant')
