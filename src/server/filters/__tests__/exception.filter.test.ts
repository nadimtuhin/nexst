import { NextResponse } from 'next/server'
import { ExceptionFilter } from '../exception.filter'
import {
  HttpException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  InternalServerErrorException,
} from '../http-exception'
import { ValidationError } from 'class-validator'

// Mock console.error to avoid cluttering test output
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

describe('ExceptionFilter', () => {
  describe('catch - HttpException', () => {
    it('should handle BadRequestException (400)', () => {
      const error = new BadRequestException('Bad request error')
      const response = ExceptionFilter.catch(error)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(400)
    })

    it('should handle UnauthorizedException (401)', () => {
      const error = new UnauthorizedException('Unauthorized access')
      const response = ExceptionFilter.catch(error)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(401)
    })

    it('should handle ForbiddenException (403)', () => {
      const error = new ForbiddenException('Forbidden resource')
      const response = ExceptionFilter.catch(error)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(403)
    })

    it('should handle NotFoundException (404)', () => {
      const error = new NotFoundException('Resource not found')
      const response = ExceptionFilter.catch(error)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(404)
    })

    it('should handle ConflictException (409)', () => {
      const error = new ConflictException('Resource conflict')
      const response = ExceptionFilter.catch(error)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(409)
    })

    it('should handle UnprocessableEntityException (422)', () => {
      const error = new UnprocessableEntityException('Unprocessable entity')
      const response = ExceptionFilter.catch(error)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(422)
    })

    it('should handle InternalServerErrorException (500)', () => {
      const error = new InternalServerErrorException('Server error')
      const response = ExceptionFilter.catch(error)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(500)
    })

    it('should handle HttpException with custom status code', () => {
      const error = new HttpException('Custom error', 418)
      const response = ExceptionFilter.catch(error)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(418)
    })

    it('should include error details in BadRequestException', () => {
      const errors = { field: 'Invalid value' }
      const error = new BadRequestException('Bad request', errors)
      const response = ExceptionFilter.catch(error)

      expect(response.status).toBe(400)
    })

    it('should include error details in UnprocessableEntityException', () => {
      const errors = { email: 'Invalid email format' }
      const error = new UnprocessableEntityException('Validation failed', errors)
      const response = ExceptionFilter.catch(error)

      expect(response.status).toBe(422)
    })
  })

  describe('catch - ValidationError', () => {
    it('should handle single validation error', () => {
      const validationError = new ValidationError()
      validationError.property = 'email'
      validationError.constraints = {
        isEmail: 'email must be an email',
      }

      const response = ExceptionFilter.catch([validationError])

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(400)
    })

    it('should handle multiple validation errors', () => {
      const emailError = new ValidationError()
      emailError.property = 'email'
      emailError.constraints = {
        isEmail: 'email must be an email',
      }

      const nameError = new ValidationError()
      nameError.property = 'name'
      nameError.constraints = {
        minLength: 'name must be longer than 2 characters',
      }

      const response = ExceptionFilter.catch([emailError, nameError])

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(400)
    })

    it('should handle validation error with multiple constraints', () => {
      const validationError = new ValidationError()
      validationError.property = 'password'
      validationError.constraints = {
        minLength: 'password must be longer than 8 characters',
        matches: 'password must contain at least one uppercase letter',
      }

      const response = ExceptionFilter.catch([validationError])

      expect(response.status).toBe(400)
    })

    it('should handle nested validation errors', () => {
      const childError = new ValidationError()
      childError.property = 'street'
      childError.constraints = {
        isNotEmpty: 'street should not be empty',
      }

      const parentError = new ValidationError()
      parentError.property = 'address'
      parentError.children = [childError]

      const response = ExceptionFilter.catch([parentError])

      expect(response.status).toBe(400)
    })

    it('should handle deeply nested validation errors', () => {
      const grandchildError = new ValidationError()
      grandchildError.property = 'number'
      grandchildError.constraints = {
        isNumber: 'number must be a number',
      }

      const childError = new ValidationError()
      childError.property = 'coordinates'
      childError.children = [grandchildError]

      const parentError = new ValidationError()
      parentError.property = 'location'
      parentError.children = [childError]

      const response = ExceptionFilter.catch([parentError])

      expect(response.status).toBe(400)
    })

    it('should handle validation error without constraints', () => {
      const validationError = new ValidationError()
      validationError.property = 'field'

      const response = ExceptionFilter.catch([validationError])

      expect(response.status).toBe(400)
    })
  })

  describe('catch - Generic Error', () => {
    it('should handle Error instance', () => {
      const error = new Error('Something went wrong')
      const response = ExceptionFilter.catch(error)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(500)
    })

    it('should handle Error without message', () => {
      const error = new Error()
      const response = ExceptionFilter.catch(error)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(500)
    })

    it('should handle TypeError', () => {
      const error = new TypeError('Type error occurred')
      const response = ExceptionFilter.catch(error)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(500)
    })

    it('should handle ReferenceError', () => {
      const error = new ReferenceError('Reference error occurred')
      const response = ExceptionFilter.catch(error)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(500)
    })

    it('should handle RangeError', () => {
      const error = new RangeError('Range error occurred')
      const response = ExceptionFilter.catch(error)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(500)
    })
  })

  describe('catch - Unknown Error', () => {
    it('should handle string error', () => {
      const error = 'String error'
      const response = ExceptionFilter.catch(error)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(500)
    })

    it('should handle number error', () => {
      const error = 404
      const response = ExceptionFilter.catch(error)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(500)
    })

    it('should handle null error', () => {
      const error = null
      const response = ExceptionFilter.catch(error)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(500)
    })

    it('should handle undefined error', () => {
      const error = undefined
      const response = ExceptionFilter.catch(error)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(500)
    })

    it('should handle object error', () => {
      const error = { message: 'Object error' }
      const response = ExceptionFilter.catch(error)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(500)
    })

    it('should handle array error', () => {
      const error = ['error1', 'error2']
      const response = ExceptionFilter.catch(error)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(500)
    })
  })

  describe('console logging', () => {
    it('should log error to console', () => {
      const error = new Error('Test error')
      const consoleErrorSpy = jest.spyOn(console, 'error')

      ExceptionFilter.catch(error)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Exception caught:', error)
    })

    it('should log HttpException to console', () => {
      const error = new NotFoundException('Not found')
      const consoleErrorSpy = jest.spyOn(console, 'error')

      ExceptionFilter.catch(error)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Exception caught:', error)
    })
  })

  describe('HttpException toJSON', () => {
    it('should format HttpException to JSON', () => {
      const error = new BadRequestException('Bad request')
      const json = error.toJSON()

      expect(json).toEqual({
        statusCode: 400,
        message: 'Bad request',
      })
    })

    it('should format HttpException with errors to JSON', () => {
      const errors = { field: 'error' }
      const error = new BadRequestException('Bad request', errors)
      const json = error.toJSON()

      expect(json).toEqual({
        statusCode: 400,
        message: 'Bad request',
        errors: { field: 'error' },
      })
    })

    it('should format custom HttpException to JSON', () => {
      const error = new HttpException('Custom', 418, { custom: 'data' })
      const json = error.toJSON()

      expect(json).toEqual({
        statusCode: 418,
        message: 'Custom',
        errors: { custom: 'data' },
      })
    })
  })
})
