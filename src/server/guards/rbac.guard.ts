import { NextRequest } from 'next/server'
import { container } from 'tsyringe'
import { PermissionRepository } from '../database/repositories/permission.repository'
import { UnauthorizedException, ForbiddenException } from '../filters/http-exception'
import { PermissionAction, PermissionResource } from '@prisma/client'

/**
 * RBAC Guard - Checks if user has required permissions
 *
 * Usage:
 * ```typescript
 * @UseGuards(RbacGuard)
 * @RequirePermission(PermissionAction.CREATE, PermissionResource.USER)
 * async createUser() {
 *   // ...
 * }
 * ```
 */
export class RbacGuard {
  private permissionRepository: PermissionRepository

  constructor() {
    this.permissionRepository = container.resolve(PermissionRepository)
  }

  async canActivate(context: any): Promise<boolean> {
    const request = context.request as NextRequest & {
      user?: any
      userId?: number
      tenantId?: number
      requiredPermissions?: Array<{ action: PermissionAction; resource: PermissionResource }>
    }

    // Check if user is authenticated
    if (!request.userId) {
      throw new UnauthorizedException('User not authenticated')
    }

    // Check if permissions are required
    if (!request.requiredPermissions || request.requiredPermissions.length === 0) {
      return true // No specific permissions required
    }

    // Check each required permission
    for (const permission of request.requiredPermissions) {
      const hasPermission = await this.permissionRepository.userHasPermission(
        request.userId,
        permission.action,
        permission.resource,
        request.tenantId
      )

      if (!hasPermission) {
        throw new ForbiddenException(
          `Permission denied: ${permission.action} ${permission.resource}`
        )
      }
    }

    return true
  }
}

/**
 * Factory function to create RBAC guard with specific permissions
 */
export function createRbacGuard(
  action: PermissionAction,
  resource: PermissionResource
): typeof RbacGuard {
  return class extends RbacGuard {
    constructor() {
      super()
    }

    async canActivate(context: any): Promise<boolean> {
      const request = context.request as NextRequest & {
        requiredPermissions?: Array<{ action: PermissionAction; resource: PermissionResource }>
      }

      // Attach required permissions to request
      if (!request.requiredPermissions) {
        request.requiredPermissions = []
      }
      request.requiredPermissions.push({ action, resource })

      return super.canActivate(context)
    }
  }
}
