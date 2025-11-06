import 'reflect-metadata'
import { container } from 'tsyringe'
import { AuthService } from '../auth.service'
import { PasswordService } from '../password.service'
import { TokenService } from '../token.service'
import { UserRepository } from '../../database/repositories/user.repository'
import { RefreshTokenRepository } from '../../database/repositories/refresh-token.repository'
import { PrismaService } from '../../database/prisma.service'
import { ConfigService } from '../../../config/config.service'
import { LoggerService } from '../../logger/logger.service'
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '../../filters'
import { UserRole } from '@prisma/client'

describe('AuthService', () => {
  let authService: AuthService
  let passwordService: PasswordService
  let tokenService: TokenService
  let userRepository: UserRepository
  let refreshTokenRepository: RefreshTokenRepository
  let prismaService: PrismaService

  beforeAll(() => {
    // Register all services
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
    if (!container.isRegistered(RefreshTokenRepository)) {
      container.registerSingleton(RefreshTokenRepository)
    }
    if (!container.isRegistered(PasswordService)) {
      container.registerSingleton(PasswordService)
    }
    if (!container.isRegistered(TokenService)) {
      container.registerSingleton(TokenService)
    }
    if (!container.isRegistered(AuthService)) {
      container.registerSingleton(AuthService)
    }
  })

  beforeEach(async () => {
    authService = container.resolve(AuthService)
    passwordService = container.resolve(PasswordService)
    tokenService = container.resolve(TokenService)
    userRepository = container.resolve(UserRepository)
    refreshTokenRepository = container.resolve(RefreshTokenRepository)
    prismaService = container.resolve(PrismaService)

    await prismaService.onModuleInit()
    await prismaService.cleanDatabase()
  })

  afterEach(async () => {
    await prismaService.cleanDatabase()
  })

  afterAll(async () => {
    await prismaService.onModuleDestroy()
    container.clearInstances()
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!',
        age: 25,
      }

      const result = await authService.register(registerDto)

      expect(result).toBeDefined()
      expect(result.user).toBeDefined()
      expect(result.user.email).toBe(registerDto.email)
      expect(result.user.name).toBe(registerDto.name)
      expect(result.user.role).toBe(UserRole.USER)
      expect(result.tokens).toBeDefined()
      expect(result.tokens.accessToken).toBeDefined()
      expect(result.tokens.refreshToken).toBeDefined()
    })

    it('should hash password before storing', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!',
      }

      await authService.register(registerDto)

      const user = await userRepository.findByEmail(registerDto.email)
      expect(user).toBeDefined()
      expect(user!.password).not.toBe(registerDto.password)
      expect(user!.password.length).toBeGreaterThan(50) // Bcrypt hash
    })

    it('should store refresh token in database', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!',
      }

      const result = await authService.register(registerDto)
      const user = await userRepository.findByEmail(registerDto.email)

      const tokens = await refreshTokenRepository.findByUserId(user!.id)
      expect(tokens).toHaveLength(1)
      expect(tokens[0].token).toBe(result.tokens.refreshToken)
    })

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!',
      }

      await authService.register(registerDto)

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException
      )
      await expect(authService.register(registerDto)).rejects.toThrow(
        'Email already in use'
      )
    })

    it('should throw BadRequestException for weak password', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak',
      }

      await expect(authService.register(registerDto)).rejects.toThrow(
        BadRequestException
      )
    })

    it('should register user without age', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!',
      }

      const result = await authService.register(registerDto)
      expect(result.user).toBeDefined()
    })
  })

  describe('login', () => {
    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await passwordService.hash('SecurePass123!')
      await userRepository.create({
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: UserRole.USER,
        isActive: true,
      })
    })

    it('should login successfully with correct credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      }

      const result = await authService.login(loginDto)

      expect(result).toBeDefined()
      expect(result.user.email).toBe(loginDto.email)
      expect(result.tokens).toBeDefined()
      expect(result.tokens.accessToken).toBeDefined()
      expect(result.tokens.refreshToken).toBeDefined()
    })

    it('should update lastLoginAt on successful login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      }

      const before = await userRepository.findByEmail(loginDto.email)
      expect(before!.lastLoginAt).toBeNull()

      await authService.login(loginDto)

      const after = await userRepository.findByEmail(loginDto.email)
      expect(after!.lastLoginAt).toBeDefined()
      expect(after!.lastLoginAt).toBeInstanceOf(Date)
    })

    it('should throw UnauthorizedException for non-existent email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'SecurePass123!',
      }

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      )
      await expect(authService.login(loginDto)).rejects.toThrow(
        'Invalid credentials'
      )
    })

    it('should throw UnauthorizedException for incorrect password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      }

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      )
      await expect(authService.login(loginDto)).rejects.toThrow(
        'Invalid credentials'
      )
    })

    it('should throw UnauthorizedException for inactive account', async () => {
      // Create inactive user
      const hashedPassword = await passwordService.hash('SecurePass123!')
      await userRepository.create({
        email: 'inactive@example.com',
        name: 'Inactive User',
        password: hashedPassword,
        role: UserRole.USER,
        isActive: false,
      })

      const loginDto = {
        email: 'inactive@example.com',
        password: 'SecurePass123!',
      }

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      )
      await expect(authService.login(loginDto)).rejects.toThrow(
        'Account is inactive'
      )
    })

    it('should store refresh token in database', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      }

      const result = await authService.login(loginDto)
      const user = await userRepository.findByEmail(loginDto.email)

      const tokens = await refreshTokenRepository.findByUserId(user!.id)
      expect(tokens).toHaveLength(1)
      expect(tokens[0].token).toBe(result.tokens.refreshToken)
    })
  })

  describe('refreshToken', () => {
    let validRefreshToken: string
    let userId: number

    beforeEach(async () => {
      // Create user and login to get refresh token
      const hashedPassword = await passwordService.hash('SecurePass123!')
      const user = await userRepository.create({
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: UserRole.USER,
        isActive: true,
      })
      userId = user.id

      const tokens = tokenService.generateTokenPair({
        sub: user.id,
        email: user.email,
        role: user.role,
      })
      validRefreshToken = tokens.refreshToken

      // Store in database
      await refreshTokenRepository.createToken({
        token: validRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
    })

    it('should refresh tokens successfully', async () => {
      const result = await authService.refreshToken(validRefreshToken)

      expect(result).toBeDefined()
      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(result.refreshToken).not.toBe(validRefreshToken) // New token
    })

    it('should revoke old refresh token', async () => {
      await authService.refreshToken(validRefreshToken)

      const oldToken =
        await refreshTokenRepository.findByToken(validRefreshToken)
      expect(oldToken).toBeNull()
    })

    it('should store new refresh token', async () => {
      const result = await authService.refreshToken(validRefreshToken)

      const newToken = await refreshTokenRepository.findByToken(
        result.refreshToken
      )
      expect(newToken).toBeDefined()
    })

    it('should throw UnauthorizedException for invalid token', async () => {
      await expect(
        authService.refreshToken('invalid-token')
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException for token not in database', async () => {
      // Valid JWT but not in database
      const notStoredToken = tokenService.generateRefreshToken(userId)

      await expect(authService.refreshToken(notStoredToken)).rejects.toThrow(
        UnauthorizedException
      )
      await expect(authService.refreshToken(notStoredToken)).rejects.toThrow(
        'Invalid refresh token'
      )
    })

    it('should throw UnauthorizedException for inactive user', async () => {
      // Make user inactive
      await userRepository.update(userId, { isActive: false })

      await expect(authService.refreshToken(validRefreshToken)).rejects.toThrow(
        UnauthorizedException
      )
      await expect(authService.refreshToken(validRefreshToken)).rejects.toThrow(
        'User not found or inactive'
      )
    })
  })

  describe('logout', () => {
    let refreshToken: string

    beforeEach(async () => {
      const hashedPassword = await passwordService.hash('SecurePass123!')
      const user = await userRepository.create({
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: UserRole.USER,
        isActive: true,
      })

      refreshToken = tokenService.generateRefreshToken(user.id)
      await refreshTokenRepository.createToken({
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
    })

    it('should logout successfully', async () => {
      await authService.logout(refreshToken)

      const token = await refreshTokenRepository.findByToken(refreshToken)
      expect(token).toBeNull()
    })

    it('should be idempotent (not throw on non-existent token)', async () => {
      await authService.logout('non-existent-token')
      // Should not throw
    })

    it('should handle multiple logouts gracefully', async () => {
      await authService.logout(refreshToken)
      await authService.logout(refreshToken)
      // Should not throw
    })
  })

  describe('logoutAll', () => {
    let userId: number

    beforeEach(async () => {
      const hashedPassword = await passwordService.hash('SecurePass123!')
      const user = await userRepository.create({
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: UserRole.USER,
        isActive: true,
      })
      userId = user.id

      // Create multiple tokens
      for (let i = 0; i < 3; i++) {
        const token = tokenService.generateRefreshToken(user.id)
        await refreshTokenRepository.createToken({
          token: `token-${i}-${token}`,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })
      }
    })

    it('should revoke all user tokens', async () => {
      const before = await refreshTokenRepository.findByUserId(userId)
      expect(before).toHaveLength(3)

      await authService.logoutAll(userId)

      const after = await refreshTokenRepository.findByUserId(userId)
      expect(after).toHaveLength(0)
    })

    it('should not affect other users tokens', async () => {
      // Create another user with tokens
      const hashedPassword = await passwordService.hash('SecurePass123!')
      const user2 = await userRepository.create({
        email: 'user2@example.com',
        name: 'User 2',
        password: hashedPassword,
        role: UserRole.USER,
        isActive: true,
      })

      const token = tokenService.generateRefreshToken(user2.id)
      await refreshTokenRepository.createToken({
        token,
        userId: user2.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      // Logout user 1
      await authService.logoutAll(userId)

      // User 2 tokens should remain
      const user2Tokens = await refreshTokenRepository.findByUserId(user2.id)
      expect(user2Tokens).toHaveLength(1)
    })
  })

  describe('changePassword', () => {
    let userId: number

    beforeEach(async () => {
      const hashedPassword = await passwordService.hash('OldPassword123!')
      const user = await userRepository.create({
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: UserRole.USER,
        isActive: true,
      })
      userId = user.id
    })

    it('should change password successfully', async () => {
      const changePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      }

      await authService.changePassword(userId, changePasswordDto)

      const user = await userRepository.findById(userId)
      const isNewPasswordValid = await passwordService.compare(
        'NewPassword123!',
        user!.password
      )
      expect(isNewPasswordValid).toBe(true)
    })

    it('should revoke all tokens after password change', async () => {
      // Create some tokens
      const token = tokenService.generateRefreshToken(userId)
      await refreshTokenRepository.createToken({
        token,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      const changePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      }

      await authService.changePassword(userId, changePasswordDto)

      const tokens = await refreshTokenRepository.findByUserId(userId)
      expect(tokens).toHaveLength(0)
    })

    it('should throw UnauthorizedException for incorrect current password', async () => {
      const changePasswordDto = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword123!',
      }

      await expect(
        authService.changePassword(userId, changePasswordDto)
      ).rejects.toThrow(UnauthorizedException)
      await expect(
        authService.changePassword(userId, changePasswordDto)
      ).rejects.toThrow('Current password is incorrect')
    })

    it('should throw BadRequestException for weak new password', async () => {
      const changePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'weak',
      }

      await expect(
        authService.changePassword(userId, changePasswordDto)
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException for non-existent user', async () => {
      const changePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      }

      await expect(
        authService.changePassword(999999, changePasswordDto)
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('validateToken', () => {
    let validAccessToken: string
    let userId: number

    beforeEach(async () => {
      const hashedPassword = await passwordService.hash('SecurePass123!')
      const user = await userRepository.create({
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: UserRole.USER,
        isActive: true,
      })
      userId = user.id

      validAccessToken = tokenService.generateAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role,
      })
    })

    it('should validate token and return user', async () => {
      const user = await authService.validateToken(validAccessToken)

      expect(user).toBeDefined()
      expect(user.id).toBe(userId)
      expect(user.email).toBe('test@example.com')
    })

    it('should throw UnauthorizedException for invalid token', async () => {
      await expect(authService.validateToken('invalid-token')).rejects.toThrow(
        UnauthorizedException
      )
    })

    it('should throw UnauthorizedException for inactive user', async () => {
      await userRepository.update(userId, { isActive: false })

      await expect(
        authService.validateToken(validAccessToken)
      ).rejects.toThrow(UnauthorizedException)
      await expect(
        authService.validateToken(validAccessToken)
      ).rejects.toThrow('User not found or inactive')
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete auth workflow', async () => {
      // Register
      const registerDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!',
      }
      const registered = await authService.register(registerDto)
      expect(registered.user).toBeDefined()
      expect(registered.tokens).toBeDefined()

      // Logout
      await authService.logout(registered.tokens.refreshToken)

      // Login
      const loginDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      }
      const loggedIn = await authService.login(loginDto)
      expect(loggedIn.tokens).toBeDefined()

      // Refresh
      const refreshed = await authService.refreshToken(
        loggedIn.tokens.refreshToken
      )
      expect(refreshed.accessToken).toBeDefined()

      // Validate
      const user = await authService.validateToken(refreshed.accessToken)
      expect(user.email).toBe('test@example.com')

      // Change password
      await authService.changePassword(user.id, {
        currentPassword: 'SecurePass123!',
        newPassword: 'NewSecurePass123!',
      })

      // Verify old password doesn't work
      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      )

      // Login with new password
      const newLogin = await authService.login({
        email: 'test@example.com',
        password: 'NewSecurePass123!',
      })
      expect(newLogin.tokens).toBeDefined()
    })
  })
})
