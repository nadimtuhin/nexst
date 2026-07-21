import 'reflect-metadata'
import { UserRole } from '@prisma/client'
import {
  Roles,
  Public,
  Admin,
  Moderator,
  CurrentUser,
  isPublicRoute,
  getRequiredRoles,
  ROLES_KEY,
  PUBLIC_KEY,
} from '../auth.decorator'

describe('auth decorators (controller annotations)', () => {
  describe('@Roles', () => {
    it('attaches required roles as method metadata', () => {
      class Ctrl {
        @Roles([UserRole.ADMIN])
        handler() {}
      }
      expect(getRequiredRoles(Ctrl.prototype, 'handler')).toEqual([UserRole.ADMIN])
      expect(Reflect.getMetadata(ROLES_KEY, Ctrl.prototype, 'handler')).toEqual([
        UserRole.ADMIN,
      ])
    })

    it('supports multiple roles on one route', () => {
      class Ctrl {
        @Roles([UserRole.ADMIN, UserRole.MODERATOR])
        handler() {}
      }
      expect(getRequiredRoles(Ctrl.prototype, 'handler')).toEqual([
        UserRole.ADMIN,
        UserRole.MODERATOR,
      ])
    })

    it('applies as a class-level decorator', () => {
      @Roles([UserRole.ADMIN])
      class Ctrl {
        handler() {}
      }
      // class metadata is read via target.constructor for a given method
      expect(getRequiredRoles(Ctrl.prototype, 'handler')).toEqual([UserRole.ADMIN])
    })

    it('method-level roles take precedence over class-level roles', () => {
      @Roles([UserRole.USER])
      class Ctrl {
        @Roles([UserRole.ADMIN])
        adminOnly() {}
        classWide() {}
      }
      expect(getRequiredRoles(Ctrl.prototype, 'adminOnly')).toEqual([UserRole.ADMIN])
      expect(getRequiredRoles(Ctrl.prototype, 'classWide')).toEqual([UserRole.USER])
    })
  })

  describe('getRequiredRoles edge cases', () => {
    it('returns empty array when no roles metadata is present', () => {
      class Ctrl {
        handler() {}
      }
      expect(getRequiredRoles(Ctrl.prototype, 'handler')).toEqual([])
    })

    it('returns empty array for an unknown method name', () => {
      class Ctrl {}
      expect(getRequiredRoles(Ctrl.prototype, 'nope')).toEqual([])
    })
  })

  describe('@Admin shorthand', () => {
    it('is equivalent to @Roles([ADMIN])', () => {
      class Ctrl {
        @Admin()
        handler() {}
      }
      expect(getRequiredRoles(Ctrl.prototype, 'handler')).toEqual([UserRole.ADMIN])
    })
  })

  describe('@Moderator shorthand (hierarchy)', () => {
    it('grants both ADMIN and MODERATOR (admin outranks moderator)', () => {
      class Ctrl {
        @Moderator()
        handler() {}
      }
      const roles = getRequiredRoles(Ctrl.prototype, 'handler')
      expect(roles).toEqual([UserRole.ADMIN, UserRole.MODERATOR])
      expect(roles).toContain(UserRole.ADMIN)
      expect(roles).not.toContain(UserRole.USER)
    })
  })

  describe('@Public', () => {
    it('marks a method as public', () => {
      class Ctrl {
        @Public()
        handler() {}
      }
      expect(isPublicRoute(Ctrl.prototype, 'handler')).toBe(true)
      expect(Reflect.getMetadata(PUBLIC_KEY, Ctrl.prototype, 'handler')).toBe(true)
    })

    it('marks an entire controller as public at class level', () => {
      @Public()
      class Ctrl {
        handler() {}
      }
      expect(isPublicRoute(Ctrl.prototype, 'handler')).toBe(true)
    })

    it('returns false for a non-public route', () => {
      class Ctrl {
        handler() {}
      }
      expect(isPublicRoute(Ctrl.prototype, 'handler')).toBe(false)
    })

    it('a public route carries no role requirement', () => {
      class Ctrl {
        @Public()
        handler() {}
      }
      expect(getRequiredRoles(Ctrl.prototype, 'handler')).toEqual([])
    })
  })

  describe('@CurrentUser param decorator', () => {
    it('registers a param extractor that returns request.user', () => {
      class Ctrl {
        handler(@CurrentUser() _user: unknown) {}
      }
      const params = Reflect.getMetadata('custom:params', Ctrl.prototype, 'handler')
      expect(params).toHaveLength(1)
      expect(params[0]).toMatchObject({ index: 0, type: 'currentUser' })

      const user = { id: 1, role: UserRole.ADMIN }
      expect(params[0].extractor({ user } as any)).toBe(user)
    })

    it('extractor throws when AuthGuard did not populate request.user', () => {
      class Ctrl {
        handler(@CurrentUser() _user: unknown) {}
      }
      const params = Reflect.getMetadata('custom:params', Ctrl.prototype, 'handler')
      expect(() => params[0].extractor({} as any)).toThrow(
        'User not found in request context'
      )
    })
  })
})
