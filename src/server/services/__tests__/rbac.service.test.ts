import 'reflect-metadata'
import { RbacService } from '../rbac.service'
import { NotFoundException, ConflictException, BadRequestException } from '../../filters/http-exception'
import { PermissionAction, PermissionResource } from '@prisma/client'

// Pure unit tests: repositories are mocked so nothing touches the database.
function makeRoleRepo() {
  return {
    findByName: jest.fn(),
    findById: jest.fn(),
    findByIdWithPermissions: jest.fn(),
    findByTenant: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteRole: jest.fn(),
    assignPermissions: jest.fn(),
    getRolePermissions: jest.fn(),
    userHasRole: jest.fn(),
    assignToUser: jest.fn(),
    removeFromUser: jest.fn(),
    getUserRoles: jest.fn(),
    getRoleUsers: jest.fn(),
    prismaService: { userRole_New: { findMany: jest.fn() } },
  }
}

function makePermRepo() {
  return {
    findByActionAndResource: jest.fn(),
    findAllPermissions: jest.fn(),
    create: jest.fn(),
    userHasPermission: jest.fn(),
    getUserPermissions: jest.fn(),
    seedDefaultPermissions: jest.fn(),
  }
}

describe('RbacService', () => {
  let roleRepo: ReturnType<typeof makeRoleRepo>
  let permRepo: ReturnType<typeof makePermRepo>
  let service: RbacService

  beforeEach(() => {
    roleRepo = makeRoleRepo()
    permRepo = makePermRepo()
    service = new RbacService(roleRepo as any, permRepo as any)
  })

  // ============================================
  // createRole
  // ============================================
  describe('createRole', () => {
    it('throws ConflictException when a role with the same name exists for the tenant', async () => {
      roleRepo.findByName.mockResolvedValue({ id: 1, name: 'Admin' })

      await expect(service.createRole({ name: 'Admin' } as any)).rejects.toThrow(ConflictException)
      expect(roleRepo.create).not.toHaveBeenCalled()
    })

    it('creates a role and assigns permissions when permissionIds are provided', async () => {
      roleRepo.findByName.mockResolvedValue(null)
      roleRepo.create.mockResolvedValue({ id: 5 })
      roleRepo.findByIdWithPermissions.mockResolvedValue({ id: 5, permissions: [] })

      await service.createRole({ name: 'Editor', permissionIds: [1, 2] } as any)

      expect(roleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Editor', isSystem: false })
      )
      expect(roleRepo.assignPermissions).toHaveBeenCalledWith(5, [1, 2])
      expect(roleRepo.findByIdWithPermissions).toHaveBeenCalledWith(5)
    })

    it('does NOT assign permissions when permissionIds is empty (edge case)', async () => {
      roleRepo.findByName.mockResolvedValue(null)
      roleRepo.create.mockResolvedValue({ id: 6 })
      roleRepo.findByIdWithPermissions.mockResolvedValue({ id: 6 })

      await service.createRole({ name: 'Empty', permissionIds: [] } as any)

      expect(roleRepo.assignPermissions).not.toHaveBeenCalled()
    })

    it('checks name uniqueness against null tenant when tenantId is not given', async () => {
      roleRepo.findByName.mockResolvedValue(null)
      roleRepo.create.mockResolvedValue({ id: 7 })
      roleRepo.findByIdWithPermissions.mockResolvedValue({ id: 7 })

      await service.createRole({ name: 'Global' } as any)

      expect(roleRepo.findByName).toHaveBeenCalledWith('Global', null)
    })
  })

  // ============================================
  // getRoleById
  // ============================================
  describe('getRoleById', () => {
    it('returns the role when found', async () => {
      roleRepo.findByIdWithPermissions.mockResolvedValue({ id: 1 })
      await expect(service.getRoleById(1)).resolves.toEqual({ id: 1 })
    })

    it('throws NotFoundException when the role does not exist', async () => {
      roleRepo.findByIdWithPermissions.mockResolvedValue(null)
      await expect(service.getRoleById(99)).rejects.toThrow(NotFoundException)
    })
  })

  // ============================================
  // updateRole
  // ============================================
  describe('updateRole', () => {
    it('throws NotFoundException when the role is missing', async () => {
      roleRepo.findById.mockResolvedValue(null)
      await expect(service.updateRole(1, { name: 'X' } as any)).rejects.toThrow(NotFoundException)
    })

    it('throws BadRequestException when the role is a system role', async () => {
      roleRepo.findById.mockResolvedValue({ id: 1, isSystem: true })
      await expect(service.updateRole(1, { name: 'X' } as any)).rejects.toThrow(BadRequestException)
    })

    it('throws ConflictException when renaming to an existing name', async () => {
      roleRepo.findById.mockResolvedValue({ id: 1, name: 'Old', isSystem: false, tenantId: null })
      roleRepo.findByName.mockResolvedValue({ id: 2, name: 'New' })

      await expect(service.updateRole(1, { name: 'New' } as any)).rejects.toThrow(ConflictException)
    })

    it('updates and reassigns permissions when permissionIds provided', async () => {
      roleRepo.findById.mockResolvedValue({ id: 1, name: 'Old', isSystem: false, tenantId: null })
      roleRepo.findByIdWithPermissions.mockResolvedValue({ id: 1 })

      await service.updateRole(1, { description: 'd', permissionIds: [3] } as any)

      expect(roleRepo.update).toHaveBeenCalled()
      expect(roleRepo.assignPermissions).toHaveBeenCalledWith(1, [3])
    })

    it('skips the name-conflict check when the name is unchanged', async () => {
      roleRepo.findById.mockResolvedValue({ id: 1, name: 'Same', isSystem: false, tenantId: null })
      roleRepo.findByIdWithPermissions.mockResolvedValue({ id: 1 })

      await service.updateRole(1, { name: 'Same' } as any)

      expect(roleRepo.findByName).not.toHaveBeenCalled()
    })
  })

  // ============================================
  // deleteRole
  // ============================================
  describe('deleteRole', () => {
    it('throws NotFoundException when missing', async () => {
      roleRepo.findById.mockResolvedValue(null)
      await expect(service.deleteRole(1)).rejects.toThrow(NotFoundException)
    })

    it('throws BadRequestException for system roles', async () => {
      roleRepo.findById.mockResolvedValue({ id: 1, isSystem: true })
      await expect(service.deleteRole(1)).rejects.toThrow(BadRequestException)
    })

    it('deletes a non-system role', async () => {
      roleRepo.findById.mockResolvedValue({ id: 1, isSystem: false })
      await expect(service.deleteRole(1)).resolves.toEqual({ message: 'Role deleted successfully' })
      expect(roleRepo.deleteRole).toHaveBeenCalledWith(1)
    })
  })

  // ============================================
  // assignRole
  // ============================================
  describe('assignRole', () => {
    it('throws NotFoundException when the role does not exist', async () => {
      roleRepo.findById.mockResolvedValue(null)
      await expect(service.assignRole({ userId: 1, roleId: 2 } as any)).rejects.toThrow(NotFoundException)
    })

    it('throws ConflictException when the user already has the role', async () => {
      roleRepo.findById.mockResolvedValue({ id: 2 })
      roleRepo.userHasRole.mockResolvedValue(true)

      await expect(service.assignRole({ userId: 1, roleId: 2 } as any)).rejects.toThrow(ConflictException)
      expect(roleRepo.assignToUser).not.toHaveBeenCalled()
    })

    it('assigns the role when valid and not yet held', async () => {
      roleRepo.findById.mockResolvedValue({ id: 2 })
      roleRepo.userHasRole.mockResolvedValue(false)

      await expect(service.assignRole({ userId: 1, roleId: 2, tenantId: 3 } as any)).resolves.toEqual({
        message: 'Role assigned successfully',
      })
      expect(roleRepo.assignToUser).toHaveBeenCalledWith(1, 2, 3)
    })
  })

  // ============================================
  // removeRole
  // ============================================
  describe('removeRole', () => {
    it('throws NotFoundException when the user does not have the role', async () => {
      roleRepo.userHasRole.mockResolvedValue(false)
      await expect(service.removeRole(1, 2)).rejects.toThrow(NotFoundException)
      expect(roleRepo.removeFromUser).not.toHaveBeenCalled()
    })

    it('removes the role when the user has it', async () => {
      roleRepo.userHasRole.mockResolvedValue(true)
      await expect(service.removeRole(1, 2, 3)).resolves.toEqual({ message: 'Role removed successfully' })
      expect(roleRepo.removeFromUser).toHaveBeenCalledWith(1, 2, 3)
    })
  })

  // ============================================
  // getUserTenants (dedup logic)
  // ============================================
  describe('getUserTenants', () => {
    it('returns unique tenants and filters out null tenants', async () => {
      roleRepo.prismaService.userRole_New.findMany.mockResolvedValue([
        { tenant: { id: 1, name: 'A' } },
        { tenant: { id: 1, name: 'A' } }, // duplicate
        { tenant: null }, // system-wide role, no tenant
        { tenant: { id: 2, name: 'B' } },
      ])

      const tenants = await service.getUserTenants(42)

      expect(tenants).toEqual([{ id: 1, name: 'A' }, { id: 2, name: 'B' }])
    })

    it('returns an empty array when the user has no tenant roles', async () => {
      roleRepo.prismaService.userRole_New.findMany.mockResolvedValue([])
      await expect(service.getUserTenants(42)).resolves.toEqual([])
    })
  })

  // ============================================
  // createPermission
  // ============================================
  describe('createPermission', () => {
    it('throws ConflictException when the permission already exists', async () => {
      permRepo.findByActionAndResource.mockResolvedValue({ id: 1 })
      await expect(
        service.createPermission({ action: PermissionAction.READ, resource: PermissionResource.USER } as any)
      ).rejects.toThrow(ConflictException)
    })

    it('creates the permission when new', async () => {
      permRepo.findByActionAndResource.mockResolvedValue(null)
      permRepo.create.mockResolvedValue({ id: 9 })
      await service.createPermission({
        action: PermissionAction.READ,
        resource: PermissionResource.USER,
      } as any)
      expect(permRepo.create).toHaveBeenCalled()
    })
  })

  // ============================================
  // getRolePermissions
  // ============================================
  describe('getRolePermissions', () => {
    it('throws NotFoundException when the role is missing', async () => {
      roleRepo.findById.mockResolvedValue(null)
      await expect(service.getRolePermissions(1)).rejects.toThrow(NotFoundException)
    })

    it('returns permissions for an existing role', async () => {
      roleRepo.findById.mockResolvedValue({ id: 1 })
      roleRepo.getRolePermissions.mockResolvedValue([{ id: 1 }])
      await expect(service.getRolePermissions(1)).resolves.toEqual([{ id: 1 }])
    })
  })

  // ============================================
  // Permission checking
  // ============================================
  describe('checkPermission / requirePermission', () => {
    it('checkPermission delegates to the repository', async () => {
      permRepo.userHasPermission.mockResolvedValue(true)
      await expect(
        service.checkPermission({
          userId: 1,
          action: PermissionAction.READ,
          resource: PermissionResource.USER,
        } as any)
      ).resolves.toBe(true)
    })

    it('requirePermission resolves when the user has the permission', async () => {
      permRepo.userHasPermission.mockResolvedValue(true)
      await expect(
        service.requirePermission(1, PermissionAction.READ, PermissionResource.USER)
      ).resolves.toBeUndefined()
    })

    it('requirePermission throws BadRequestException when the user lacks the permission', async () => {
      permRepo.userHasPermission.mockResolvedValue(false)
      await expect(
        service.requirePermission(1, PermissionAction.DELETE, PermissionResource.USER)
      ).rejects.toThrow(BadRequestException)
    })
  })

  // ============================================
  // Seeding
  // ============================================
  describe('seedPermissions', () => {
    it('delegates to the repository and returns a message', async () => {
      await expect(service.seedPermissions()).resolves.toEqual({
        message: 'Default permissions seeded successfully',
      })
      expect(permRepo.seedDefaultPermissions).toHaveBeenCalled()
    })
  })

  describe('seedSystemRoles', () => {
    const allPerms = [
      { id: 1, action: PermissionAction.MANAGE, resource: PermissionResource.ALL },
      { id: 2, action: PermissionAction.READ, resource: PermissionResource.USER },
      { id: 3, action: PermissionAction.CREATE, resource: PermissionResource.ROLE },
      { id: 4, action: PermissionAction.UPDATE, resource: PermissionResource.SETTINGS },
      { id: 5, action: PermissionAction.READ, resource: PermissionResource.TENANT },
    ]

    it('creates all three system roles with the correct permission sets when none exist', async () => {
      permRepo.findAllPermissions.mockResolvedValue(allPerms)
      roleRepo.findByName.mockResolvedValue(null) // none exist yet
      roleRepo.create
        .mockResolvedValueOnce({ id: 10 }) // Super Admin
        .mockResolvedValueOnce({ id: 11 }) // Tenant Admin
        .mockResolvedValueOnce({ id: 12 }) // Viewer

      await service.seedSystemRoles()

      // Super Admin -> MANAGE ALL only
      expect(roleRepo.assignPermissions).toHaveBeenCalledWith(10, [1])
      // Tenant Admin -> USER/ROLE/SETTINGS permission ids (2,3,4)
      expect(roleRepo.assignPermissions).toHaveBeenCalledWith(11, [2, 3, 4])
      // Viewer -> all READ permission ids (2,5)
      expect(roleRepo.assignPermissions).toHaveBeenCalledWith(12, [2, 5])
      expect(roleRepo.create).toHaveBeenCalledTimes(3)
    })

    it('is idempotent: skips roles that already exist', async () => {
      permRepo.findAllPermissions.mockResolvedValue(allPerms)
      roleRepo.findByName.mockResolvedValue({ id: 1, isSystem: true }) // every role already exists

      await service.seedSystemRoles()

      expect(roleRepo.create).not.toHaveBeenCalled()
      expect(roleRepo.assignPermissions).not.toHaveBeenCalled()
    })

    it('does not assign a MANAGE-ALL permission to Super Admin when none exists', async () => {
      permRepo.findAllPermissions.mockResolvedValue([
        { id: 2, action: PermissionAction.READ, resource: PermissionResource.USER },
      ])
      roleRepo.findByName.mockResolvedValue(null)
      roleRepo.create
        .mockResolvedValueOnce({ id: 10 })
        .mockResolvedValueOnce({ id: 11 })
        .mockResolvedValueOnce({ id: 12 })

      await service.seedSystemRoles()

      // Super Admin (id 10) should not get an assignPermissions call — no MANAGE ALL present
      expect(roleRepo.assignPermissions).not.toHaveBeenCalledWith(10, expect.anything())
    })
  })
})
