import 'reflect-metadata'
import { PermissionAction, PermissionResource } from '@prisma/client'

/**
 * Metadata key for required permissions
 */
export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions'

/**
 * Permission requirement type
 */
export interface PermissionRequirement {
  action: PermissionAction
  resource: PermissionResource
}

/**
 * Decorator to specify required permissions for a route
 *
 * Usage:
 * ```typescript
 * @Controller('/api/users')
 * export class UserController {
 *   @Post()
 *   @RequirePermission(PermissionAction.CREATE, PermissionResource.USER)
 *   async createUser(@Body() dto: CreateUserDto) {
 *     // Only users with CREATE USER permission can access this
 *   }
 * }
 * ```
 */
export function RequirePermission(
  action: PermissionAction,
  resource: PermissionResource
): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    // Get existing permissions or initialize empty array
    const existingPermissions: PermissionRequirement[] =
      Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, target, propertyKey) || []

    // Add new permission requirement
    existingPermissions.push({ action, resource })

    // Set metadata
    Reflect.defineMetadata(REQUIRED_PERMISSIONS_KEY, existingPermissions, target, propertyKey)

    return descriptor
  }
}

/**
 * Decorator to require multiple permissions
 *
 * Usage:
 * ```typescript
 * @RequirePermissions([
 *   { action: PermissionAction.READ, resource: PermissionResource.USER },
 *   { action: PermissionAction.READ, resource: PermissionResource.TENANT }
 * ])
 * ```
 */
export function RequirePermissions(permissions: PermissionRequirement[]): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    // Set metadata
    Reflect.defineMetadata(REQUIRED_PERMISSIONS_KEY, permissions, target, propertyKey)

    return descriptor
  }
}

/**
 * Decorator to require MANAGE permission for a resource (highest level)
 *
 * Usage:
 * ```typescript
 * @RequireManage(PermissionResource.USER)
 * async deleteAllUsers() {
 *   // Only users with MANAGE USER permission can access this
 * }
 * ```
 */
export function RequireManage(resource: PermissionResource): MethodDecorator {
  return RequirePermission(PermissionAction.MANAGE, resource)
}

/**
 * Decorator to require any permission for a resource (READ access)
 *
 * Usage:
 * ```typescript
 * @RequireRead(PermissionResource.USER)
 * async getUsers() {
 *   // Only users with READ USER permission can access this
 * }
 * ```
 */
export function RequireRead(resource: PermissionResource): MethodDecorator {
  return RequirePermission(PermissionAction.READ, resource)
}

/**
 * Decorator to require CREATE permission for a resource
 */
export function RequireCreate(resource: PermissionResource): MethodDecorator {
  return RequirePermission(PermissionAction.CREATE, resource)
}

/**
 * Decorator to require UPDATE permission for a resource
 */
export function RequireUpdate(resource: PermissionResource): MethodDecorator {
  return RequirePermission(PermissionAction.UPDATE, resource)
}

/**
 * Decorator to require DELETE permission for a resource
 */
export function RequireDelete(resource: PermissionResource): MethodDecorator {
  return RequirePermission(PermissionAction.DELETE, resource)
}
