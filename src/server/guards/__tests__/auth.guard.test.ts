import 'reflect-metadata'
import { AuthGuard } from '../auth.guard'
import { UnauthorizedException } from '../../filters'

describe('AuthGuard', () => {
  let guard: AuthGuard

  beforeEach(() => {
    guard = new AuthGuard()
  })

  describe('canActivate', () => {
    it('should return true for valid API key', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('valid-api-key-123'),
        },
      }

      const context = { request: mockRequest }

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(mockRequest.headers.get).toHaveBeenCalledWith('x-api-key')
    })

    it('should return true for API key with exactly 10 characters', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('1234567890'),
        },
      }

      const context = { request: mockRequest }

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should return true for long API key', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('very-long-api-key-with-many-characters-12345678901234567890'),
        },
      }

      const context = { request: mockRequest }

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should throw UnauthorizedException when API key is missing', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      }

      const context = { request: mockRequest }

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
      await expect(guard.canActivate(context)).rejects.toThrow('API key is required')
    })

    it('should throw UnauthorizedException when API key is undefined', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(undefined),
        },
      }

      const context = { request: mockRequest }

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
      await expect(guard.canActivate(context)).rejects.toThrow('API key is required')
    })

    it('should throw UnauthorizedException when API key is empty string', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(''),
        },
      }

      const context = { request: mockRequest }

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
      await expect(guard.canActivate(context)).rejects.toThrow('API key is required')
    })

    it('should throw UnauthorizedException when API key is too short (9 characters)', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('123456789'),
        },
      }

      const context = { request: mockRequest }

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid API key')
    })

    it('should throw UnauthorizedException when API key is 1 character', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('a'),
        },
      }

      const context = { request: mockRequest }

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid API key')
    })

    it('should call headers.get with correct header name', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('valid-api-key-123'),
        },
      }

      const context = { request: mockRequest }

      await guard.canActivate(context)

      expect(mockRequest.headers.get).toHaveBeenCalledTimes(1)
      expect(mockRequest.headers.get).toHaveBeenCalledWith('x-api-key')
    })

    it('should handle multiple successive calls', async () => {
      const mockRequest1 = {
        headers: {
          get: jest.fn().mockReturnValue('valid-key-one'),
        },
      }

      const mockRequest2 = {
        headers: {
          get: jest.fn().mockReturnValue('valid-key-two'),
        },
      }

      const result1 = await guard.canActivate({ request: mockRequest1 })
      const result2 = await guard.canActivate({ request: mockRequest2 })

      expect(result1).toBe(true)
      expect(result2).toBe(true)
    })

    it('should be case-sensitive for header name', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn((headerName: string) => {
            // Simulate case-sensitive header lookup
            if (headerName === 'x-api-key') {
              return 'valid-api-key-123'
            }
            return null
          }),
        },
      }

      const context = { request: mockRequest }

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(mockRequest.headers.get).toHaveBeenCalledWith('x-api-key')
    })
  })

  describe('Guard instantiation', () => {
    it('should create guard instance', () => {
      const newGuard = new AuthGuard()
      expect(newGuard).toBeInstanceOf(AuthGuard)
    })

    it('should have canActivate method', () => {
      expect(guard.canActivate).toBeDefined()
      expect(typeof guard.canActivate).toBe('function')
    })
  })
})
