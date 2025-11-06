import { NextRequest } from 'next/server'
import { Injectable } from '../decorators'
import { UnauthorizedException } from '../filters'
import { TokenService } from '../auth/token.service'
import { UserRepository } from '../database/repositories/user.repository'
import { LoggerService } from '../logger/logger.service'

/**
 * Authentication Guard
 * Validates JWT tokens and adds user to request context
 */
@Injectable()
export class AuthGuard {
  private readonly logger: LoggerService

  constructor(
    private readonly tokenService: TokenService,
    private readonly userRepository: UserRepository,
    logger: LoggerService
  ) {
    this.logger = logger.setContext('AuthGuard')
  }

  /**
   * Check if the request is authenticated
   * @param context - Route context containing request
   * @returns True if authenticated
   * @throws UnauthorizedException if not authenticated
   */
  async canActivate(context: any): Promise<boolean> {
    const { request } = context

    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = this.tokenService.extractTokenFromHeader(authHeader)

    if (!token) {
      this.logger.debug('No token provided in Authorization header')
      throw new UnauthorizedException('Authentication required')
    }

    try {
      // Verify token
      const payload = this.tokenService.verifyAccessToken(token)

      // Get user from database
      const user = await this.userRepository.findById(payload.sub)

      if (!user) {
        this.logger.warn(`User not found for token payload: ${payload.sub}`)
        throw new UnauthorizedException('User not found')
      }

      if (!user.isActive) {
        this.logger.warn(`Inactive user attempted access: ${user.id}`)
        throw new UnauthorizedException('Account is inactive')
      }

      // Add user to request context
      ;(request as any).user = user
      ;(request as any).tokenPayload = payload

      this.logger.debug(`User authenticated: ${user.id}`)
      return true
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }

      this.logger.error('Authentication failed', (error as Error).stack)
      throw new UnauthorizedException('Invalid or expired token')
    }
  }

  /**
   * Extract user from authenticated request
   * Helper method for controllers
   * @param request - Next.js request
   * @returns User or null
   */
  static getUserFromRequest(request: NextRequest): any {
    return (request as any).user || null
  }

  /**
   * Extract token payload from authenticated request
   * @param request - Next.js request
   * @returns Token payload or null
   */
  static getTokenPayloadFromRequest(request: NextRequest): any {
    return (request as any).tokenPayload || null
  }
}
