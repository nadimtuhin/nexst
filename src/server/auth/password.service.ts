import * as bcrypt from 'bcrypt'
import { Injectable } from '../decorators'
import { LoggerService } from '../logger/logger.service'

/**
 * Password Service
 * Handles password hashing and verification using bcrypt
 */
@Injectable()
export class PasswordService {
  private readonly logger: LoggerService
  private readonly saltRounds = 10

  constructor(logger: LoggerService) {
    this.logger = logger.setContext('PasswordService')
  }

  /**
   * Hash a password using bcrypt
   * @param password - Plain text password
   * @returns Hashed password
   */
  async hash(password: string): Promise<string> {
    try {
      const hash = await bcrypt.hash(password, this.saltRounds)
      this.logger.debug('Password hashed successfully')
      return hash
    } catch (error) {
      this.logger.error('Failed to hash password', (error as Error).stack)
      throw new Error('Password hashing failed')
    }
  }

  /**
   * Compare a plain text password with a hashed password
   * @param password - Plain text password
   * @param hashedPassword - Hashed password to compare against
   * @returns True if passwords match, false otherwise
   */
  async compare(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const isMatch = await bcrypt.compare(password, hashedPassword)
      this.logger.debug(`Password comparison result: ${isMatch}`)
      return isMatch
    } catch (error) {
      this.logger.error('Failed to compare passwords', (error as Error).stack)
      throw new Error('Password comparison failed')
    }
  }

  /**
   * Validate password strength
   * @param password - Password to validate
   * @returns Object with validation result and error message
   */
  validatePasswordStrength(password: string): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Generate a random password
   * @param length - Length of password (default: 16)
   * @returns Random password
   */
  generateRandomPassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const special = '!@#$%^&*(),.?":{}|<>'
    const all = uppercase + lowercase + numbers + special

    let password = ''
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += special[Math.floor(Math.random() * special.length)]

    for (let i = password.length; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)]
    }

    // Shuffle password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('')
  }
}
