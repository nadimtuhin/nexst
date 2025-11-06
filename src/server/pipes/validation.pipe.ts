import { validate, ValidationError } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { BadRequestException } from '../filters/http-exception'

/**
 * Validation pipe that validates DTOs using class-validator
 */
export class ValidationPipe {
  /**
   * Transform and validate plain object against a DTO class
   * @param dto - The DTO class constructor
   * @param value - The plain object to validate
   * @returns The transformed and validated instance
   * @throws BadRequestException if validation fails
   */
  static async transform<T extends object>(
    dto: new () => T,
    value: any
  ): Promise<T> {
    // If no DTO class provided, return value as-is
    if (!dto) {
      return value
    }

    // Transform plain object to class instance
    const instance = plainToInstance(dto, value)

    // Validate the instance
    const errors: ValidationError[] = await validate(instance, {
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if extra properties exist
      validationError: { target: false }, // Don't include target in error
    })

    // If validation errors exist, throw BadRequestException
    if (errors.length > 0) {
      throw new BadRequestException('Validation failed', this.formatErrors(errors))
    }

    return instance
  }

  /**
   * Format validation errors into a readable structure
   */
  private static formatErrors(errors: ValidationError[]): Record<string, string[]> {
    const formatted: Record<string, string[]> = {}

    errors.forEach((error) => {
      if (error.constraints) {
        formatted[error.property] = Object.values(error.constraints)
      }

      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        const nested = this.formatErrors(error.children)
        Object.keys(nested).forEach((key) => {
          formatted[`${error.property}.${key}`] = nested[key]
        })
      }
    })

    return formatted
  }
}
