import 'reflect-metadata'
import { container } from 'tsyringe'
import { AuthGuard } from '../auth.guard'
import { TokenService } from '../../auth/token.service'
import { UserRepository } from '../../database/repositories/user.repository'
import { PrismaService } from '../../database/prisma.service'
import { ConfigService } from '../../../config/config.service'
import { LoggerService } from '../../logger/logger.service'
import { UnauthorizedException } from '../../filters'
import { UserRole } from '@prisma/client'

describe('AuthGuard', () => {
  let authGuard: AuthGuard
  let tokenService: TokenService
  let userRepository: UserRepository
  let prismaService: PrismaService
  let testUserId: number
  let validAccessToken: string

  beforeAll(() => {
    // Register services
    if (!container.isRegistered(LoggerService)) {
      container.registerSingleton(LoggerService)
    }
    if (!container.isRegistered(ConfigService)) {
      container.registerSingleton(ConfigService)
    }
    if (!container.isRegistered(PrismaService)) {
      container.registerSingleton(PrismaService)
    }
    if (!container.isRegistered(UserRepository)) {
      container.registerSingleton(UserRepository)
    }
    if (!container.isRegistered(TokenService)) {
      container.registerSingleton(TokenService)
    }
    if (!container.isRegistered(AuthGuard)) {
      container.registerSingleton(AuthGuard)
    }
  })

  beforeEach(async () => {
    authGuard = container.resolve(AuthGuard)
    tokenService = container.resolve(TokenService)
    userRepository = container.resolve(UserRepository)
    prismaService = container.resolve(PrismaService)

    await prismaService.onModuleInit()
    await prismaService.cleanDatabase()

    // Create test user
    const user = await userRepository.create({
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedpassword',
      role: UserRole.USER,
      isActive: true,
    })
    testUserId = user.id

    // Generate valid access token
    validAccessToken = tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    })
  })

  afterEach(async () => {
    await prismaService.cleanDatabase()
  })

  afterAll(async () => {
    await prismaService.onModuleDestroy()
    container.clearInstances()
  })

  describe('canActivate', () => {
    it('should allow access with valid token', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(`Bearer ${validAccessToken}`),
        },
      }

      const context = { request: mockRequest }
      const result = await authGuard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should add user to request context', async () => {
      const mockRequest: any = {
        headers: {
          get: jest.fn().mockReturnValue(`Bearer ${validAccessToken}`),
        },
      }

      const context = { request: mockRequest }
      await authGuard.canActivate(context)

      expect(mockRequest.user).toBeDefined()
      expect(mockRequest.user.id).toBe(testUserId)
      expect(mockRequest.user.email).toBe('test@example.com')
    })

    it('should throw UnauthorizedException when no Authorization header', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      }

      const context = { request: mockRequest }

      await expect(authGuard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      )
      await expect(authGuard.canActivate(context)).rejects.toThrow(
        'Authentication required'
      )
    })

    it('should throw UnauthorizedException for invalid token format', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Invalid token format'),
        },
      }

      const context = { request: mockRequest }

      await expect(authGuard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      )
    })

    it('should throw UnauthorizedException for inactive user', async () => {
      // Make user inactive
      await userRepository.update(testUserId, { isActive: false })

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(`Bearer ${validAccessToken}`),
        },
      }

      const context = { request: mockRequest }

      await expect(authGuard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      )
      await expect(authGuard.canActivate(context)).rejects.toThrow(
        'Account is inactive'
      )
    })
  })

  describe('static getUserFromRequest', () => {
    it('should extract user from request', () => {
      const mockRequest: any = {
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      const user = AuthGuard.getUserFromRequest(mockRequest)

      expect(user).toBeDefined()
      expect(user.id).toBe(1)
      expect(user.email).toBe('test@example.com')
    })

    it('should return null when no user in request', () => {
      const mockRequest: any = {}

      const user = AuthGuard.getUserFromRequest(mockRequest)

      expect(user).toBeNull()
    })
  })
})
