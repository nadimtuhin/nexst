import { RefreshToken } from '@prisma/client'
import { Injectable } from '../../decorators'
import { PrismaService } from '../prisma.service'
import { BaseRepository } from './base.repository'

/**
 * RefreshToken Repository
 * Handles all database operations for RefreshToken model
 */
@Injectable()
export class RefreshTokenRepository extends BaseRepository<RefreshToken> {
  protected modelName = 'refreshToken'

  constructor(prisma: PrismaService) {
    super(prisma)
  }

  /**
   * Find refresh token by token string
   * @param token - Token string to search for
   * @returns RefreshToken or null
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.findOne({ token })
  }

  /**
   * Find all refresh tokens for a user
   * @param userId - User ID
   * @returns Array of refresh tokens
   */
  async findByUserId(userId: number): Promise<RefreshToken[]> {
    return this.findAll({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Find valid (non-expired) token by token string
   * @param token - Token string to search for
   * @returns RefreshToken or null
   */
  async findValidToken(token: string): Promise<RefreshToken | null> {
    return this.findOne({
      token,
      expiresAt: {
        gt: new Date(),
      },
    })
  }

  /**
   * Create a new refresh token
   * @param data - Refresh token data
   * @returns Created refresh token
   */
  async createToken(data: {
    token: string
    userId: number
    tenantId?: number
    expiresAt: Date
  }): Promise<RefreshToken> {
    return this.create(data)
  }

  /**
   * Revoke (delete) a refresh token
   * @param token - Token string to revoke
   * @returns Deleted refresh token or throws error
   */
  async revokeToken(token: string): Promise<RefreshToken> {
    const refreshToken = await this.findByToken(token)
    if (!refreshToken) {
      throw new Error('Refresh token not found')
    }
    return this.delete(refreshToken.id)
  }

  /**
   * Revoke all refresh tokens for a user
   * @param userId - User ID
   * @returns Number of tokens revoked
   */
  async revokeAllUserTokens(userId: number): Promise<number> {
    return this.deleteMany({ userId })
  }

  /**
   * Delete expired refresh tokens
   * @returns Number of tokens deleted
   */
  async deleteExpiredTokens(): Promise<number> {
    return this.deleteMany({
      expiresAt: {
        lt: new Date(),
      },
    })
  }

  /**
   * Count active tokens for a user
   * @param userId - User ID
   * @returns Number of active tokens
   */
  async countActiveTokens(userId: number): Promise<number> {
    return this.count({
      userId,
      expiresAt: {
        gt: new Date(),
      },
    })
  }

  /**
   * Check if a token exists and is valid
   * @param token - Token string to check
   * @returns True if valid, false otherwise
   */
  async isTokenValid(token: string): Promise<boolean> {
    const refreshToken = await this.findValidToken(token)
    return refreshToken !== null
  }

  /**
   * Get all expired tokens for a user
   * @param userId - User ID
   * @returns Array of expired tokens
   */
  async findExpiredTokens(userId: number): Promise<RefreshToken[]> {
    return this.findAll({
      where: {
        userId,
        expiresAt: {
          lt: new Date(),
        },
      },
      orderBy: { expiresAt: 'desc' },
    })
  }

  /**
   * Clean up expired tokens (maintenance task)
   * @param olderThanDays - Delete tokens expired for more than N days
   * @returns Number of tokens deleted
   */
  async cleanupExpiredTokens(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    return this.deleteMany({
      expiresAt: {
        lt: cutoffDate,
      },
    })
  }
}
