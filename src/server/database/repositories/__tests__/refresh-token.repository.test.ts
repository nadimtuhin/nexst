import 'reflect-metadata'
import { container } from 'tsyringe'
import { RefreshTokenRepository } from '../refresh-token.repository'
import { PrismaService } from '../../prisma.service'
import { LoggerService } from '../../../logger/logger.service'

describe('RefreshTokenRepository', () => {
  let refreshTokenRepository: RefreshTokenRepository
  let prismaService: PrismaService
  let testUserId: number

  beforeAll(() => {
    // Register services
    if (!container.isRegistered(LoggerService)) {
      container.registerSingleton(LoggerService)
    }
    if (!container.isRegistered(PrismaService)) {
      container.registerSingleton(PrismaService)
    }
    if (!container.isRegistered(RefreshTokenRepository)) {
      container.registerSingleton(RefreshTokenRepository)
    }
  })

  beforeEach(async () => {
    prismaService = container.resolve(PrismaService)
    refreshTokenRepository = container.resolve(RefreshTokenRepository)

    await prismaService.onModuleInit()
    await prismaService.cleanDatabase()

    // Create a test user
    const user = await prismaService.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        role: 'USER',
        isActive: true,
      },
    })
    testUserId = user.id
  })

  afterEach(async () => {
    await prismaService.cleanDatabase()
  })

  afterAll(async () => {
    await prismaService.onModuleDestroy()
    container.clearInstances()
  })

  describe('createToken', () => {
    it('should create a refresh token', async () => {
      const tokenData = {
        token: 'test-refresh-token',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }

      const refreshToken = await refreshTokenRepository.createToken(tokenData)

      expect(refreshToken).toBeDefined()
      expect(refreshToken.token).toBe(tokenData.token)
      expect(refreshToken.userId).toBe(tokenData.userId)
      expect(refreshToken.expiresAt).toEqual(tokenData.expiresAt)
    })

    it('should create token with timestamps', async () => {
      const tokenData = {
        token: 'test-refresh-token',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }

      const refreshToken = await refreshTokenRepository.createToken(tokenData)

      expect(refreshToken.createdAt).toBeDefined()
      expect(refreshToken.updatedAt).toBeDefined()
      expect(refreshToken.createdAt).toBeInstanceOf(Date)
    })
  })

  describe('findByToken', () => {
    it('should find token by token string', async () => {
      const tokenData = {
        token: 'find-me-token',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }

      await refreshTokenRepository.createToken(tokenData)

      const found = await refreshTokenRepository.findByToken('find-me-token')

      expect(found).toBeDefined()
      expect(found?.token).toBe('find-me-token')
      expect(found?.userId).toBe(testUserId)
    })

    it('should return null for non-existent token', async () => {
      const found = await refreshTokenRepository.findByToken(
        'non-existent-token'
      )
      expect(found).toBeNull()
    })
  })

  describe('findByUserId', () => {
    it('should find all tokens for a user', async () => {
      const tokens = [
        {
          token: 'token-1',
          userId: testUserId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          token: 'token-2',
          userId: testUserId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          token: 'token-3',
          userId: testUserId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      ]

      for (const tokenData of tokens) {
        await refreshTokenRepository.createToken(tokenData)
      }

      const found = await refreshTokenRepository.findByUserId(testUserId)

      expect(found).toHaveLength(3)
      expect(found.every((t) => t.userId === testUserId)).toBe(true)
    })

    it('should return empty array for user with no tokens', async () => {
      const found = await refreshTokenRepository.findByUserId(999999)
      expect(found).toEqual([])
    })

    it('should return tokens in descending order by creation date', async () => {
      // Create tokens with slight delays
      await refreshTokenRepository.createToken({
        token: 'token-1',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      await new Promise((resolve) => setTimeout(resolve, 10))

      await refreshTokenRepository.createToken({
        token: 'token-2',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      const found = await refreshTokenRepository.findByUserId(testUserId)

      expect(found[0].token).toBe('token-2') // Most recent first
      expect(found[1].token).toBe('token-1')
    })
  })

  describe('findValidToken', () => {
    it('should find valid non-expired token', async () => {
      const futureExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      await refreshTokenRepository.createToken({
        token: 'valid-token',
        userId: testUserId,
        expiresAt: futureExpiry,
      })

      const found = await refreshTokenRepository.findValidToken('valid-token')

      expect(found).toBeDefined()
      expect(found?.token).toBe('valid-token')
    })

    it('should return null for expired token', async () => {
      const pastExpiry = new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago

      await refreshTokenRepository.createToken({
        token: 'expired-token',
        userId: testUserId,
        expiresAt: pastExpiry,
      })

      const found = await refreshTokenRepository.findValidToken('expired-token')

      expect(found).toBeNull()
    })

    it('should return null for non-existent token', async () => {
      const found =
        await refreshTokenRepository.findValidToken('non-existent')
      expect(found).toBeNull()
    })
  })

  describe('revokeToken', () => {
    it('should revoke (delete) a token', async () => {
      await refreshTokenRepository.createToken({
        token: 'revoke-me',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      const revoked = await refreshTokenRepository.revokeToken('revoke-me')

      expect(revoked).toBeDefined()
      expect(revoked.token).toBe('revoke-me')

      // Verify it's deleted
      const found = await refreshTokenRepository.findByToken('revoke-me')
      expect(found).toBeNull()
    })

    it('should throw error when revoking non-existent token', async () => {
      await expect(
        refreshTokenRepository.revokeToken('non-existent')
      ).rejects.toThrow('Refresh token not found')
    })
  })

  describe('revokeAllUserTokens', () => {
    it('should revoke all tokens for a user', async () => {
      // Create multiple tokens
      await refreshTokenRepository.createToken({
        token: 'token-1',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      await refreshTokenRepository.createToken({
        token: 'token-2',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      await refreshTokenRepository.createToken({
        token: 'token-3',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      const count = await refreshTokenRepository.revokeAllUserTokens(testUserId)

      expect(count).toBe(3)

      // Verify all tokens are deleted
      const remaining = await refreshTokenRepository.findByUserId(testUserId)
      expect(remaining).toHaveLength(0)
    })

    it('should return 0 when user has no tokens', async () => {
      const count = await refreshTokenRepository.revokeAllUserTokens(999999)
      expect(count).toBe(0)
    })
  })

  describe('deleteExpiredTokens', () => {
    it('should delete only expired tokens', async () => {
      // Create expired token
      await refreshTokenRepository.createToken({
        token: 'expired',
        userId: testUserId,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      })

      // Create valid token
      await refreshTokenRepository.createToken({
        token: 'valid',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      const count = await refreshTokenRepository.deleteExpiredTokens()

      expect(count).toBe(1)

      // Verify valid token still exists
      const validToken = await refreshTokenRepository.findByToken('valid')
      expect(validToken).toBeDefined()

      // Verify expired token is deleted
      const expiredToken = await refreshTokenRepository.findByToken('expired')
      expect(expiredToken).toBeNull()
    })

    it('should return 0 when no expired tokens exist', async () => {
      await refreshTokenRepository.createToken({
        token: 'valid',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      const count = await refreshTokenRepository.deleteExpiredTokens()
      expect(count).toBe(0)
    })
  })

  describe('countActiveTokens', () => {
    it('should count only active (non-expired) tokens', async () => {
      // Create active tokens
      await refreshTokenRepository.createToken({
        token: 'active-1',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      await refreshTokenRepository.createToken({
        token: 'active-2',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      // Create expired token
      await refreshTokenRepository.createToken({
        token: 'expired',
        userId: testUserId,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      })

      const count = await refreshTokenRepository.countActiveTokens(testUserId)

      expect(count).toBe(2) // Only active tokens
    })

    it('should return 0 for user with no active tokens', async () => {
      const count = await refreshTokenRepository.countActiveTokens(999999)
      expect(count).toBe(0)
    })
  })

  describe('isTokenValid', () => {
    it('should return true for valid token', async () => {
      await refreshTokenRepository.createToken({
        token: 'valid-token',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      const isValid = await refreshTokenRepository.isTokenValid('valid-token')
      expect(isValid).toBe(true)
    })

    it('should return false for expired token', async () => {
      await refreshTokenRepository.createToken({
        token: 'expired-token',
        userId: testUserId,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      })

      const isValid = await refreshTokenRepository.isTokenValid('expired-token')
      expect(isValid).toBe(false)
    })

    it('should return false for non-existent token', async () => {
      const isValid = await refreshTokenRepository.isTokenValid('non-existent')
      expect(isValid).toBe(false)
    })
  })

  describe('cleanupExpiredTokens', () => {
    it('should cleanup tokens expired for more than specified days', async () => {
      const now = Date.now()

      // Token expired 40 days ago
      await refreshTokenRepository.createToken({
        token: 'old-expired',
        userId: testUserId,
        expiresAt: new Date(now - 40 * 24 * 60 * 60 * 1000),
      })

      // Token expired 20 days ago
      await refreshTokenRepository.createToken({
        token: 'recent-expired',
        userId: testUserId,
        expiresAt: new Date(now - 20 * 24 * 60 * 60 * 1000),
      })

      // Valid token
      await refreshTokenRepository.createToken({
        token: 'valid',
        userId: testUserId,
        expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
      })

      const count = await refreshTokenRepository.cleanupExpiredTokens(30) // Older than 30 days

      expect(count).toBe(1) // Only old-expired should be deleted

      // Verify
      const oldExpired = await refreshTokenRepository.findByToken('old-expired')
      expect(oldExpired).toBeNull()

      const recentExpired =
        await refreshTokenRepository.findByToken('recent-expired')
      expect(recentExpired).toBeDefined()

      const valid = await refreshTokenRepository.findByToken('valid')
      expect(valid).toBeDefined()
    })

    it('should use default 30 days when not specified', async () => {
      const now = Date.now()

      await refreshTokenRepository.createToken({
        token: 'old-token',
        userId: testUserId,
        expiresAt: new Date(now - 40 * 24 * 60 * 60 * 1000),
      })

      const count = await refreshTokenRepository.cleanupExpiredTokens()
      expect(count).toBe(1)
    })
  })

  describe('Integration Tests', () => {
    it('should handle token lifecycle', async () => {
      // Create token
      const token = await refreshTokenRepository.createToken({
        token: 'lifecycle-token',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      expect(token).toBeDefined()

      // Find it
      const found = await refreshTokenRepository.findByToken('lifecycle-token')
      expect(found).toBeDefined()

      // Validate it
      const isValid =
        await refreshTokenRepository.isTokenValid('lifecycle-token')
      expect(isValid).toBe(true)

      // Revoke it
      await refreshTokenRepository.revokeToken('lifecycle-token')

      // Verify it's gone
      const afterRevoke =
        await refreshTokenRepository.findByToken('lifecycle-token')
      expect(afterRevoke).toBeNull()
    })

    it('should handle multiple users', async () => {
      // Create another user
      const user2 = await prismaService.user.create({
        data: {
          email: 'user2@example.com',
          name: 'User 2',
          password: 'hashedpassword',
          role: 'USER',
          isActive: true,
        },
      })

      // Create tokens for both users
      await refreshTokenRepository.createToken({
        token: 'user1-token',
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      await refreshTokenRepository.createToken({
        token: 'user2-token',
        userId: user2.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      // Get tokens by user
      const user1Tokens = await refreshTokenRepository.findByUserId(testUserId)
      const user2Tokens = await refreshTokenRepository.findByUserId(user2.id)

      expect(user1Tokens).toHaveLength(1)
      expect(user2Tokens).toHaveLength(1)
      expect(user1Tokens[0].token).toBe('user1-token')
      expect(user2Tokens[0].token).toBe('user2-token')

      // Revoke user1 tokens
      await refreshTokenRepository.revokeAllUserTokens(testUserId)

      // Verify user2 still has tokens
      const user2TokensAfter =
        await refreshTokenRepository.findByUserId(user2.id)
      expect(user2TokensAfter).toHaveLength(1)
    })
  })
})
