import { NextRequest } from 'next/server'
import { UserRole } from '@prisma/client'
import 'reflect-metadata'

/**
 * Metadata key for required roles
 */
export const ROLES_KEY = 'roles'

/**
 * Metadata key for public routes (no auth required)
 */
export const PUBLIC_KEY = 'public'

/**
 * CurrentUser decorator
 * Extracts the current user from the request context
 * Must be used after AuthGuard has run
 *
 * @example
 * ```typescript
 * @Post('/profile')
 * async updateProfile(@CurrentUser() user: User, @Body() data: UpdateProfileDto) {
 *   // user is automatically extracted from request
 * }
 * ```
 */
export function CurrentUser() {
  return function (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number
  ) {
    // Store metadata about this parameter
    const existingParams =
      Reflect.getMetadata('custom:params', target, propertyKey) || []

    existingParams.push({
      index: parameterIndex,
      type: 'currentUser',
      extractor: (request: NextRequest) => {
        const user = (request as any).user
        if (!user) {
          throw new Error('User not found in request context. Did you forget to use AuthGuard?')
        }
        return user
      },
    })

    Reflect.defineMetadata('custom:params', existingParams, target, propertyKey)
  }
}

/**
 * Roles decorator
 * Specifies required roles for accessing a route
 * Must be used with RoleGuard
 *
 * @param roles - Array of roles required to access this route
 *
 * @example
 * ```typescript
 * @Post('/admin/users')
 * @Roles([UserRole.ADMIN])
 * @UseGuards([AuthGuard, RoleGuard])
 * async createUser(@Body() data: CreateUserDto) {
 *   // Only admins can access this
 * }
 * ```
 */
export function Roles(roles: UserRole[]) {
  return function (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) {
    if (propertyKey) {
      // Method decorator
      Reflect.defineMetadata(ROLES_KEY, roles, target, propertyKey)
    } else {
      // Class decorator
      Reflect.defineMetadata(ROLES_KEY, roles, target)
    }
    return descriptor
  }
}

/**
 * Public decorator
 * Marks a route as public (no authentication required)
 * Useful when AuthGuard is applied globally but some routes should be public
 *
 * @example
 * ```typescript
 * @Post('/public/data')
 * @Public()
 * async getPublicData() {
 *   // Anyone can access this
 * }
 * ```
 */
export function Public() {
  return function (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) {
    if (propertyKey) {
      // Method decorator
      Reflect.defineMetadata(PUBLIC_KEY, true, target, propertyKey)
    } else {
      // Class decorator
      Reflect.defineMetadata(PUBLIC_KEY, true, target)
    }
    return descriptor
  }
}

/**
 * Admin decorator
 * Shorthand for @Roles([UserRole.ADMIN])
 *
 * @example
 * ```typescript
 * @Delete('/admin/users/:id')
 * @Admin()
 * @UseGuards([AuthGuard, RoleGuard])
 * async deleteUser(@Param('id') id: number) {
 *   // Only admins can delete users
 * }
 * ```
 */
export function Admin() {
  return Roles([UserRole.ADMIN])
}

/**
 * Moderator decorator
 * Shorthand for @Roles([UserRole.ADMIN, UserRole.MODERATOR])
 *
 * @example
 * ```typescript
 * @Post('/moderate/content')
 * @Moderator()
 * @UseGuards([AuthGuard, RoleGuard])
 * async moderateContent(@Body() data: ModerateDto) {
 *   // Admins and moderators can moderate
 * }
 * ```
 */
export function Moderator() {
  return Roles([UserRole.ADMIN, UserRole.MODERATOR])
}

/**
 * Helper to check if a route is marked as public
 * @param target - Controller class
 * @param propertyKey - Method name
 * @returns True if route is public
 */
export function isPublicRoute(target: any, propertyKey: string | symbol): boolean {
  const methodPublic = Reflect.getMetadata(PUBLIC_KEY, target, propertyKey)
  const classPublic = Reflect.getMetadata(PUBLIC_KEY, target.constructor)
  return methodPublic || classPublic || false
}

/**
 * Helper to get required roles for a route
 * @param target - Controller class
 * @param propertyKey - Method name
 * @returns Array of required roles or empty array
 */
export function getRequiredRoles(target: any, propertyKey: string | symbol): UserRole[] {
  const methodRoles = Reflect.getMetadata(ROLES_KEY, target, propertyKey)
  const classRoles = Reflect.getMetadata(ROLES_KEY, target.constructor)
  return methodRoles || classRoles || []
}
