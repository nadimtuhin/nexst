// @ts-nocheck
import * as jwt from 'jsonwebtoken'
import { Injectable } from '../decorators'
import { ConfigService } from '../../config/config.service'
import { LoggerService } from '../logger/logger.service'
import { UnauthorizedException } from '../filters'
import { UserRole } from '@prisma/client'

export interface TokenPayload {
  sub: number // User ID
  email: string
  role: UserRole
  tenantId?: number // Tenant ID (optional, for multi-tenancy)
  iat?: number // Issued at
  exp?: number // Expiration
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

/**
 * Token Service
 * Handles JWT token generation and validation
 */
@Injectable()
export class TokenService {
  private readonly logger: LoggerService

  constructor(
    private readonly config: ConfigService,
    logger: LoggerService
  ) {
    this.logger = logger.setContext('TokenService')
  }

  /**
   * Generate an access token
   * @param payload - Token payload
   * @returns JWT access token
   */
  generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    try {
      // Filter out undefined values from payload
      const cleanPayload: any = {}
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanPayload[key] = value
        }
      })

      const token = jwt.sign(cleanPayload, this.config.security.jwtSecret, {
        expiresIn: this.config.security.jwtExpiresIn,
      })

      this.logger.debug(`Access token generated for user: ${payload.sub}`)
      return token
    } catch (error) {
      this.logger.error(
        'Failed to generate access token',
        (error as Error).stack
      )
      throw new Error('Token generation failed')
    }
  }

  /**
   * Generate a refresh token
   * @param userId - User ID
   * @param tenantId - Tenant ID (optional)
   * @returns JWT refresh token
   */
  generateRefreshToken(userId: number, tenantId?: number): string {
    try {
      const payload: any = { sub: userId, type: 'refresh' }
      if (tenantId !== undefined) {
        payload.tenantId = tenantId
      }

      const token = jwt.sign(
        payload,
        this.config.security.jwtRefreshSecret,
        {
          expiresIn: this.config.security.jwtRefreshExpiresIn,
        }
      )

      this.logger.debug(`Refresh token generated for user: ${userId}`)
      return token
    } catch (error) {
      this.logger.error(
        'Failed to generate refresh token',
        (error as Error).stack
      )
      throw new Error('Refresh token generation failed')
    }
  }

  /**
   * Generate both access and refresh tokens
   * @param payload - Token payload
   * @returns Token pair
   */
  generateTokenPair(payload: Omit<TokenPayload, 'iat' | 'exp'>): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload.sub, payload.tenantId),
    }
  }

  /**
   * Verify an access token
   * @param token - JWT token to verify
   * @returns Decoded token payload
   * @throws UnauthorizedException if token is invalid
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(
        token,
        this.config.security.jwtSecret
      ) as TokenPayload

      this.logger.debug(`Access token verified for user: ${payload.sub}`)
      return payload
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        this.logger.warn('Access token expired')
        throw new UnauthorizedException('Token expired')
      } else if (error instanceof jwt.JsonWebTokenError) {
        this.logger.warn('Invalid access token')
        throw new UnauthorizedException('Invalid token')
      } else {
        this.logger.error('Token verification failed', (error as Error).stack)
        throw new UnauthorizedException('Token verification failed')
      }
    }
  }

  /**
   * Verify a refresh token
   * @param token - Refresh token to verify
   * @returns Decoded token payload
   * @throws UnauthorizedException if token is invalid
   */
  verifyRefreshToken(token: string): { sub: number; type: string; tenantId?: number } {
    try {
      const payload = jwt.verify(
        token,
        this.config.security.jwtRefreshSecret
      ) as { sub: number; type: string; tenantId?: number }

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type')
      }

      this.logger.debug(`Refresh token verified for user: ${payload.sub}`)
      return payload
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        this.logger.warn('Refresh token expired')
        throw new UnauthorizedException('Refresh token expired')
      } else if (error instanceof jwt.JsonWebTokenError) {
        this.logger.warn('Invalid refresh token')
        throw new UnauthorizedException('Invalid refresh token')
      } else if (error instanceof UnauthorizedException) {
        throw error
      } else {
        this.logger.error(
          'Refresh token verification failed',
          (error as Error).stack
        )
        throw new UnauthorizedException('Token verification failed')
      }
    }
  }

  /**
   * Decode a token without verifying it (for debugging)
   * @param token - JWT token
   * @returns Decoded token or null
   */
  decodeToken(token: string): any {
    try {
      return jwt.decode(token)
    } catch (error) {
      this.logger.error('Failed to decode token', (error as Error).stack)
      return null
    }
  }

  /**
   * Extract token from Authorization header
   * @param authHeader - Authorization header value
   * @returns Extracted token or null
   */
  extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) {
      return null
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null
    }

    return parts[1]
  }

  /**
   * Get token expiration time
   * @param token - JWT token
   * @returns Expiration timestamp or null
   */
  getTokenExpiration(token: string): number | null {
    try {
      const decoded = jwt.decode(token) as { exp?: number }
      return decoded?.exp || null
    } catch (error) {
      return null
    }
  }

  /**
   * Check if token is expired
   * @param token - JWT token
   * @returns True if expired, false otherwise
   */
  isTokenExpired(token: string): boolean {
    const exp = this.getTokenExpiration(token)
    if (!exp) {
      return true
    }
    return Date.now() >= exp * 1000
  }
}
