import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '../decorators'
import { RbacService } from '../services/rbac.service'
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignRoleDto,
  CreatePermissionDto,
  CheckPermissionDto,
} from '../dto/role.dto'

/**
 * Controller for Role-Based Access Control (RBAC) endpoints
 */
@Controller('/api/rbac')
export class RbacController {
  constructor(private rbacService: RbacService) {}

  // ============================================
  // Role Endpoints
  // ============================================

  /**
   * GET /api/rbac/roles
   * Get all roles (optionally filtered by tenant)
   */
  @Get('/roles')
  async getRoles(@Query('tenantId') tenantId?: string) {
    const parsedTenantId = tenantId ? parseInt(tenantId) : undefined
    return {
      data: await this.rbacService.getRoles(parsedTenantId),
    }
  }

  /**
   * GET /api/rbac/roles/:id
   * Get a role by ID
   */
  @Get('/roles/:id')
  async getRoleById(@Param('id') id: string) {
    return {
      data: await this.rbacService.getRoleById(parseInt(id)),
    }
  }

  /**
   * POST /api/rbac/roles
   * Create a new role
   */
  @Post('/roles')
  async createRole(@Body() dto: CreateRoleDto) {
    return {
      data: await this.rbacService.createRole(dto),
      message: 'Role created successfully',
    }
  }

  /**
   * PUT /api/rbac/roles/:id
   * Update a role
   */
  @Put('/roles/:id')
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return {
      data: await this.rbacService.updateRole(parseInt(id), dto),
      message: 'Role updated successfully',
    }
  }

  /**
   * DELETE /api/rbac/roles/:id
   * Delete a role
   */
  @Delete('/roles/:id')
  async deleteRole(@Param('id') id: string) {
    return await this.rbacService.deleteRole(parseInt(id))
  }

  /**
   * GET /api/rbac/roles/:id/permissions
   * Get permissions for a role
   */
  @Get('/roles/:id/permissions')
  async getRolePermissions(@Param('id') id: string) {
    return {
      data: await this.rbacService.getRolePermissions(parseInt(id)),
    }
  }

  /**
   * GET /api/rbac/roles/:id/users
   * Get all users with a specific role
   */
  @Get('/roles/:id/users')
  async getRoleUsers(@Param('id') id: string, @Query('tenantId') tenantId?: string) {
    const parsedTenantId = tenantId ? parseInt(tenantId) : undefined
    return {
      data: await this.rbacService.getRoleUsers(parseInt(id), parsedTenantId),
    }
  }

  // ============================================
  // User Role Assignment Endpoints
  // ============================================

  /**
   * POST /api/rbac/users/assign-role
   * Assign a role to a user
   */
  @Post('/users/assign-role')
  async assignRole(@Body() dto: AssignRoleDto) {
    return await this.rbacService.assignRole(dto)
  }

  /**
   * DELETE /api/rbac/users/:userId/roles/:roleId
   * Remove a role from a user
   */
  @Delete('/users/:userId/roles/:roleId')
  async removeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Query('tenantId') tenantId?: string
  ) {
    const parsedTenantId = tenantId ? parseInt(tenantId) : undefined
    return await this.rbacService.removeRole(parseInt(userId), parseInt(roleId), parsedTenantId)
  }

  /**
   * GET /api/rbac/users/:userId/roles
   * Get all roles for a user
   */
  @Get('/users/:userId/roles')
  async getUserRoles(@Param('userId') userId: string, @Query('tenantId') tenantId?: string) {
    const parsedTenantId = tenantId ? parseInt(tenantId) : undefined
    return {
      data: await this.rbacService.getUserRoles(parseInt(userId), parsedTenantId),
    }
  }

  /**
   * GET /api/rbac/users/:userId/permissions
   * Get all permissions for a user
   */
  @Get('/users/:userId/permissions')
  async getUserPermissions(@Param('userId') userId: string, @Query('tenantId') tenantId?: string) {
    const parsedTenantId = tenantId ? parseInt(tenantId) : undefined
    return {
      data: await this.rbacService.getUserPermissions(parseInt(userId), parsedTenantId),
    }
  }

  // ============================================
  // Permission Endpoints
  // ============================================

  /**
   * GET /api/rbac/permissions
   * Get all permissions
   */
  @Get('/permissions')
  async getAllPermissions() {
    return {
      data: await this.rbacService.getAllPermissions(),
    }
  }

  /**
   * POST /api/rbac/permissions
   * Create a new permission
   */
  @Post('/permissions')
  async createPermission(@Body() dto: CreatePermissionDto) {
    return {
      data: await this.rbacService.createPermission(dto),
      message: 'Permission created successfully',
    }
  }

  /**
   * POST /api/rbac/permissions/check
   * Check if a user has a specific permission
   */
  @Post('/permissions/check')
  async checkPermission(@Body() dto: CheckPermissionDto) {
    const hasPermission = await this.rbacService.checkPermission(dto)
    return {
      hasPermission,
      message: hasPermission ? 'User has permission' : 'User does not have permission',
    }
  }

  // ============================================
  // Seed Endpoints
  // ============================================

  /**
   * POST /api/rbac/seed/permissions
   * Seed default permissions
   */
  @Post('/seed/permissions')
  async seedPermissions() {
    return await this.rbacService.seedPermissions()
  }

  /**
   * POST /api/rbac/seed/roles
   * Seed default system roles
   */
  @Post('/seed/roles')
  async seedSystemRoles() {
    return await this.rbacService.seedSystemRoles()
  }
}
