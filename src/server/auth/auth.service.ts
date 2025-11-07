import { Injectable } from '../decorators'
import { UserRepository } from '../database/repositories/user.repository'
import { RefreshTokenRepository } from '../database/repositories/refresh-token.repository'
import { PasswordService } from './password.service'
import { TokenService } from './token.service'
import { LoggerService } from '../logger/logger.service'
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '../filters'
import {
  RegisterDto,
  LoginDto,
  AuthResponse,
  TokenResponse,
  ChangePasswordDto,
} from '../dto/auth.dto'
import { User, UserRole } from '@prisma/client'

/**
 * Auth Service
 * Handles user authentication, registration, and token management
 */
@Injectable()
export class AuthService {
  private readonly logger: LoggerService

  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    logger: LoggerService
  ) {
    this.logger = logger.setContext('AuthService')
  }

  /**
   * Register a new user
   * @param registerDto - Registration data
   * @returns Auth response with user and tokens
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    this.logger.info(`Registration attempt for email: ${registerDto.email}`)

    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(
      registerDto.email
    )
    if (existingUser) {
      this.logger.warn(`Registration failed: Email already exists`)
      throw new ConflictException('Email already in use')
    }

    // Validate password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(
      registerDto.password
    )
    if (!passwordValidation.valid) {
      throw new BadRequestException(
        `Weak password: ${passwordValidation.errors.join(', ')}`
      )
    }

    // Hash password
    const hashedPassword = await this.passwordService.hash(
      registerDto.password
    )

    // Create user
    const user = await this.userRepository.create({
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      age: registerDto.age,
      role: UserRole.USER,
      isActive: true,
    })

    this.logger.info(`User registered successfully: ${user.id}`)

    // Generate tokens
    const tokens = await this.generateTokensForUser(user)

    return this.formatAuthResponse(user, tokens)
  }

  /**
   * Login a user
   * @param loginDto - Login credentials
   * @returns Auth response with user and tokens
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    this.logger.info(`Login attempt for email: ${loginDto.email}`)

    // Find user by email
    const user = await this.userRepository.findByEmail(loginDto.email)
    if (!user) {
      this.logger.warn(`Login failed: User not found`)
      throw new UnauthorizedException('Invalid credentials')
    }

    // Check if user is active
    if (!user.isActive) {
      this.logger.warn(`Login failed: User account is inactive`)
      throw new UnauthorizedException('Account is inactive')
    }

    // Verify password
    const isPasswordValid = await this.passwordService.compare(
      loginDto.password,
      user.password
    )
    if (!isPasswordValid) {
      this.logger.warn(`Login failed: Invalid password`)
      throw new UnauthorizedException('Invalid credentials')
    }

    // Update last login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    })

    this.logger.info(`User logged in successfully: ${user.id}`)

    // Generate tokens
    const tokens = await this.generateTokensForUser(user)

    return this.formatAuthResponse(user, tokens)
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken - Refresh token string
   * @returns New token pair
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    this.logger.debug('Token refresh attempt')

    // Verify refresh token
    const payload = this.tokenService.verifyRefreshToken(refreshToken)

    // Check if refresh token exists in database
    const storedToken =
      await this.refreshTokenRepository.findValidToken(refreshToken)
    if (!storedToken) {
      this.logger.warn('Refresh token not found or expired in database')
      throw new UnauthorizedException('Invalid refresh token')
    }

    // Get user
    const user = await this.userRepository.findById(payload.sub)
    if (!user || !user.isActive) {
      this.logger.warn('User not found or inactive')
      throw new UnauthorizedException('User not found or inactive')
    }

    // Revoke old refresh token
    await this.refreshTokenRepository.revokeToken(refreshToken)

    // Generate new tokens
    const tokens = await this.generateTokensForUser(user)

    this.logger.info(`Tokens refreshed successfully for user: ${user.id}`)

    return tokens
  }

  /**
   * Logout a user (revoke refresh token)
   * @param refreshToken - Refresh token to revoke
   */
  async logout(refreshToken: string): Promise<void> {
    this.logger.debug('Logout attempt')

    try {
      await this.refreshTokenRepository.revokeToken(refreshToken)
      this.logger.info('User logged out successfully')
    } catch (error) {
      this.logger.warn('Logout failed: Token not found')
      // Don't throw error, logout should be idempotent
    }
  }

  /**
   * Logout from all devices (revoke all refresh tokens)
   * @param userId - User ID
   */
  async logoutAll(userId: number): Promise<void> {
    this.logger.info(`Logout all devices for user: ${userId}`)

    const count = await this.refreshTokenRepository.revokeAllUserTokens(userId)

    this.logger.info(`Revoked ${count} refresh tokens for user: ${userId}`)
  }

  /**
   * Change user password
   * @param userId - User ID
   * @param changePasswordDto - Password change data
   */
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto
  ): Promise<void> {
    this.logger.info(`Password change attempt for user: ${userId}`)

    // Get user
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    // Verify current password
    const isCurrentPasswordValid = await this.passwordService.compare(
      changePasswordDto.currentPassword,
      user.password
    )
    if (!isCurrentPasswordValid) {
      this.logger.warn('Password change failed: Invalid current password')
      throw new UnauthorizedException('Current password is incorrect')
    }

    // Validate new password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(
      changePasswordDto.newPassword
    )
    if (!passwordValidation.valid) {
      throw new BadRequestException(
        `Weak password: ${passwordValidation.errors.join(', ')}`
      )
    }

    // Hash new password
    const hashedPassword = await this.passwordService.hash(
      changePasswordDto.newPassword
    )

    // Update password
    await this.userRepository.update(userId, {
      password: hashedPassword,
    })

    // Revoke all refresh tokens to force re-login
    await this.logoutAll(userId)

    this.logger.info(`Password changed successfully for user: ${userId}`)
  }

  /**
   * Validate access token and return user
   * @param token - Access token
   * @returns User object
   */
  async validateToken(token: string): Promise<User> {
    const payload = this.tokenService.verifyAccessToken(token)

    const user = await this.userRepository.findById(payload.sub)
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive')
    }

    return user
  }

  /**
   * Generate tokens for a user and store refresh token
   * @param user - User object
   * @returns Token pair
   */
  private async generateTokensForUser(user: User): Promise<TokenResponse> {
    // Generate token pair with optional tenant context
    const tokens = this.tokenService.generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId ?? undefined,
    })

    // Calculate refresh token expiration
    const expiresAt = new Date()
    const expiresInMs = this.parseExpirationTime(
      this.tokenService['config'].security.jwtRefreshExpiresIn
    )
    expiresAt.setTime(expiresAt.getTime() + expiresInMs)

    // Store refresh token in database with optional tenant context
    await this.refreshTokenRepository.createToken({
      token: tokens.refreshToken,
      userId: user.id,
      tenantId: user.tenantId ?? undefined,
      expiresAt,
    })

    return tokens
  }

  /**
   * Parse expiration time string (e.g., "7d", "1h") to milliseconds
   * @param expiresIn - Expiration time string
   * @returns Milliseconds
   */
  private parseExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([dhms])$/)
    if (!match) {
      throw new Error('Invalid expiration time format')
    }

    const value = parseInt(match[1], 10)
    const unit = match[2]

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60 * 1000
      case 'h':
        return value * 60 * 60 * 1000
      case 'm':
        return value * 60 * 1000
      case 's':
        return value * 1000
      default:
        throw new Error('Invalid time unit')
    }
  }

  /**
   * Format auth response
   * @param user - User object
   * @param tokens - Token pair
   * @returns Formatted auth response
   */
  private formatAuthResponse(
    user: User,
    tokens: TokenResponse
  ): AuthResponse {
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens,
    }
  }
}
