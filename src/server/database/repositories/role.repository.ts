import { Injectable } from '../../decorators'
import { BaseRepository } from './base.repository'
import { PrismaService } from '../prisma.service'
import { Role, Prisma, PermissionAction, PermissionResource } from '@prisma/client'

/**
 * Repository for Role-related database operations
 */
@Injectable()
export class RoleRepository extends BaseRepository<
  Role,
  Prisma.RoleCreateInput,
  Prisma.RoleUpdateInput
> {
  constructor(prismaService: PrismaService) {
    super(prismaService.role, prismaService)
  }

  /**
   * Find all roles for a tenant (or system-wide roles if tenantId is null)
   */
  async findByTenant(tenantId: number | null): Promise<Role[]> {
    return this.model.findMany({
      where: { tenantId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  /**
   * Find a role by name within a tenant
   */
  async findByName(name: string, tenantId: number | null): Promise<Role | null> {
    return this.model.findUnique({
      where: {
        name_tenantId: {
          name,
          tenantId,
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })
  }

  /**
   * Find a role by ID with its permissions
   */
  async findByIdWithPermissions(id: number): Promise<Role | null> {
    return this.model.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })
  }

  /**
   * Assign permissions to a role
   */
  async assignPermissions(roleId: number, permissionIds: number[]): Promise<void> {
    // Remove existing permissions
    await this.prismaService.rolePermission.deleteMany({
      where: { roleId },
    })

    // Add new permissions
    if (permissionIds.length > 0) {
      await this.prismaService.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      })
    }
  }

  /**
   * Get all permissions for a role
   */
  async getRolePermissions(
    roleId: number
  ): Promise<Array<{ action: PermissionAction; resource: PermissionResource }>> {
    const rolePermissions = await this.prismaService.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    })

    return rolePermissions.map((rp) => ({
      action: rp.permission.action,
      resource: rp.permission.resource,
    }))
  }

  /**
   * Assign a role to a user
   */
  async assignToUser(userId: number, roleId: number, tenantId?: number): Promise<void> {
    await this.prismaService.userRole_New.create({
      data: {
        userId,
        roleId,
        tenantId,
      },
    })
  }

  /**
   * Remove a role from a user
   */
  async removeFromUser(userId: number, roleId: number, tenantId?: number): Promise<void> {
    await this.prismaService.userRole_New.deleteMany({
      where: {
        userId,
        roleId,
        tenantId,
      },
    })
  }

  /**
   * Get all roles for a user (optionally within a tenant)
   */
  async getUserRoles(userId: number, tenantId?: number): Promise<Role[]> {
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

    return userRoles.map((ur) => ur.role)
  }

  /**
   * Check if a user has a specific role
   */
  async userHasRole(userId: number, roleId: number, tenantId?: number): Promise<boolean> {
    const userRole = await this.prismaService.userRole_New.findFirst({
      where: {
        userId,
        roleId,
        ...(tenantId !== undefined && { tenantId }),
      },
    })

    return userRole !== null
  }

  /**
   * Get all users with a specific role
   */
  async getRoleUsers(roleId: number, tenantId?: number) {
    return this.prismaService.userRole_New.findMany({
      where: {
        roleId,
        ...(tenantId !== undefined && { tenantId }),
      },
      include: {
        user: true,
      },
    })
  }

  /**
   * Delete a role (only if not a system role)
   */
  async deleteRole(id: number): Promise<void> {
    // First check if it's a system role
    const role = await this.model.findUnique({ where: { id } })
    if (role?.isSystem) {
      throw new Error('Cannot delete system role')
    }

    // Delete will cascade to role_permissions and user_roles
    await this.model.delete({ where: { id } })
  }
}
