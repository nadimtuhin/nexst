import { Injectable } from '../decorators'
import { RoleRepository } from '../database/repositories/role.repository'
import { PermissionRepository } from '../database/repositories/permission.repository'
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto, CreatePermissionDto, CheckPermissionDto } from '../dto/role.dto'
import { NotFoundException, ConflictException, BadRequestException } from '../filters/http-exception'
import { PermissionAction, PermissionResource } from '@prisma/client'

/**
 * Service for Role-Based Access Control (RBAC) operations
 */
@Injectable()
export class RbacService {
  constructor(
    private roleRepository: RoleRepository,
    private permissionRepository: PermissionRepository
  ) {}

  // ============================================
  // Role Management
  // ============================================

  /**
   * Create a new role
   */
  async createRole(dto: CreateRoleDto) {
    // Check if role with same name already exists for this tenant
    const existing = await this.roleRepository.findByName(dto.name, dto.tenantId || null)
    if (existing) {
      throw new ConflictException(
        `Role with name "${dto.name}" already exists for this tenant`
      )
    }

    // Create the role
    const role = await this.roleRepository.create({
      name: dto.name,
      description: dto.description,
      tenantId: dto.tenantId,
      isSystem: dto.isSystem || false,
    })

    // Assign permissions if provided
    if (dto.permissionIds && dto.permissionIds.length > 0) {
      await this.roleRepository.assignPermissions(role.id, dto.permissionIds)
    }

    // Return role with permissions
    return this.roleRepository.findByIdWithPermissions(role.id)
  }

  /**
   * Get all roles for a tenant (or system-wide roles)
   */
  async getRoles(tenantId?: number) {
    return this.roleRepository.findByTenant(tenantId !== undefined ? tenantId : null)
  }

