import 'reflect-metadata'
import { container } from 'tsyringe'
import { RbacGuard, createRbacGuard } from '../rbac.guard'
import { PermissionRepository } from '../../database/repositories/permission.repository'
import { UnauthorizedException, ForbiddenException } from '../../filters/http-exception'
import { PermissionAction, PermissionResource } from '@prisma/client'

// The guard resolves PermissionRepository from the tsyringe container in its
// constructor, so we register a mock instance before constructing it.
describe('RbacGuard', () => {
  let userHasPermission: jest.Mock

  beforeEach(() => {
    userHasPermission = jest.fn()
    container.clearInstances()
    container.registerInstance(PermissionRepository, { userHasPermission } as any)
  })

  afterAll(() => {
    container.clearInstances()
  })

  describe('canActivate', () => {
    it('throws UnauthorizedException when the request has no userId', async () => {
      const guard = new RbacGuard()
      await expect(guard.canActivate({ request: {} })).rejects.toThrow(UnauthorizedException)
    })

    it('allows access when no permissions are required', async () => {
      const guard = new RbacGuard()
      await expect(guard.canActivate({ request: { userId: 1 } })).resolves.toBe(true)
      expect(userHasPermission).not.toHaveBeenCalled()
    })

    it('allows access when requiredPermissions is an empty array', async () => {
      const guard = new RbacGuard()
      await expect(
        guard.canActivate({ request: { userId: 1, requiredPermissions: [] } })
      ).resolves.toBe(true)
    })

    it('allows access when the user has every required permission', async () => {
      userHasPermission.mockResolvedValue(true)
      const guard = new RbacGuard()

      const request = {
        userId: 1,
        tenantId: 7,
        requiredPermissions: [
          { action: PermissionAction.READ, resource: PermissionResource.USER },
          { action: PermissionAction.CREATE, resource: PermissionResource.ROLE },
        ],
      }

      await expect(guard.canActivate({ request })).resolves.toBe(true)
      expect(userHasPermission).toHaveBeenCalledWith(1, PermissionAction.READ, PermissionResource.USER, 7)
      expect(userHasPermission).toHaveBeenCalledTimes(2)
    })

    it('throws ForbiddenException when a required permission is missing', async () => {
      userHasPermission.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
      const guard = new RbacGuard()

      const request = {
        userId: 1,
        requiredPermissions: [
          { action: PermissionAction.READ, resource: PermissionResource.USER },
          { action: PermissionAction.DELETE, resource: PermissionResource.USER },
        ],
      }

      await expect(guard.canActivate({ request })).rejects.toThrow(ForbiddenException)
    })
  })

  describe('createRbacGuard factory', () => {
    it('attaches the permission requirement to the request then delegates', async () => {
      userHasPermission.mockResolvedValue(true)
      const GuardClass = createRbacGuard(PermissionAction.MANAGE, PermissionResource.ALL)
      const guard = new GuardClass()

      const request: any = { userId: 5 }
      await expect(guard.canActivate({ request })).resolves.toBe(true)

      expect(request.requiredPermissions).toEqual([
        { action: PermissionAction.MANAGE, resource: PermissionResource.ALL },
      ])
      expect(userHasPermission).toHaveBeenCalledWith(5, PermissionAction.MANAGE, PermissionResource.ALL, undefined)
    })

    it('appends to an existing requiredPermissions array rather than replacing it', async () => {
      userHasPermission.mockResolvedValue(true)
      const GuardClass = createRbacGuard(PermissionAction.READ, PermissionResource.USER)
      const guard = new GuardClass()

      const request: any = {
        userId: 5,
        requiredPermissions: [{ action: PermissionAction.CREATE, resource: PermissionResource.ROLE }],
      }
      await guard.canActivate({ request })

      expect(request.requiredPermissions).toHaveLength(2)
    })

    it('still enforces authentication via the parent guard', async () => {
      const GuardClass = createRbacGuard(PermissionAction.READ, PermissionResource.USER)
      const guard = new GuardClass()
      await expect(guard.canActivate({ request: {} })).rejects.toThrow(UnauthorizedException)
    })
  })
})
