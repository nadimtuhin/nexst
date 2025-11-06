import { NextRequest, NextResponse } from 'next/server'
import { Controller, Post, Body, Get, HttpCode } from '../decorators'
import { AuthService } from '../auth/auth.service'
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
} from '../dto/auth.dto'

/**
 * Auth Controller
 * Handles authentication-related HTTP requests
 */
@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   * POST /api/auth/register
   */
  @Post('/register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto)
    return {
      message: 'User registered successfully',
      data: result,
    }
  }

  /**
   * Login a user
   * POST /api/auth/login
   */
  @Post('/login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto)
    return {
      message: 'Login successful',
      data: result,
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  @Post('/refresh')
  @HttpCode(200)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(
      refreshTokenDto.refreshToken
    )
    return {
      message: 'Token refreshed successfully',
      data: result,
    }
  }

  /**
   * Logout (revoke refresh token)
   * POST /api/auth/logout
   */
  @Post('/logout')
  @HttpCode(200)
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    await this.authService.logout(refreshTokenDto.refreshToken)
    return {
      message: 'Logout successful',
    }
  }

  /**
   * Change password
   * POST /api/auth/change-password
   * Requires authentication
   */
  @Post('/change-password')
  @HttpCode(200)
  async changePassword(
    request: NextRequest,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    // Extract user from request (set by AuthGuard)
    const user = (request as any).user
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await this.authService.changePassword(user.id, changePasswordDto)
    return {
      message: 'Password changed successfully',
    }
  }

  /**
   * Get current authenticated user
   * GET /api/auth/me
   * Requires authentication
   */
  @Get('/me')
  async me(request: NextRequest) {
    // Extract user from request (set by AuthGuard)
    const user = (request as any).user
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    return {
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    }
  }
}
