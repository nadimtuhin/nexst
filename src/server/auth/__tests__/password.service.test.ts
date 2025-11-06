import 'reflect-metadata'
import { container } from 'tsyringe'
import { PasswordService } from '../password.service'
import { LoggerService } from '../../logger/logger.service'

describe('PasswordService', () => {
  let passwordService: PasswordService

  beforeAll(() => {
    // Register LoggerService if not already registered
    if (!container.isRegistered(LoggerService)) {
      container.registerSingleton(LoggerService)
    }
    if (!container.isRegistered(PasswordService)) {
      container.registerSingleton(PasswordService)
    }
  })

  beforeEach(() => {
    passwordService = container.resolve(PasswordService)
  })

  afterAll(() => {
    container.clearInstances()
  })

  describe('hash', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!'
      const hash = await passwordService.hash(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50) // bcrypt hashes are long
    })

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!'
      const hash1 = await passwordService.hash(password)
      const hash2 = await passwordService.hash(password)

      expect(hash1).not.toBe(hash2) // Different salts
    })

    it('should hash empty string', async () => {
      const hash = await passwordService.hash('')
      expect(hash).toBeDefined()
      expect(hash.length).toBeGreaterThan(0)
    })
  })

  describe('compare', () => {
    it('should return true for correct password', async () => {
      const password = 'TestPassword123!'
      const hash = await passwordService.hash(password)

      const isMatch = await passwordService.compare(password, hash)
      expect(isMatch).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const password = 'TestPassword123!'
      const wrongPassword = 'WrongPassword123!'
      const hash = await passwordService.hash(password)

      const isMatch = await passwordService.compare(wrongPassword, hash)
      expect(isMatch).toBe(false)
    })

    it('should return false for empty password against hash', async () => {
      const password = 'TestPassword123!'
      const hash = await passwordService.hash(password)

      const isMatch = await passwordService.compare('', hash)
      expect(isMatch).toBe(false)
    })

    it('should handle case-sensitive comparison', async () => {
      const password = 'TestPassword123!'
      const hash = await passwordService.hash(password)

      const isMatch = await passwordService.compare('testpassword123!', hash)
      expect(isMatch).toBe(false)
    })
  })

  describe('validatePasswordStrength', () => {
    it('should validate a strong password', () => {
      const result = passwordService.validatePasswordStrength('StrongPass123!')

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should reject password shorter than 8 characters', () => {
      const result = passwordService.validatePasswordStrength('Short1!')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Password must be at least 8 characters long'
      )
    })

    it('should reject password without uppercase letter', () => {
      const result = passwordService.validatePasswordStrength('lowercase123!')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      )
    })

    it('should reject password without lowercase letter', () => {
      const result = passwordService.validatePasswordStrength('UPPERCASE123!')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one lowercase letter'
      )
    })

    it('should reject password without number', () => {
      const result = passwordService.validatePasswordStrength('NoNumbers!')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one number'
      )
    })

    it('should reject password without special character', () => {
      const result = passwordService.validatePasswordStrength('NoSpecial123')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one special character'
      )
    })

    it('should return all validation errors for weak password', () => {
      const result = passwordService.validatePasswordStrength('weak')

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
      expect(result.errors).toContain(
        'Password must be at least 8 characters long'
      )
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      )
      expect(result.errors).toContain(
        'Password must contain at least one number'
      )
      expect(result.errors).toContain(
        'Password must contain at least one special character'
      )
    })

    it('should accept password with minimum requirements', () => {
      const result = passwordService.validatePasswordStrength('Abcd123!')

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should accept password with various special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')']

      specialChars.forEach((char) => {
        const result = passwordService.validatePasswordStrength(
          `Password1${char}`
        )
        expect(result.valid).toBe(true)
      })
    })
  })

  describe('generateRandomPassword', () => {
    it('should generate password with default length', () => {
      const password = passwordService.generateRandomPassword()

      expect(password).toBeDefined()
      expect(password.length).toBe(16)
    })

    it('should generate password with custom length', () => {
      const password = passwordService.generateRandomPassword(20)

      expect(password.length).toBe(20)
    })

    it('should generate password with minimum length', () => {
      const password = passwordService.generateRandomPassword(8)

      expect(password.length).toBe(8)
    })

    it('should generate strong password that passes validation', () => {
      const password = passwordService.generateRandomPassword()
      const result = passwordService.validatePasswordStrength(password)

      expect(result.valid).toBe(true)
    })

    it('should generate different passwords each time', () => {
      const password1 = passwordService.generateRandomPassword()
      const password2 = passwordService.generateRandomPassword()

      expect(password1).not.toBe(password2)
    })

    it('should generate password containing all character types', () => {
      const password = passwordService.generateRandomPassword()

      expect(/[A-Z]/.test(password)).toBe(true) // Uppercase
      expect(/[a-z]/.test(password)).toBe(true) // Lowercase
      expect(/[0-9]/.test(password)).toBe(true) // Number
      expect(/[!@#$%^&*(),.?":{}|<>]/.test(password)).toBe(true) // Special
    })

    it('should generate long passwords correctly', () => {
      const password = passwordService.generateRandomPassword(50)

      expect(password.length).toBe(50)
      expect(passwordService.validatePasswordStrength(password).valid).toBe(
        true
      )
    })
  })

  describe('Integration Tests', () => {
    it('should hash and verify password workflow', async () => {
      const originalPassword = 'MySecurePass123!'

      // Hash the password
      const hash = await passwordService.hash(originalPassword)

      // Verify correct password
      const isCorrect = await passwordService.compare(originalPassword, hash)
      expect(isCorrect).toBe(true)

      // Verify wrong password
      const isWrong = await passwordService.compare('WrongPass123!', hash)
      expect(isWrong).toBe(false)
    })

    it('should generate and validate random password', () => {
      // Generate random password
      const password = passwordService.generateRandomPassword()

      // Validate it
      const validation = passwordService.validatePasswordStrength(password)
      expect(validation.valid).toBe(true)
    })

    it('should handle multiple hash operations', async () => {
      const passwords = [
        'Password1!',
        'AnotherPass2@',
        'ThirdOne3#',
        'FourthPass4$',
      ]

      for (const password of passwords) {
        const hash = await passwordService.hash(password)
        const isMatch = await passwordService.compare(password, hash)
        expect(isMatch).toBe(true)
      }
    })
  })
})
