import { PrismaClient, UserRole, TenantStatus } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// Check if multi-tenancy is enabled
const isMultiTenantEnabled = process.env.MULTI_TENANT_ENABLED === 'true'

async function main() {
  console.log('🌱 Seeding database...')

  if (isMultiTenantEnabled) {
    console.log('🏢 Multi-tenancy is ENABLED')
  } else {
    console.log('🏢 Multi-tenancy is DISABLED')
  }

  // Clear existing data
  console.log('📝 Clearing existing data...')
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.tenant.deleteMany()

  // Default password for all seed users (for development only!)
  const defaultPassword = 'Password123!'
  const hashedPassword = await bcrypt.hash(defaultPassword, 10)

  console.log(`📢 Default password for all users: ${defaultPassword}`)

  // Create tenants if multi-tenancy is enabled
  let tenantIds: { [key: string]: number } = {}

  if (isMultiTenantEnabled) {
    console.log('🏢 Creating tenants...')

    const acme = await prisma.tenant.create({
      data: {
        name: 'Acme Corporation',
        slug: 'acme',
        domain: 'acme.example.com',
        status: TenantStatus.ACTIVE,
        settings: JSON.stringify({ theme: 'blue', features: ['analytics', 'reports'] }),
      },
    })
    tenantIds['acme'] = acme.id
    console.log(`  ✓ Created tenant: ${acme.name} (${acme.slug})`)

    const techstart = await prisma.tenant.create({
      data: {
        name: 'TechStart Inc',
        slug: 'techstart',
        domain: 'techstart.example.com',
        status: TenantStatus.ACTIVE,
        settings: JSON.stringify({ theme: 'green', features: ['analytics'] }),
      },
    })
    tenantIds['techstart'] = techstart.id
    console.log(`  ✓ Created tenant: ${techstart.name} (${techstart.slug})`)

    const global = await prisma.tenant.create({
      data: {
        name: 'Global Services Ltd',
        slug: 'global',
        domain: 'global.example.com',
        status: TenantStatus.ACTIVE,
        settings: JSON.stringify({ theme: 'purple', features: ['analytics', 'reports', 'export'] }),
      },
    })
    tenantIds['global'] = global.id
    console.log(`  ✓ Created tenant: ${global.name} (${global.slug})`)

    const suspended = await prisma.tenant.create({
      data: {
        name: 'Suspended Company',
        slug: 'suspended',
        domain: 'suspended.example.com',
        status: TenantStatus.SUSPENDED,
        settings: JSON.stringify({ theme: 'red' }),
      },
    })
    tenantIds['suspended'] = suspended.id
    console.log(`  ✓ Created tenant: ${suspended.name} (${suspended.slug}) - SUSPENDED`)

    console.log('')
  }

  // Create sample users
  console.log('👥 Creating users...')

  const users = [
    {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      age: 35,
      role: UserRole.ADMIN,
      isActive: true,
      tenantId: isMultiTenantEnabled ? tenantIds['acme'] : null,
    },
    {
      email: 'moderator@example.com',
      name: 'Moderator User',
      password: hashedPassword,
      age: 30,
      role: UserRole.MODERATOR,
      isActive: true,
      tenantId: isMultiTenantEnabled ? tenantIds['acme'] : null,
    },
    {
      email: 'john.doe@example.com',
      name: 'John Doe',
      password: hashedPassword,
      age: 30,
      role: UserRole.USER,
      isActive: true,
      tenantId: isMultiTenantEnabled ? tenantIds['acme'] : null,
    },
    {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      password: hashedPassword,
      age: 25,
      role: UserRole.USER,
      isActive: true,
      tenantId: isMultiTenantEnabled ? tenantIds['techstart'] : null,
    },
    {
      email: 'bob.johnson@example.com',
      name: 'Bob Johnson',
      password: hashedPassword,
      age: 35,
      role: UserRole.USER,
      isActive: true,
      tenantId: isMultiTenantEnabled ? tenantIds['techstart'] : null,
    },
    {
      email: 'alice.williams@example.com',
      name: 'Alice Williams',
      password: hashedPassword,
      age: 28,
      role: UserRole.USER,
      isActive: true,
      tenantId: isMultiTenantEnabled ? tenantIds['global'] : null,
    },
    {
      email: 'charlie.brown@example.com',
      name: 'Charlie Brown',
      password: hashedPassword,
      age: 42,
      role: UserRole.USER,
      isActive: true,
      tenantId: isMultiTenantEnabled ? tenantIds['global'] : null,
    },
    {
      email: 'inactive@example.com',
      name: 'Inactive User',
      password: hashedPassword,
      age: 40,
      role: UserRole.USER,
      isActive: false,
      tenantId: isMultiTenantEnabled ? tenantIds['suspended'] : null,
    },
  ]

  for (const user of users) {
    await prisma.user.create({
      data: user,
    })
    const tenantInfo = user.tenantId ? ` [Tenant: ${Object.keys(tenantIds).find(key => tenantIds[key] === user.tenantId)}]` : ''
    console.log(`  ✓ Created ${user.role} user: ${user.name} (${user.email})${tenantInfo}`)
  }

  console.log('\n✅ Seeding complete!')
  console.log('\n📋 Test Accounts:')
  console.log(`  Admin:     admin@example.com`)
  console.log(`  Moderator: moderator@example.com`)
  console.log(`  User:      john.doe@example.com`)
  console.log(`  Password:  ${defaultPassword}`)

  if (isMultiTenantEnabled) {
    console.log('\n🏢 Tenant Summary:')
    console.log(`  Acme Corporation (acme.example.com): 3 users`)
    console.log(`  TechStart Inc (techstart.example.com): 2 users`)
    console.log(`  Global Services Ltd (global.example.com): 2 users`)
    console.log(`  Suspended Company (suspended.example.com): 1 user (SUSPENDED)`)
    console.log('\n💡 Use X-Tenant-ID, X-Tenant-Slug headers or subdomain to access tenant-specific data')
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
