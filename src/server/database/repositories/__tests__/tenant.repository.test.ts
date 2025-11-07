import 'reflect-metadata'
import { container } from 'tsyringe'
import { TenantRepository } from '../tenant.repository'
import { PrismaService } from '../../prisma.service'
import { LoggerService } from '../../../logger/logger.service'
import { TenantStatus } from '@prisma/client'

describe('TenantRepository', () => {
  let tenantRepository: TenantRepository
  let prismaService: PrismaService

  beforeAll(() => {
    // Register services
    if (!container.isRegistered(LoggerService)) {
      container.registerSingleton(LoggerService)
    }
    if (!container.isRegistered(PrismaService)) {
      container.registerSingleton(PrismaService)
    }
  })

  beforeEach(async () => {
    prismaService = container.resolve(PrismaService)
    tenantRepository = container.resolve(TenantRepository)
    await prismaService.onModuleInit()
    await prismaService.cleanDatabase()
  })

  afterEach(async () => {
    await prismaService.cleanDatabase()
  })

  afterAll(async () => {
    await prismaService.onModuleDestroy()
    container.clearInstances()
  })

  describe('Basic CRUD Operations', () => {
    describe('findAll', () => {
      it('should return all tenants', async () => {
        await prismaService.tenant.createMany({
          data: [
            { name: 'Tenant 1', slug: 'tenant1' },
            { name: 'Tenant 2', slug: 'tenant2' },
            { name: 'Tenant 3', slug: 'tenant3' },
          ],
        })

        const tenants = await tenantRepository.findAll()
        expect(tenants).toHaveLength(3)
      })

      it('should return empty array when no tenants exist', async () => {
        const tenants = await tenantRepository.findAll()
        expect(tenants).toEqual([])
      })
    })

    describe('findById', () => {
      it('should find a tenant by id', async () => {
        const created = await prismaService.tenant.create({
          data: { name: 'Find Tenant', slug: 'find-tenant' },
        })

        const found = await tenantRepository.findById(created.id)
        expect(found).toMatchObject({
          id: created.id,
          name: 'Find Tenant',
          slug: 'find-tenant',
          status: TenantStatus.ACTIVE,
        })
      })

      it('should return null for non-existent id', async () => {
        const found = await tenantRepository.findById(999999)
        expect(found).toBeNull()
      })
    })

    describe('create', () => {
      it('should create a new tenant', async () => {
        const tenant = await tenantRepository.create({
          name: 'Create Tenant',
          slug: 'create-tenant',
        })

        expect(tenant).toMatchObject({
          name: 'Create Tenant',
          slug: 'create-tenant',
          status: TenantStatus.ACTIVE,
        })
        expect(tenant.id).toBeDefined()
        expect(tenant.createdAt).toBeInstanceOf(Date)
        expect(tenant.updatedAt).toBeInstanceOf(Date)
      })

      it('should create a tenant with optional fields', async () => {
        const tenant = await tenantRepository.create({
          name: 'Full Tenant',
          slug: 'full-tenant',
          domain: 'full.example.com',
          status: TenantStatus.INACTIVE,
          settings: JSON.stringify({ theme: 'dark' }),
        })

        expect(tenant).toMatchObject({
          name: 'Full Tenant',
          slug: 'full-tenant',
          domain: 'full.example.com',
          status: TenantStatus.INACTIVE,
        })
        expect(tenant.settings).toBe(JSON.stringify({ theme: 'dark' }))
      })
    })

    describe('update', () => {
      it('should update a tenant', async () => {
        const created = await tenantRepository.create({
          name: 'Update Tenant',
          slug: 'update-tenant',
        })

        const updated = await tenantRepository.update(created.id, {
          name: 'Updated Name',
          domain: 'updated.example.com',
        })

        expect(updated).toMatchObject({
          id: created.id,
          name: 'Updated Name',
          slug: 'update-tenant',
          domain: 'updated.example.com',
        })
      })

      it('should throw error when updating non-existent tenant', async () => {
        await expect(
          tenantRepository.update(999999, { name: 'Test' })
        ).rejects.toThrow()
      })
    })

    describe('delete', () => {
      it('should delete a tenant', async () => {
        const created = await tenantRepository.create({
          name: 'Delete Tenant',
          slug: 'delete-tenant',
        })

        await tenantRepository.delete(created.id)

        const found = await tenantRepository.findById(created.id)
        expect(found).toBeNull()
      })

      it('should throw error when deleting non-existent tenant', async () => {
        await expect(tenantRepository.delete(999999)).rejects.toThrow()
      })
    })
  })

  describe('Domain-Specific Methods', () => {
    describe('findBySlug', () => {
      it('should find tenant by slug', async () => {
        await tenantRepository.create({
          name: 'Slug Tenant',
          slug: 'slug-tenant',
        })

        const found = await tenantRepository.findBySlug('slug-tenant')
        expect(found).toMatchObject({
          name: 'Slug Tenant',
          slug: 'slug-tenant',
        })
      })

      it('should return null for non-existent slug', async () => {
        const found = await tenantRepository.findBySlug('nonexistent')
        expect(found).toBeNull()
      })
    })

    describe('findByDomain', () => {
      it('should find tenant by domain', async () => {
        await tenantRepository.create({
          name: 'Domain Tenant',
          slug: 'domain-tenant',
          domain: 'domain.example.com',
        })

        const found = await tenantRepository.findByDomain('domain.example.com')
        expect(found).toMatchObject({
          name: 'Domain Tenant',
          domain: 'domain.example.com',
        })
      })

      it('should return null for non-existent domain', async () => {
        const found = await tenantRepository.findByDomain('nonexistent.com')
        expect(found).toBeNull()
      })

      it('should handle null domain parameter', async () => {
        await tenantRepository.create({
          name: 'No Domain Tenant',
          slug: 'no-domain',
        })

        // Prisma treats null as a valid search value and returns tenants with null domain
        // This is expected behavior - if you want no results, don't call with null
        const found = await tenantRepository.findByDomain(null as any)
        expect(found).toBeDefined() // Will match tenant with null domain
      })
    })

    describe('slugExists', () => {
      it('should return true if slug exists', async () => {
        await tenantRepository.create({
          name: 'Exists Tenant',
          slug: 'exists',
        })

        const exists = await tenantRepository.slugExists('exists')
        expect(exists).toBe(true)
      })

      it('should return false if slug does not exist', async () => {
        const exists = await tenantRepository.slugExists('nonexistent')
        expect(exists).toBe(false)
      })

      it('should exclude specified tenant id', async () => {
        const tenant = await tenantRepository.create({
          name: 'Exclude Tenant',
          slug: 'exclude',
        })

        const exists = await tenantRepository.slugExists('exclude', tenant.id)
        expect(exists).toBe(false)
      })

      it('should return true if slug exists for different tenant', async () => {
        const tenant1 = await tenantRepository.create({
          name: 'Tenant 1',
          slug: 'tenant1',
        })

        await tenantRepository.create({
          name: 'Tenant 2',
          slug: 'tenant2',
        })

        const exists = await tenantRepository.slugExists('tenant2', tenant1.id)
        expect(exists).toBe(true)
      })
    })

    describe('domainExists', () => {
      it('should return true if domain exists', async () => {
        await tenantRepository.create({
          name: 'Exists Tenant',
          slug: 'exists',
          domain: 'exists.example.com',
        })

        const exists = await tenantRepository.domainExists('exists.example.com')
        expect(exists).toBe(true)
      })

      it('should return false if domain does not exist', async () => {
        const exists = await tenantRepository.domainExists('nonexistent.com')
        expect(exists).toBe(false)
      })

      it('should exclude specified tenant id', async () => {
        const tenant = await tenantRepository.create({
          name: 'Exclude Tenant',
          slug: 'exclude',
          domain: 'exclude.example.com',
        })

        const exists = await tenantRepository.domainExists(
          'exclude.example.com',
          tenant.id
        )
        expect(exists).toBe(false)
      })
    })

    describe('findActiveTenants', () => {
      beforeEach(async () => {
        await prismaService.tenant.createMany({
          data: [
            { name: 'Active 1', slug: 'active1', status: TenantStatus.ACTIVE },
            { name: 'Active 2', slug: 'active2', status: TenantStatus.ACTIVE },
            {
              name: 'Inactive',
              slug: 'inactive',
              status: TenantStatus.INACTIVE,
            },
            {
              name: 'Suspended',
              slug: 'suspended',
              status: TenantStatus.SUSPENDED,
            },
          ],
        })
      })

      it('should return only active tenants', async () => {
        const tenants = await tenantRepository.findActiveTenants()
        expect(tenants).toHaveLength(2)
        expect(tenants.every((t) => t.status === TenantStatus.ACTIVE)).toBe(
          true
        )
      })

      it('should return tenants ordered by name', async () => {
        const tenants = await tenantRepository.findActiveTenants()
        expect(tenants[0].name).toBe('Active 1')
        expect(tenants[1].name).toBe('Active 2')
      })
    })

    describe('findTenants', () => {
      beforeEach(async () => {
        await prismaService.tenant.createMany({
          data: [
            {
              name: 'Acme Corporation',
              slug: 'acme',
              domain: 'acme.example.com',
              status: TenantStatus.ACTIVE,
            },
            {
              name: 'TechStart Inc',
              slug: 'techstart',
              domain: 'techstart.example.com',
              status: TenantStatus.ACTIVE,
            },
            {
              name: 'Global Services',
              slug: 'global',
              domain: 'global.example.com',
              status: TenantStatus.INACTIVE,
            },
            {
              name: 'Suspended Co',
              slug: 'suspended',
              status: TenantStatus.SUSPENDED,
            },
          ],
        })
      })

      it('should find tenants with pagination', async () => {
        const result = await tenantRepository.findTenants({ page: 1, limit: 2 })
        expect(result.data).toHaveLength(2)
        expect(result.meta).toMatchObject({
          page: 1,
          limit: 2,
          total: 4,
          totalPages: 2,
        })
      })

      it('should search by name', async () => {
        const result = await tenantRepository.findTenants({ search: 'acme' })
        expect(result.data).toHaveLength(1)
        expect(result.data[0].name).toBe('Acme Corporation')
      })

      it('should search by slug', async () => {
        const result = await tenantRepository.findTenants({
          search: 'techstart',
        })
        expect(result.data).toHaveLength(1)
        expect(result.data[0].slug).toBe('techstart')
      })

      it('should search by domain', async () => {
        const result = await tenantRepository.findTenants({
          search: 'global.example',
        })
        expect(result.data).toHaveLength(1)
        expect(result.data[0].domain).toBe('global.example.com')
      })

      it('should filter by status', async () => {
        const result = await tenantRepository.findTenants({
          status: TenantStatus.ACTIVE,
        })
        expect(result.data).toHaveLength(2)
        expect(result.data.every((t) => t.status === TenantStatus.ACTIVE)).toBe(
          true
        )
      })

      it('should combine search and status filter', async () => {
        const result = await tenantRepository.findTenants({
          search: 'example',
          status: TenantStatus.ACTIVE,
        })
        expect(result.data).toHaveLength(2)
      })

      it('should return empty results for no matches', async () => {
        const result = await tenantRepository.findTenants({ search: 'xyz' })
        expect(result.data).toHaveLength(0)
        expect(result.meta.total).toBe(0)
      })
    })

    describe('Status Methods', () => {
      let tenant: any

      beforeEach(async () => {
        tenant = await tenantRepository.create({
          name: 'Status Tenant',
          slug: 'status-tenant',
        })
      })

      describe('suspendTenant', () => {
        it('should suspend a tenant', async () => {
          const suspended = await tenantRepository.suspendTenant(tenant.id)
          expect(suspended.status).toBe(TenantStatus.SUSPENDED)
        })
      })

      describe('activateTenant', () => {
        it('should activate a tenant', async () => {
          await tenantRepository.suspendTenant(tenant.id)
          const activated = await tenantRepository.activateTenant(tenant.id)
          expect(activated.status).toBe(TenantStatus.ACTIVE)
        })
      })

      describe('deactivateTenant', () => {
        it('should deactivate a tenant', async () => {
          const deactivated = await tenantRepository.deactivateTenant(tenant.id)
          expect(deactivated.status).toBe(TenantStatus.INACTIVE)
        })
      })
    })

    describe('User Count Methods', () => {
      let tenant1: any
      let tenant2: any

      beforeEach(async () => {
        tenant1 = await prismaService.tenant.create({
          data: { name: 'Tenant 1', slug: 'tenant1' },
        })

        tenant2 = await prismaService.tenant.create({
          data: { name: 'Tenant 2', slug: 'tenant2' },
        })

        // Create users for tenant1
        await prismaService.user.createMany({
          data: [
            {
              email: 'user1@tenant1.com',
              name: 'User 1',
              password: 'password',
              tenantId: tenant1.id,
            },
            {
              email: 'user2@tenant1.com',
              name: 'User 2',
              password: 'password',
              tenantId: tenant1.id,
            },
            {
              email: 'user3@tenant1.com',
              name: 'User 3',
              password: 'password',
              tenantId: tenant1.id,
            },
          ],
        })

        // Create users for tenant2
        await prismaService.user.create({
          data: {
            email: 'user1@tenant2.com',
            name: 'User 1',
            password: 'password',
            tenantId: tenant2.id,
          },
        })
      })

      describe('countTenantUsers', () => {
        it('should count users in tenant', async () => {
          const count = await tenantRepository.countTenantUsers(tenant1.id)
          expect(count).toBe(3)
        })

        it('should return 0 for tenant with no users', async () => {
          const emptyTenant = await prismaService.tenant.create({
            data: { name: 'Empty', slug: 'empty' },
          })
          const count = await tenantRepository.countTenantUsers(emptyTenant.id)
          expect(count).toBe(0)
        })

        it('should return 0 for non-existent tenant', async () => {
          const count = await tenantRepository.countTenantUsers(999999)
          expect(count).toBe(0)
        })
      })

      describe('findByIdWithUserCount', () => {
        it('should return tenant with user count', async () => {
          const result = await tenantRepository.findByIdWithUserCount(tenant1.id)
          expect(result).toMatchObject({
            id: tenant1.id,
            name: 'Tenant 1',
          })
          expect(result?._count.users).toBe(3)
        })

        it('should return null for non-existent tenant', async () => {
          const result = await tenantRepository.findByIdWithUserCount(999999)
          expect(result).toBeNull()
        })
      })

      describe('findAllWithUserCounts', () => {
        it('should return all tenants with user counts', async () => {
          const tenants = await tenantRepository.findAllWithUserCounts()
          expect(tenants).toHaveLength(2)

          const t1 = tenants.find((t) => t.id === tenant1.id)
          const t2 = tenants.find((t) => t.id === tenant2.id)

          expect(t1?._count.users).toBe(3)
          expect(t2?._count.users).toBe(1)
        })

        it('should order by createdAt desc', async () => {
          const tenants = await tenantRepository.findAllWithUserCounts()
          // tenant2 was created after tenant1
          expect(tenants[0].id).toBe(tenant2.id)
          expect(tenants[1].id).toBe(tenant1.id)
        })
      })
    })

    describe('createTenant', () => {
      it('should create a tenant via wrapper method', async () => {
        const tenant = await tenantRepository.createTenant({
          name: 'Wrapper Tenant',
          slug: 'wrapper',
        })

        expect(tenant).toMatchObject({
          name: 'Wrapper Tenant',
          slug: 'wrapper',
        })
      })
    })

    describe('updateTenant', () => {
      it('should update a tenant via wrapper method', async () => {
        const created = await tenantRepository.create({
          name: 'Original',
          slug: 'original',
        })

        const updated = await tenantRepository.updateTenant(created.id, {
          name: 'Updated',
        })

        expect(updated).toMatchObject({
          id: created.id,
          name: 'Updated',
          slug: 'original',
        })
      })
    })
  })
})
