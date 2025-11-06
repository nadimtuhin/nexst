import { IsEmail, IsString, MinLength, IsOptional, IsInt, Min } from 'class-validator'

/**
 * DTO for user registration
 */
export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name!: string

  @IsEmail({}, { message: 'Invalid email address' })
  email!: string

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Age must be a positive number' })
  age?: number
}

/**
 * DTO for user login
 */
export class LoginDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string

  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password!: string
}

/**
 * DTO for refreshing access token
 */
export class RefreshTokenDto {
  @IsString()
  @MinLength(1, { message: 'Refresh token is required' })
  refreshToken!: string
}

/**
 * DTO for changing password
 */
export class ChangePasswordDto {
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  currentPassword!: string

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword!: string
}

/**
 * Auth response interface
 */
export interface AuthResponse {
  user: {
    id: number
    email: string
    name: string
    role: string
  }
  tokens: {
    accessToken: string
    refreshToken: string
  }
}

/**
 * Token response interface
 */
export interface TokenResponse {
  accessToken: string
  refreshToken: string
}
