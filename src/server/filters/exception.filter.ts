import { NextResponse } from 'next/server'
import { HttpException } from './http-exception'
import { ValidationError } from 'class-validator'

/**
 * Global exception filter that catches all exceptions and returns appropriate responses
 */
export class ExceptionFilter {
  static catch(error: unknown): NextResponse {
    console.error('Exception caught:', error)

    // Handle HttpException
    if (error instanceof HttpException) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }

    // Handle validation errors from class-validator
    if (Array.isArray(error) && error[0] instanceof ValidationError) {
      return NextResponse.json(
        {
          statusCode: 400,
          message: 'Validation failed',
          errors: this.formatValidationErrors(error),
        },
        { status: 400 }
      )
    }

    // Any other error is unexpected. Its message can contain internals
    // (database errors, file paths, secrets), so it is logged above and a
    // generic message is returned to the client.
    return NextResponse.json(
      {
        statusCode: 500,
        message: 'Internal Server Error',
      },
      { status: 500 }
    )
  }

  /**
   * Format validation errors into a readable structure
   */
  private static formatValidationErrors(errors: ValidationError[]): any {
    const formatted: Record<string, string[]> = {}

    errors.forEach((error) => {
      if (error.constraints) {
        formatted[error.property] = Object.values(error.constraints)
      }

      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        const nested = this.formatValidationErrors(error.children)
        Object.keys(nested).forEach((key) => {
          formatted[`${error.property}.${key}`] = nested[key]
        })
      }
    })

    return formatted
  }
}
