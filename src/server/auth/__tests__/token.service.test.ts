import 'reflect-metadata'
import { container } from 'tsyringe'
import { TokenService } from '../token.service'
import { ConfigService } from '../../../config/config.service'
import { LoggerService } from '../../logger/logger.service'
import { UnauthorizedException } from '../../filters'
import { UserRole } from '@prisma/client'
import * as jwt from 'jsonwebtoken'

describe('TokenService', () => {
  let tokenService: TokenService
  let configService: ConfigService

  beforeAll(() => {
    // Register services
    if (!container.isRegistered(LoggerService)) {
      container.registerSingleton(LoggerService)
    }
    if (!container.isRegistered(ConfigService)) {
      container.registerSingleton(ConfigService)
    }
    if (!container.isRegistered(TokenService)) {
      container.registerSingleton(TokenService)
    }
  })

  beforeEach(() => {
    tokenService = container.resolve(TokenService)
    configService = container.resolve(ConfigService)
  })

  afterAll(() => {
    container.clearInstances()
  })

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const payload = {
        sub: 1,
        email: 'test@example.com',
        role: UserRole.USER,
      }

      const token = tokenService.generateAccessToken(payload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should include payload data in token', () => {
      const payload = {
        sub: 1,
        email: 'test@example.com',
        role: UserRole.USER,
      }

      const token = tokenService.generateAccessToken(payload)
      const decoded = jwt.decode(token) as any

      expect(decoded.sub).toBe(payload.sub)
      expect(decoded.email).toBe(payload.email)
      expect(decoded.role).toBe(payload.role)
    })

    it('should include expiration time', () => {
      const payload = {
        sub: 1,
        email: 'test@example.com',
        role: UserRole.USER,
      }

      const token = tokenService.generateAccessToken(payload)
      const decoded = jwt.decode(token) as any

      expect(decoded.exp).toBeDefined()
      expect(decoded.iat).toBeDefined()
      expect(decoded.exp).toBeGreaterThan(decoded.iat)
    })

    it('should generate different tokens for different users', () => {
      const token1 = tokenService.generateAccessToken({
        sub: 1,
        email: 'user1@example.com',
        role: UserRole.USER,
      })

      const token2 = tokenService.generateAccessToken({
        sub: 2,
        email: 'user2@example.com',
        role: UserRole.USER,
      })

      expect(token1).not.toBe(token2)
    })

    it('should generate tokens for different roles', () => {
      const userToken = tokenService.generateAccessToken({
        sub: 1,
        email: 'user@example.com',
        role: UserRole.USER,
      })

      const adminToken = tokenService.generateAccessToken({
        sub: 2,
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      })

      const decoded1 = jwt.decode(userToken) as any
      const decoded2 = jwt.decode(adminToken) as any

      expect(decoded1.role).toBe(UserRole.USER)
      expect(decoded2.role).toBe(UserRole.ADMIN)
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const userId = 1
      const token = tokenService.generateRefreshToken(userId)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('should include user id in token', () => {
      const userId = 1
      const token = tokenService.generateRefreshToken(userId)
      const decoded = jwt.decode(token) as any

      expect(decoded.sub).toBe(userId)
      expect(decoded.type).toBe('refresh')
    })

    it('should have longer expiration than access token', () => {
      const accessToken = tokenService.generateAccessToken({
        sub: 1,
        email: 'test@example.com',
        role: UserRole.USER,
      })
      const refreshToken = tokenService.generateRefreshToken(1)

      const accessDecoded = jwt.decode(accessToken) as any
      const refreshDecoded = jwt.decode(refreshToken) as any

      const accessExpiry = accessDecoded.exp - accessDecoded.iat
      const refreshExpiry = refreshDecoded.exp - refreshDecoded.iat

      expect(refreshExpiry).toBeGreaterThan(accessExpiry)
    })

    it('should generate different tokens for different users', () => {
      const token1 = tokenService.generateRefreshToken(1)
      const token2 = tokenService.generateRefreshToken(2)

      expect(token1).not.toBe(token2)
    })
  })

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const payload = {
        sub: 1,
        email: 'test@example.com',
        role: UserRole.USER,
      }

      const tokens = tokenService.generateTokenPair(payload)

      expect(tokens.accessToken).toBeDefined()
      expect(tokens.refreshToken).toBeDefined()
      expect(tokens.accessToken).not.toBe(tokens.refreshToken)
    })

    it('should have matching user ids in both tokens', () => {
      const payload = {
        sub: 1,
        email: 'test@example.com',
        role: UserRole.USER,
      }

      const tokens = tokenService.generateTokenPair(payload)
      const accessDecoded = jwt.decode(tokens.accessToken) as any
      const refreshDecoded = jwt.decode(tokens.refreshToken) as any

      expect(accessDecoded.sub).toBe(payload.sub)
      expect(refreshDecoded.sub).toBe(payload.sub)
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const payload = {
        sub: 1,
        email: 'test@example.com',
        role: UserRole.USER,
      }

      const token = tokenService.generateAccessToken(payload)
      const verified = tokenService.verifyAccessToken(token)

      expect(verified.sub).toBe(payload.sub)
      expect(verified.email).toBe(payload.email)
      expect(verified.role).toBe(payload.role)
    })

    it('should throw UnauthorizedException for invalid token', () => {
      const invalidToken = 'invalid.token.here'

      expect(() => {
        tokenService.verifyAccessToken(invalidToken)
      }).toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException for malformed token', () => {
      const malformedToken = 'not-a-jwt-token'

      expect(() => {
        tokenService.verifyAccessToken(malformedToken)
      }).toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException for token signed with wrong secret', () => {
      const payload = { sub: 1, email: 'test@example.com', role: UserRole.USER }
      const wrongToken = jwt.sign(payload, 'wrong-secret', { expiresIn: '1h' })

      expect(() => {
        tokenService.verifyAccessToken(wrongToken)
      }).toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException with expired message for expired token', () => {
      const payload = { sub: 1, email: 'test@example.com', role: UserRole.USER }
      const expiredToken = jwt.sign(
        payload,
        configService.security.jwtSecret,
        { expiresIn: '-1h' } // Expired 1 hour ago
      )

      expect(() => {
        tokenService.verifyAccessToken(expiredToken)
      }).toThrow(UnauthorizedException)

      try {
        tokenService.verifyAccessToken(expiredToken)
      } catch (error) {
        expect((error as Error).message).toContain('expired')
      }
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const userId = 1
      const token = tokenService.generateRefreshToken(userId)
      const verified = tokenService.verifyRefreshToken(token)

      expect(verified.sub).toBe(userId)
      expect(verified.type).toBe('refresh')
    })

    it('should throw UnauthorizedException for invalid refresh token', () => {
      const invalidToken = 'invalid.refresh.token'

      expect(() => {
        tokenService.verifyRefreshToken(invalidToken)
      }).toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException for access token used as refresh', () => {
      const accessToken = tokenService.generateAccessToken({
        sub: 1,
        email: 'test@example.com',
        role: UserRole.USER,
      })

      expect(() => {
        tokenService.verifyRefreshToken(accessToken)
      }).toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException for expired refresh token', () => {
      const payload = { sub: 1, type: 'refresh' }
      const expiredToken = jwt.sign(
        payload,
        configService.security.jwtRefreshSecret,
        { expiresIn: '-1d' }
      )

      expect(() => {
        tokenService.verifyRefreshToken(expiredToken)
      }).toThrow(UnauthorizedException)
    })
  })

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const payload = {
        sub: 1,
        email: 'test@example.com',
        role: UserRole.USER,
      }
      const token = tokenService.generateAccessToken(payload)

      const decoded = tokenService.decodeToken(token)

      expect(decoded.sub).toBe(payload.sub)
      expect(decoded.email).toBe(payload.email)
      expect(decoded.role).toBe(payload.role)
    })

    it('should decode expired token', () => {
      const payload = { sub: 1, email: 'test@example.com', role: UserRole.USER }
      const expiredToken = jwt.sign(
        payload,
        configService.security.jwtSecret,
        { expiresIn: '-1h' }
      )

      const decoded = tokenService.decodeToken(expiredToken)
      expect(decoded).toBeDefined()
      expect(decoded.sub).toBe(payload.sub)
    })

    it('should return null for invalid token', () => {
      const decoded = tokenService.decodeToken('invalid-token')
      expect(decoded).toBeNull()
    })
  })

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
      const header = `Bearer ${token}`

      const extracted = tokenService.extractTokenFromHeader(header)
      expect(extracted).toBe(token)
    })

    it('should return null for missing header', () => {
      const extracted = tokenService.extractTokenFromHeader(null)
      expect(extracted).toBeNull()
    })

    it('should return null for header without Bearer prefix', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
      const extracted = tokenService.extractTokenFromHeader(token)
      expect(extracted).toBeNull()
    })

    it('should return null for malformed Bearer header', () => {
      const extracted = tokenService.extractTokenFromHeader('Bearer')
      expect(extracted).toBeNull()
    })

    it('should return null for header with wrong scheme', () => {
      const extracted = tokenService.extractTokenFromHeader('Basic token123')
      expect(extracted).toBeNull()
    })

    it('should handle header with extra spaces', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
      const header = `Bearer  ${token}` // Extra space

      const extracted = tokenService.extractTokenFromHeader(header)
      expect(extracted).toBeNull() // Should return null due to malformed format
    })
  })

  describe('getTokenExpiration', () => {
    it('should return expiration timestamp', () => {
      const token = tokenService.generateAccessToken({
        sub: 1,
        email: 'test@example.com',
        role: UserRole.USER,
      })

      const expiration = tokenService.getTokenExpiration(token)
      expect(expiration).toBeDefined()
      expect(typeof expiration).toBe('number')
      expect(expiration).toBeGreaterThan(Date.now() / 1000)
    })

    it('should return null for invalid token', () => {
      const expiration = tokenService.getTokenExpiration('invalid-token')
      expect(expiration).toBeNull()
    })

    it('should return expiration for expired token', () => {
      const payload = { sub: 1, email: 'test@example.com', role: UserRole.USER }
      const expiredToken = jwt.sign(
        payload,
        configService.security.jwtSecret,
        { expiresIn: '-1h' }
      )

      const expiration = tokenService.getTokenExpiration(expiredToken)
      expect(expiration).toBeDefined()
      expect(expiration).toBeLessThan(Date.now() / 1000)
    })
  })

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = tokenService.generateAccessToken({
        sub: 1,
        email: 'test@example.com',
        role: UserRole.USER,
      })

      const isExpired = tokenService.isTokenExpired(token)
      expect(isExpired).toBe(false)
    })

    it('should return true for expired token', () => {
      const payload = { sub: 1, email: 'test@example.com', role: UserRole.USER }
      const expiredToken = jwt.sign(
        payload,
        configService.security.jwtSecret,
        { expiresIn: '-1h' }
      )

      const isExpired = tokenService.isTokenExpired(expiredToken)
      expect(isExpired).toBe(true)
    })

    it('should return true for invalid token', () => {
      const isExpired = tokenService.isTokenExpired('invalid-token')
      expect(isExpired).toBe(true)
    })
  })

  describe('Integration Tests', () => {
    it('should complete full token lifecycle', () => {
      // Generate tokens
      const payload = {
        sub: 1,
        email: 'test@example.com',
        role: UserRole.USER,
      }
      const tokens = tokenService.generateTokenPair(payload)

      // Verify access token
      const accessVerified = tokenService.verifyAccessToken(tokens.accessToken)
      expect(accessVerified.sub).toBe(payload.sub)

      // Verify refresh token
      const refreshVerified = tokenService.verifyRefreshToken(
        tokens.refreshToken
      )
      expect(refreshVerified.sub).toBe(payload.sub)

      // Extract from header
      const extracted = tokenService.extractTokenFromHeader(
        `Bearer ${tokens.accessToken}`
      )
      expect(extracted).toBe(tokens.accessToken)

      // Check expiration
      const isExpired = tokenService.isTokenExpired(tokens.accessToken)
      expect(isExpired).toBe(false)
    })

    it('should handle token refresh scenario', () => {
      // Initial login - generate tokens
      const userId = 1
      const initialTokens = tokenService.generateTokenPair({
        sub: userId,
        email: 'test@example.com',
        role: UserRole.USER,
      })

      // Verify refresh token
      const refreshVerified = tokenService.verifyRefreshToken(
        initialTokens.refreshToken
      )
      expect(refreshVerified.sub).toBe(userId)

      // Generate new access token
      const newAccessToken = tokenService.generateAccessToken({
        sub: userId,
        email: 'test@example.com',
        role: UserRole.USER,
      })

      // Verify new access token
      const newVerified = tokenService.verifyAccessToken(newAccessToken)
      expect(newVerified.sub).toBe(userId)
    })
  })
})
