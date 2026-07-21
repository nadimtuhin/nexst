import 'reflect-metadata'
import {
  RequirePermission,
  RequirePermissions,
  RequireManage,
  RequireRead,
  RequireCreate,
  RequireUpdate,
  RequireDelete,
  REQUIRED_PERMISSIONS_KEY,
} from '../permission.decorator'
import { PermissionAction, PermissionResource } from '@prisma/client'

function getPerms(target: any, key: string) {
  return Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, target, key)
}

describe('permission decorators', () => {
  describe('RequirePermission', () => {
    it('sets a single permission requirement on the method', () => {
      class C {
        @RequirePermission(PermissionAction.CREATE, PermissionResource.USER)
        method() {}
      }
      expect(getPerms(C.prototype, 'method')).toEqual([
        { action: PermissionAction.CREATE, resource: PermissionResource.USER },
      ])
    })

    it('appends when applied multiple times to the same method', () => {
      class C {
        @RequirePermission(PermissionAction.READ, PermissionResource.USER)
        @RequirePermission(PermissionAction.READ, PermissionResource.TENANT)
        method() {}
      }
      // Decorators apply bottom-up; both requirements accumulate.
      expect(getPerms(C.prototype, 'method')).toHaveLength(2)
    })
  })

  describe('RequirePermissions', () => {
    it('replaces the metadata with the given array', () => {
      const perms = [
        { action: PermissionAction.READ, resource: PermissionResource.USER },
        { action: PermissionAction.READ, resource: PermissionResource.TENANT },
      ]
      class C {
        @RequirePermissions(perms)
        method() {}
      }
      expect(getPerms(C.prototype, 'method')).toEqual(perms)
    })

    it('supports an empty permissions array (edge case)', () => {
      class C {
        @RequirePermissions([])
        method() {}
      }
      expect(getPerms(C.prototype, 'method')).toEqual([])
    })
  })

  describe('shorthand decorators', () => {
    const cases: Array<[string, (r: PermissionResource) => MethodDecorator, PermissionAction]> = [
      ['RequireManage', RequireManage, PermissionAction.MANAGE],
      ['RequireRead', RequireRead, PermissionAction.READ],
      ['RequireCreate', RequireCreate, PermissionAction.CREATE],
      ['RequireUpdate', RequireUpdate, PermissionAction.UPDATE],
      ['RequireDelete', RequireDelete, PermissionAction.DELETE],
    ]

    it.each(cases)('%s maps to the correct action', (_name, decorator, action) => {
      class C {}
      const descriptor = { value: () => {} } as PropertyDescriptor
      decorator(PermissionResource.SETTINGS)(C.prototype, 'm', descriptor)

      expect(getPerms(C.prototype, 'm')).toEqual([
        { action, resource: PermissionResource.SETTINGS },
      ])
    })
  })

  it('returns undefined metadata for methods with no permission decorator', () => {
    class C {
      plain() {}
    }
    expect(getPerms(C.prototype, 'plain')).toBeUndefined()
  })
})
