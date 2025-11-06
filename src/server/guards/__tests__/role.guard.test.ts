import 'reflect-metadata'
import { container } from 'tsyringe'
import { RoleGuard } from '../role.guard'
import { LoggerService } from '../../logger/logger.service'
import { UnauthorizedException, ForbiddenException } from '../../filters'
import { UserRole } from '@prisma/client'

describe('RoleGuard', () => {
  let roleGuard: RoleGuard

  beforeAll(() => {
    if (!container.isRegistered(LoggerService)) {
      container.registerSingleton(LoggerService)
    }
    if (!container.isRegistered(RoleGuard)) {
      container.registerSingleton(RoleGuard)
    }
  })

  beforeEach(() => {
    roleGuard = container.resolve(RoleGuard)
  })

  afterAll(() => {
    container.clearInstances()
  })

  describe('canActivate', () => {
    it('should allow access when user has required role', async () => {
      roleGuard.setRoles([UserRole.ADMIN])

      const mockRequest: any = {
        user: {
          id: 1,
          email: 'admin@example.com',
          name: 'Admin User',
          role: UserRole.ADMIN,
        },
      }

      const context = { request: mockRequest }
      const result = await roleGuard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should allow access when user has one of multiple required roles', async () => {
      roleGuard.setRoles([UserRole.ADMIN, UserRole.MODERATOR])

      const mockRequest: any = {
        user: {
          id: 2,
          email: 'mod@example.com',
          name: 'Moderator User',
          role: UserRole.MODERATOR,
        },
      }

      const context = { request: mockRequest }
      const result = await roleGuard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should throw ForbiddenException when user lacks required role', async () => {
      roleGuard.setRoles([UserRole.ADMIN])

      const mockRequest: any = {
        user: {
          id: 3,
          email: 'user@example.com',
          name: 'Regular User',
          role: UserRole.USER,
        },
      }

      const context = { request: mockRequest }

      await expect(roleGuard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      )
      await expect(roleGuard.canActivate(context)).rejects.toThrow(
        'Insufficient permissions'
      )
    })

    it('should throw UnauthorizedException when user not in request', async () => {
      roleGuard.setRoles([UserRole.USER])

      const mockRequest: any = {}
      const context = { request: mockRequest }

      await expect(roleGuard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      )
      await expect(roleGuard.canActivate(context)).rejects.toThrow(
        'Authentication required'
      )
    })

    it('should allow access when no roles specified (misconfiguration)', async () => {
      // No roles set - guard is misconfigured but should allow access
      const mockRequest: any = {
        user: {
          id: 1,
          email: 'user@example.com',
          name: 'User',
          role: UserRole.USER,
        },
      }

      const context = { request: mockRequest }
      const result = await roleGuard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should work with USER role', async () => {
      roleGuard.setRoles([UserRole.USER])

      const mockRequest: any = {
        user: {
          id: 1,
          email: 'user@example.com',
          name: 'User',
          role: UserRole.USER,
        },
      }

      const context = { request: mockRequest }
      const result = await roleGuard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should work with MODERATOR role', async () => {
      roleGuard.setRoles([UserRole.MODERATOR])

      const mockRequest: any = {
        user: {
          id: 2,
          email: 'mod@example.com',
          name: 'Moderator',
          role: UserRole.MODERATOR,
        },
      }

      const context = { request: mockRequest }
      const result = await roleGuard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should reject USER when ADMIN required', async () => {
      roleGuard.setRoles([UserRole.ADMIN])

      const mockRequest: any = {
        user: {
          id: 1,
          email: 'user@example.com',
          name: 'User',
          role: UserRole.USER,
        },
      }

      const context = { request: mockRequest }

      await expect(roleGuard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      )
    })

    it('should reject MODERATOR when ADMIN required', async () => {
      roleGuard.setRoles([UserRole.ADMIN])

      const mockRequest: any = {
        user: {
          id: 2,
          email: 'mod@example.com',
          name: 'Moderator',
          role: UserRole.MODERATOR,
        },
      }

      const context = { request: mockRequest }

      await expect(roleGuard.canActivate(context)).rejects.toThrow(
        ForbiddenException
      )
    })
  })

  describe('setRoles', () => {
    it('should set required roles', () => {
      const guard = roleGuard.setRoles([UserRole.ADMIN])
      expect(guard).toBe(roleGuard) // Returns this for chaining
    })

    it('should allow method chaining', () => {
      const guard = new RoleGuard(container.resolve(LoggerService))
      const result = guard.setRoles([UserRole.ADMIN])
      expect(result).toBeInstanceOf(RoleGuard)
    })
  })

  describe('static hasRole', () => {
    it('should return true when user has exact role', () => {
      const mockRequest: any = {
        user: {
          role: UserRole.ADMIN,
        },
      }

      const result = RoleGuard.hasRole(mockRequest, UserRole.ADMIN)
      expect(result).toBe(true)
    })

    it('should return false when user has different role', () => {
      const mockRequest: any = {
        user: {
          role: UserRole.USER,
        },
      }

      const result = RoleGuard.hasRole(mockRequest, UserRole.ADMIN)
      expect(result).toBe(false)
    })

    it('should return false when no user in request', () => {
      const mockRequest: any = {}

      const result = RoleGuard.hasRole(mockRequest, UserRole.ADMIN)
      expect(result).toBe(false)
    })
  })

  describe('static hasAnyRole', () => {
    it('should return true when user has one of the roles', () => {
      const mockRequest: any = {
        user: {
          role: UserRole.MODERATOR,
        },
      }

      const result = RoleGuard.hasAnyRole(mockRequest, [
        UserRole.ADMIN,
        UserRole.MODERATOR,
      ])
      expect(result).toBe(true)
    })

    it('should return false when user has none of the roles', () => {
      const mockRequest: any = {
        user: {
          role: UserRole.USER,
        },
      }

      const result = RoleGuard.hasAnyRole(mockRequest, [
        UserRole.ADMIN,
        UserRole.MODERATOR,
      ])
      expect(result).toBe(false)
    })

    it('should return false when no user in request', () => {
      const mockRequest: any = {}

      const result = RoleGuard.hasAnyRole(mockRequest, [UserRole.ADMIN])
      expect(result).toBe(false)
    })
  })

  describe('static isAdmin', () => {
    it('should return true for admin user', () => {
      const mockRequest: any = {
        user: {
          role: UserRole.ADMIN,
        },
      }

      const result = RoleGuard.isAdmin(mockRequest)
      expect(result).toBe(true)
    })

    it('should return false for non-admin user', () => {
      const mockRequest: any = {
        user: {
          role: UserRole.USER,
        },
      }

      const result = RoleGuard.isAdmin(mockRequest)
      expect(result).toBe(false)
    })

    it('should return false for moderator', () => {
      const mockRequest: any = {
        user: {
          role: UserRole.MODERATOR,
        },
      }

      const result = RoleGuard.isAdmin(mockRequest)
      expect(result).toBe(false)
    })
  })

  describe('static isModerator', () => {
    it('should return true for moderator', () => {
      const mockRequest: any = {
        user: {
          role: UserRole.MODERATOR,
        },
      }

      const result = RoleGuard.isModerator(mockRequest)
      expect(result).toBe(true)
    })

    it('should return true for admin (admin is also moderator)', () => {
      const mockRequest: any = {
        user: {
          role: UserRole.ADMIN,
        },
      }

      const result = RoleGuard.isModerator(mockRequest)
      expect(result).toBe(true)
    })

    it('should return false for regular user', () => {
      const mockRequest: any = {
        user: {
          role: UserRole.USER,
        },
      }

      const result = RoleGuard.isModerator(mockRequest)
      expect(result).toBe(false)
    })
  })

  describe('Integration Tests', () => {
    it('should handle multiple role checks in sequence', async () => {
      const adminRequest: any = {
        user: { role: UserRole.ADMIN },
      }
      const modRequest: any = {
        user: { role: UserRole.MODERATOR },
      }
      const userRequest: any = {
        user: { role: UserRole.USER },
      }

      // Admin only
      roleGuard.setRoles([UserRole.ADMIN])
      await expect(
        roleGuard.canActivate({ request: adminRequest })
      ).resolves.toBe(true)
      await expect(
        roleGuard.canActivate({ request: modRequest })
      ).rejects.toThrow(ForbiddenException)
      await expect(
        roleGuard.canActivate({ request: userRequest })
      ).rejects.toThrow(ForbiddenException)

      // Admin or Moderator
      roleGuard.setRoles([UserRole.ADMIN, UserRole.MODERATOR])
      await expect(
        roleGuard.canActivate({ request: adminRequest })
      ).resolves.toBe(true)
      await expect(
        roleGuard.canActivate({ request: modRequest })
      ).resolves.toBe(true)
      await expect(
        roleGuard.canActivate({ request: userRequest })
      ).rejects.toThrow(ForbiddenException)

      // All roles
      roleGuard.setRoles([UserRole.ADMIN, UserRole.MODERATOR, UserRole.USER])
      await expect(
        roleGuard.canActivate({ request: adminRequest })
      ).resolves.toBe(true)
      await expect(
        roleGuard.canActivate({ request: modRequest })
      ).resolves.toBe(true)
      await expect(
        roleGuard.canActivate({ request: userRequest })
      ).resolves.toBe(true)
    })
  })
})