  /**
   * Get a role by ID
   */
  async getRoleById(id: number) {
    const role = await this.roleRepository.findByIdWithPermissions(id)
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`)
    }
    return role
  }

  /**
   * Update a role
   */
  async updateRole(id: number, dto: UpdateRoleDto) {
    const role = await this.roleRepository.findById(id)
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`)
    }

    // Check if it's a system role
    if (role.isSystem) {
      throw new BadRequestException('Cannot modify system role')
    }

    // Check for name conflict if name is being updated
    if (dto.name && dto.name !== role.name) {
      const existing = await this.roleRepository.findByName(dto.name, role.tenantId)
      if (existing) {
        throw new ConflictException(`Role with name "${dto.name}" already exists`)
      }
    }

    // Update the role
    await this.roleRepository.update(id, {
      name: dto.name,
      description: dto.description,
    })

    // Update permissions if provided
    if (dto.permissionIds) {
      await this.roleRepository.assignPermissions(id, dto.permissionIds)
    }

    return this.roleRepository.findByIdWithPermissions(id)
  }

  /**
   * Delete a role
   */
  async deleteRole(id: number) {
    const role = await this.roleRepository.findById(id)
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`)
    }

    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system role')
    }

    await this.roleRepository.deleteRole(id)
    return { message: 'Role deleted successfully' }
  }

  // ============================================
  // User Role Assignment
  // ============================================

  /**
   * Assign a role to a user
   */
  async assignRole(dto: AssignRoleDto) {
    // Check if role exists
    const role = await this.roleRepository.findById(dto.roleId)
    if (!role) {
      throw new NotFoundException(`Role with ID ${dto.roleId} not found`)
    }

    // Check if user already has this role
    const hasRole = await this.roleRepository.userHasRole(
      dto.userId,
      dto.roleId,
      dto.tenantId
    )
    if (hasRole) {
      throw new ConflictException('User already has this role')
    }

    await this.roleRepository.assignToUser(dto.userId, dto.roleId, dto.tenantId)
    return { message: 'Role assigned successfully' }
  }

  /**
   * Remove a role from a user
   */
  async removeRole(userId: number, roleId: number, tenantId?: number) {
    const hasRole = await this.roleRepository.userHasRole(userId, roleId, tenantId)
    if (!hasRole) {
      throw new NotFoundException('User does not have this role')
    }

    await this.roleRepository.removeFromUser(userId, roleId, tenantId)
    return { message: 'Role removed successfully' }
  }

  /**
   * Get all roles for a user
   */
  async getUserRoles(userId: number, tenantId?: number) {
    return this.roleRepository.getUserRoles(userId, tenantId)
  }

  /**
   * Get all users with a specific role
   */
  async getRoleUsers(roleId: number, tenantId?: number) {
    return this.roleRepository.getRoleUsers(roleId, tenantId)
  }

  // ============================================
  // Permission Management
  // ============================================

  /**
   * Create a new permission
   */
  async createPermission(dto: CreatePermissionDto) {
    const existing = await this.permissionRepository.findByActionAndResource(
      dto.action,
      dto.resource
    )
    if (existing) {
      throw new ConflictException('Permission already exists')
    }

    return this.permissionRepository.create({
      action: dto.action,
      resource: dto.resource,
      description: dto.description,
    })
  }

  /**
   * Get all permissions
   */
  async getAllPermissions() {
    return this.permissionRepository.findAllPermissions()
  }

  /**
   * Get permissions for a role
   */
  async getRolePermissions(roleId: number) {
    const role = await this.roleRepository.findById(roleId)
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`)
    }

    return this.roleRepository.getRolePermissions(roleId)
  }

  /**
   * Seed default permissions
   */
  async seedPermissions() {
    await this.permissionRepository.seedDefaultPermissions()
    return { message: 'Default permissions seeded successfully' }
  }

  // ============================================
  // Permission Checking
  // ============================================

  /**
   * Check if a user has a specific permission
   */
  async checkPermission(dto: CheckPermissionDto): Promise<boolean> {
    return this.permissionRepository.userHasPermission(
      dto.userId,
      dto.action,
      dto.resource,
      dto.tenantId
    )
  }

  /**
   * Check if user has permission (throws exception if not)
   */
  async requirePermission(
    userId: number,
    action: PermissionAction,
    resource: PermissionResource,
    tenantId?: number
  ): Promise<void> {
    const hasPermission = await this.permissionRepository.userHasPermission(
      userId,
      action,
      resource,
      tenantId
    )

    if (!hasPermission) {
      throw new BadRequestException(
        `User does not have permission: ${action} ${resource}`
      )
    }
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: number, tenantId?: number) {
    return this.permissionRepository.getUserPermissions(userId, tenantId)
  }

  // ============================================
  // System Role Creation
  // ============================================

  /**
   * Create default system roles with permissions
   */
  async seedSystemRoles() {
    // Get all permissions first
    const allPermissions = await this.permissionRepository.findAllPermissions()

    // Super Admin role (all permissions)
    const superAdminRole = await this.roleRepository.findByName('Super Admin', null)
    if (!superAdminRole) {
      const role = await this.roleRepository.create({
        name: 'Super Admin',
        description: 'Full system access',
        isSystem: true,
        tenantId: null,
      })

      const manageAllPermission = allPermissions.find(
        (p) => p.action === PermissionAction.MANAGE && p.resource === PermissionResource.ALL
      )
      if (manageAllPermission) {
        await this.roleRepository.assignPermissions(role.id, [manageAllPermission.id])
      }
    }

    // Tenant Admin role (tenant management permissions)
    const tenantAdminRole = await this.roleRepository.findByName('Tenant Admin', null)
    if (!tenantAdminRole) {
      const role = await this.roleRepository.create({
        name: 'Tenant Admin',
        description: 'Full access within tenant',
        isSystem: true,
        tenantId: null,
      })

      const tenantPermissions = allPermissions.filter(
        (p) =>
          p.resource === PermissionResource.USER ||
          p.resource === PermissionResource.ROLE ||
          p.resource === PermissionResource.SETTINGS
      )
      await this.roleRepository.assignPermissions(
        role.id,
        tenantPermissions.map((p) => p.id)
      )
    }

    // Viewer role (read-only access)
    const viewerRole = await this.roleRepository.findByName('Viewer', null)
    if (!viewerRole) {
      const role = await this.roleRepository.create({
        name: 'Viewer',
        description: 'Read-only access',
        isSystem: true,
        tenantId: null,
      })

      const readPermissions = allPermissions.filter((p) => p.action === PermissionAction.READ)
      await this.roleRepository.assignPermissions(
        role.id,
        readPermissions.map((p) => p.id)
      )
    }

    return { message: 'System roles created successfully' }
  }
}
