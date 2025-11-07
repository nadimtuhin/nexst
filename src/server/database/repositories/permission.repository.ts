import { Injectable } from '../../decorators'
import { BaseRepository } from './base.repository'
import { PrismaService } from '../prisma.service'
import { Permission, Prisma, PermissionAction, PermissionResource } from '@prisma/client'

/**
 * Repository for Permission-related database operations
 */
@Injectable()
export class PermissionRepository extends BaseRepository<
  Permission,
  Prisma.PermissionCreateInput,
  Prisma.PermissionUpdateInput
> {
  constructor(prismaService: PrismaService) {
    super(prismaService.permission, prismaService)
  }

  /**
   * Find a permission by action and resource
   */
  async findByActionAndResource(
    action: PermissionAction,
    resource: PermissionResource
  ): Promise<Permission | null> {
    return this.model.findUnique({
      where: {
        action_resource: {
          action,
          resource,
        },
      },
    })
  }

  /**
   * Get all permissions
   */
  async findAllPermissions(): Promise<Permission[]> {
    return this.model.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    })
  }

  /**
   * Check if a user has a specific permission (through their roles)
   */
  async userHasPermission(
    userId: number,
    action: PermissionAction,
    resource: PermissionResource,
    tenantId?: number
  ): Promise<boolean> {
    // Get all user's roles (either for specific tenant or system-wide)
    const userRoles = await this.prismaService.userRole_New.findMany({
      where: {
        userId,
        ...(tenantId !== undefined && { tenantId }),
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    })

    // Check if any role has the required permission
    for (const userRole of userRoles) {
      const hasPermission = userRole.role.permissions.some(
        (rp) =>
          (rp.permission.action === action || rp.permission.action === PermissionAction.MANAGE) &&
          (rp.permission.resource === resource || rp.permission.resource === PermissionResource.ALL)
      )

      if (hasPermission) {
        return true
      }
    }

    return false
  }

  /**
   * Get all permissions for a user (through their roles)
   */
  async getUserPermissions(
    userId: number,
    tenantId?: number
  ): Promise<Array<{ action: PermissionAction; resource: PermissionResource }>> {
    const userRoles = await this.prismaService.userRole_New.findMany({
      where: {
        userId,
        ...(tenantId !== undefined && { tenantId }),
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    })

    const permissions = new Set<string>()
    const result: Array<{ action: PermissionAction; resource: PermissionResource }> = []

    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.permissions) {
        const key = `${rolePermission.permission.action}:${rolePermission.permission.resource}`
        if (!permissions.has(key)) {
          permissions.add(key)
          result.push({
            action: rolePermission.permission.action,
            resource: rolePermission.permission.resource,
          })
        }
      }
    }

    return result
  }

  /**
   * Create default system permissions
   */
  async seedDefaultPermissions(): Promise<void> {
    const defaultPermissions: Array<{
      action: PermissionAction
      resource: PermissionResource
      description: string
    }> = [
      // User permissions
      { action: PermissionAction.CREATE, resource: PermissionResource.USER, description: 'Create users' },
      { action: PermissionAction.READ, resource: PermissionResource.USER, description: 'View users' },
      { action: PermissionAction.UPDATE, resource: PermissionResource.USER, description: 'Update users' },
      { action: PermissionAction.DELETE, resource: PermissionResource.USER, description: 'Delete users' },
      { action: PermissionAction.MANAGE, resource: PermissionResource.USER, description: 'Full user management' },

      // Tenant permissions
      { action: PermissionAction.CREATE, resource: PermissionResource.TENANT, description: 'Create tenants' },
      { action: PermissionAction.READ, resource: PermissionResource.TENANT, description: 'View tenants' },
      { action: PermissionAction.UPDATE, resource: PermissionResource.TENANT, description: 'Update tenants' },
      { action: PermissionAction.DELETE, resource: PermissionResource.TENANT, description: 'Delete tenants' },
      { action: PermissionAction.MANAGE, resource: PermissionResource.TENANT, description: 'Full tenant management' },

      // Role permissions
      { action: PermissionAction.CREATE, resource: PermissionResource.ROLE, description: 'Create roles' },
      { action: PermissionAction.READ, resource: PermissionResource.ROLE, description: 'View roles' },
      { action: PermissionAction.UPDATE, resource: PermissionResource.ROLE, description: 'Update roles' },
      { action: PermissionAction.DELETE, resource: PermissionResource.ROLE, description: 'Delete roles' },
      { action: PermissionAction.MANAGE, resource: PermissionResource.ROLE, description: 'Full role management' },

      // Settings permissions
      { action: PermissionAction.READ, resource: PermissionResource.SETTINGS, description: 'View settings' },
      { action: PermissionAction.UPDATE, resource: PermissionResource.SETTINGS, description: 'Update settings' },
      { action: PermissionAction.MANAGE, resource: PermissionResource.SETTINGS, description: 'Full settings management' },

      // Analytics permissions
      { action: PermissionAction.READ, resource: PermissionResource.ANALYTICS, description: 'View analytics' },
      { action: PermissionAction.MANAGE, resource: PermissionResource.ANALYTICS, description: 'Full analytics access' },

      // Super admin permission (all resources, all actions)
      { action: PermissionAction.MANAGE, resource: PermissionResource.ALL, description: 'Full system access' },
    ]

    for (const perm of defaultPermissions) {
      await this.model.upsert({
        where: {
          action_resource: {
            action: perm.action,
            resource: perm.resource,
          },
        },
        update: {},
        create: perm,
      })
    }
  }
}
