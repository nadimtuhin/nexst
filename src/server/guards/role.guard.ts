import { NextRequest } from 'next/server'
import { Injectable } from '../decorators'
import { ForbiddenException, UnauthorizedException } from '../filters'
import { LoggerService } from '../logger/logger.service'
import { UserRole } from '@prisma/client'

/**
 * Role Guard
 * Checks if the authenticated user has the required role(s)
 */
@Injectable()
export class RoleGuard {
  private readonly logger: LoggerService
  private requiredRoles: UserRole[] = []

  constructor(logger: LoggerService) {
    this.logger = logger.setContext('RoleGuard')
  }

  /**
   * Set required roles for this guard instance
   * @param roles - Array of required roles
   * @returns this
   */
  setRoles(roles: UserRole[]): this {
    this.requiredRoles = roles
    return this
  }

  /**
   * Check if the user has the required role
   * @param context - Route context containing request
   * @returns True if authorized
   * @throws UnauthorizedException if not authenticated
   * @throws ForbiddenException if not authorized
   */
  async canActivate(context: any): Promise<boolean> {
    const { request } = context

    // Check if user is authenticated
    const user = (request as any).user
    if (!user) {
      this.logger.debug('No user in request context')
      throw new UnauthorizedException('Authentication required')
    }

    // If no roles specified, allow access (guard is misconfigured)
    if (this.requiredRoles.length === 0) {
      this.logger.warn('RoleGuard used without specifying required roles')
      return true
    }

    // Check if user has any of the required roles
    const hasRole = this.requiredRoles.includes(user.role)

    if (!hasRole) {
      this.logger.warn(
        `User ${user.id} with role ${user.role} attempted to access resource requiring roles: ${this.requiredRoles.join(', ')}`
      )
      throw new ForbiddenException('Insufficient permissions')
    }

    this.logger.debug(
      `User ${user.id} authorized with role: ${user.role}`
    )
    return true
  }

  /**
   * Check if user has a specific role
   * @param request - Next.js request
   * @param role - Role to check
   * @returns True if user has the role
   */
  static hasRole(request: NextRequest, role: UserRole): boolean {
    const user = (request as any).user
    return user && user.role === role
  }

  /**
   * Check if user has any of the specified roles
   * @param request - Next.js request
   * @param roles - Roles to check
   * @returns True if user has any of the roles
   */
  static hasAnyRole(request: NextRequest, roles: UserRole[]): boolean {
    const user = (request as any).user
    return user && roles.includes(user.role)
  }

  /**
   * Check if user is an admin
   * @param request - Next.js request
   * @returns True if user is admin
   */
  static isAdmin(request: NextRequest): boolean {
    return this.hasRole(request, UserRole.ADMIN)
  }

  /**
   * Check if user is a moderator or admin
   * @param request - Next.js request
   * @returns True if user is moderator or admin
   */
  static isModerator(request: NextRequest): boolean {
    return this.hasAnyRole(request, [UserRole.ADMIN, UserRole.MODERATOR])
  }
}
