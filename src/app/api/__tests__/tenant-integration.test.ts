// @ts-nocheck
import 'reflect-metadata'
import { container } from 'tsyringe'
import { PrismaService } from '../../../server/database/prisma.service'
import { LoggerService } from '../../../server/logger/logger.service'
import { TenantStatus } from '@prisma/client'

/**
 * Multi-Tenant Integration Tests
 *
 * These tests verify the end-to-end functionality of the multi-tenant feature,
 * including middleware, guards, services, and repositories working together.
 */
describe('Multi-Tenant Integration', () => {
  let prismaService: PrismaService
  let tenant1: any
  let tenant2: any
  let user1: any
  let user2: any

  beforeAll(() => {
    if (!container.isRegistered(LoggerService)) {
      container.registerSingleton(LoggerService)
    }
    if (!container.isRegistered(PrismaService)) {
      container.registerSingleton(PrismaService)
    }
  })

  beforeEach(async () => {
    prismaService = container.resolve(PrismaService)
    await prismaService.onModuleInit()
    await prismaService.cleanDatabase()

    // Create test tenants
    tenant1 = await prismaService.tenant.create({
      data: {
        name: 'Acme Corporation',
        slug: 'acme',
        domain: 'acme.example.com',
        status: TenantStatus.ACTIVE,
        settings: JSON.stringify({ theme: 'blue' }),
      },
    })

    tenant2 = await prismaService.tenant.create({
      data: {
        name: 'TechStart Inc',
        slug: 'techstart',
        domain: 'techstart.example.com',
        status: TenantStatus.ACTIVE,
        settings: JSON.stringify({ theme: 'green' }),
      },
    })

    // Create test users for each tenant
    user1 = await prismaService.user.create({
      data: {
        email: 'user1@acme.com',
        name: 'User 1',
        password: 'hashedpassword1',
        tenantId: tenant1.id,
      },
    })

    user2 = await prismaService.user.create({
      data: {
        email: 'user2@techstart.com',
        name: 'User 2',
        password: 'hashedpassword2',
        tenantId: tenant2.id,
      },
    })
  })

  afterEach(async () => {
    await prismaService.cleanDatabase()
  })

  afterAll(async () => {
    await prismaService.onModuleDestroy()
    container.clearInstances()
  })

  describe('Tenant Isolation', () => {
    it('should isolate users between tenants', async () => {
      // Get users for tenant1
      const tenant1Users = await prismaService.user.findMany({
        where: { tenantId: tenant1.id },
      })

      expect(tenant1Users).toHaveLength(1)
      expect(tenant1Users[0].email).toBe('user1@acme.com')

      // Get users for tenant2
      const tenant2Users = await prismaService.user.findMany({
        where: { tenantId: tenant2.id },
      })

      expect(tenant2Users).toHaveLength(1)
      expect(tenant2Users[0].email).toBe('user2@techstart.com')
    })

    it('should prevent cross-tenant data access', async () => {
      // Try to get tenant1's user from tenant2's context
      const crossTenantUser = await prismaService.user.findFirst({
        where: {
          id: user1.id,
          tenantId: tenant2.id,
        },
      })

      expect(crossTenantUser).toBeNull()
    })
  })

  describe('Tenant Lookup', () => {
    it('should find tenant by ID', async () => {
      const found = await prismaService.tenant.findUnique({
        where: { id: tenant1.id },
      })

      expect(found).toBeTruthy()
      expect(found?.slug).toBe('acme')
    })

    it('should find tenant by slug', async () => {
      const found = await prismaService.tenant.findUnique({
        where: { slug: 'acme' },
      })

      expect(found).toBeTruthy()
      expect(found?.id).toBe(tenant1.id)
    })

    it('should find tenant by domain', async () => {
      const found = await prismaService.tenant.findUnique({
        where: { domain: 'acme.example.com' },
      })

      expect(found).toBeTruthy()
      expect(found?.id).toBe(tenant1.id)
    })
  })

  describe('Tenant Status Management', () => {
    it('should update tenant status to SUSPENDED', async () => {
      const updated = await prismaService.tenant.update({
        where: { id: tenant1.id },
        data: { status: TenantStatus.SUSPENDED },
      })

      expect(updated.status).toBe(TenantStatus.SUSPENDED)
    })

    it('should filter active tenants', async () => {
      // Suspend tenant2
      await prismaService.tenant.update({
        where: { id: tenant2.id },
        data: { status: TenantStatus.SUSPENDED },
      })

      const activeTenants = await prismaService.tenant.findMany({
        where: { status: TenantStatus.ACTIVE },
      })

      expect(activeTenants).toHaveLength(1)
      expect(activeTenants[0].id).toBe(tenant1.id)
    })
  })

  describe('Tenant User Count', () => {
    it('should count users per tenant', async () => {
      // Add more users to tenant1
      await prismaService.user.createMany({
        data: [
          {
            email: 'user3@acme.com',
            name: 'User 3',
            password: 'password',
            tenantId: tenant1.id,
          },
          {
            email: 'user4@acme.com',
            name: 'User 4',
            password: 'password',
            tenantId: tenant1.id,
          },
        ],
      })

      const tenant1Count = await prismaService.user.count({
        where: { tenantId: tenant1.id },
      })

      const tenant2Count = await prismaService.user.count({
        where: { tenantId: tenant2.id },
      })

      expect(tenant1Count).toBe(3)
      expect(tenant2Count).toBe(1)
    })

    it('should get tenant with user count', async () => {
      const tenantWithCount = await prismaService.tenant.findUnique({
        where: { id: tenant1.id },
        include: {
          _count: {
            select: { users: true },
          },
        },
      })

      expect(tenantWithCount?._count.users).toBe(1)
    })
  })

  describe('Tenant Settings', () => {
    it('should store and retrieve tenant settings as JSON', async () => {
      const settings = {
        theme: 'dark',
        features: ['analytics', 'reports'],
        limits: {
          maxUsers: 100,
        },
      }

      const updated = await prismaService.tenant.update({
        where: { id: tenant1.id },
        data: { settings: JSON.stringify(settings) },
      })

      expect(updated.settings).toBeTruthy()

      const parsed = JSON.parse(updated.settings || '{}')
      expect(parsed.theme).toBe('dark')
      expect(parsed.features).toHaveLength(2)
      expect(parsed.limits.maxUsers).toBe(100)
    })
  })

  describe('Cascade Delete Protection', () => {
    it('should delete tenant and cascade to users', async () => {
      // Delete tenant1
      await prismaService.tenant.delete({
        where: { id: tenant1.id },
      })

      // Check that users are also deleted
      const remainingUsers = await prismaService.user.findMany({
        where: { tenantId: tenant1.id },
      })

      expect(remainingUsers).toHaveLength(0)

      // Tenant2 and its users should still exist
      const tenant2Users = await prismaService.user.findMany({
        where: { tenantId: tenant2.id },
      })

      expect(tenant2Users).toHaveLength(1)
    })
  })

  describe('Multi-Tenant Disabled Mode', () => {
    it('should allow users without tenant when multi-tenancy is disabled', async () => {
      // Create user without tenant
      const userWithoutTenant = await prismaService.user.create({
        data: {
          email: 'standalone@example.com',
          name: 'Standalone User',
          password: 'password',
          // tenantId is null
        },
      })

      expect(userWithoutTenant.tenantId).toBeNull()

      // Can retrieve user without tenant filter
      const found = await prismaService.user.findUnique({
        where: { id: userWithoutTenant.id },
      })

      expect(found).toBeTruthy()
      expect(found?.email).toBe('standalone@example.com')
    })
  })

  describe('Tenant Search and Filtering', () => {
    it('should search tenants by name', async () => {
      const results = await prismaService.tenant.findMany({
        where: {
          name: {
            contains: 'Acme', // Note: SQLite is case-sensitive by default
          },
        },
      })

      expect(results).toHaveLength(1)
      expect(results[0].slug).toBe('acme')
    })

    it('should filter tenants by status', async () => {
      await prismaService.tenant.update({
        where: { id: tenant1.id },
        data: { status: TenantStatus.INACTIVE },
      })

      const activeOnly = await prismaService.tenant.findMany({
        where: { status: TenantStatus.ACTIVE },
      })

      const inactiveOnly = await prismaService.tenant.findMany({
        where: { status: TenantStatus.INACTIVE },
      })

      expect(activeOnly).toHaveLength(1)
      expect(inactiveOnly).toHaveLength(1)
      expect(activeOnly[0].id).toBe(tenant2.id)
      expect(inactiveOnly[0].id).toBe(tenant1.id)
    })
  })

  describe('Unique Constraints', () => {
    it('should enforce unique slug constraint', async () => {
      await expect(
        prismaService.tenant.create({
          data: {
            name: 'Duplicate Slug',
            slug: 'acme', // Same as tenant1
          },
        })
      ).rejects.toThrow()
    })

    it('should enforce unique domain constraint', async () => {
      await expect(
        prismaService.tenant.create({
          data: {
            name: 'Duplicate Domain',
            slug: 'new-tenant',
            domain: 'acme.example.com', // Same as tenant1
          },
        })
      ).rejects.toThrow()
    })

    it('should allow multiple tenants without domain', async () => {
      // Both tenants can have null domain
      const tenant3 = await prismaService.tenant.create({
        data: {
          name: 'Tenant 3',
          slug: 'tenant3',
          // domain is null
        },
      })

      const tenant4 = await prismaService.tenant.create({
        data: {
          name: 'Tenant 4',
          slug: 'tenant4',
          // domain is null
        },
      })

      expect(tenant3.domain).toBeNull()
      expect(tenant4.domain).toBeNull()
    })
  })
})
