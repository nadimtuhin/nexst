import 'reflect-metadata'
import { ValidationPipe } from '../validation.pipe'
import { CreateUserDto } from '../../dto/user.dto'
import { BadRequestException } from '../../filters'

describe('ValidationPipe', () => {
  describe('transform', () => {
    it('should validate and transform valid data', async () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      }

      const result = await ValidationPipe.transform(CreateUserDto, validData)

      expect(result).toBeInstanceOf(CreateUserDto)
      expect(result.name).toBe('John Doe')
      expect(result.email).toBe('john@example.com')
      expect(result.age).toBe(30)
    })

    it('should throw BadRequestException for invalid email', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 30,
      }

      await expect(
        ValidationPipe.transform(CreateUserDto, invalidData)
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for short name', async () => {
      const invalidData = {
        name: 'J',
        email: 'john@example.com',
        age: 30,
      }

      await expect(
        ValidationPipe.transform(CreateUserDto, invalidData)
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for age under 18', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 17,
      }

      await expect(
        ValidationPipe.transform(CreateUserDto, invalidData)
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for missing required fields', async () => {
      const invalidData = {
        name: 'John Doe',
        // Missing email
      }

      await expect(
        ValidationPipe.transform(CreateUserDto, invalidData)
      ).rejects.toThrow(BadRequestException)
    })

    it('should include detailed error messages', async () => {
      const invalidData = {
        name: 'J',
        email: 'invalid',
        age: 10,
      }

      try {
        await ValidationPipe.transform(CreateUserDto, invalidData)
      } catch (error) {
        if (error instanceof BadRequestException) {
          expect(error.errors).toBeDefined()
          expect(error.errors.name).toBeDefined()
          expect(error.errors.email).toBeDefined()
          expect(error.errors.age).toBeDefined()
        }
      }
    })
  })
})
