import { PrismaClient, UserRole } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  console.log('📝 Clearing existing data...')
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()

  // Default password for all seed users (for development only!)
  const defaultPassword = 'Password123!'
  const hashedPassword = await bcrypt.hash(defaultPassword, 10)

  console.log(`📢 Default password for all users: ${defaultPassword}`)

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
    },
    {
      email: 'moderator@example.com',
      name: 'Moderator User',
      password: hashedPassword,
      age: 30,
      role: UserRole.MODERATOR,
      isActive: true,
    },
    {
      email: 'john.doe@example.com',
      name: 'John Doe',
      password: hashedPassword,
      age: 30,
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      password: hashedPassword,
      age: 25,
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: 'bob.johnson@example.com',
      name: 'Bob Johnson',
      password: hashedPassword,
      age: 35,
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: 'alice.williams@example.com',
      name: 'Alice Williams',
      password: hashedPassword,
      age: 28,
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: 'charlie.brown@example.com',
      name: 'Charlie Brown',
      password: hashedPassword,
      age: 42,
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: 'inactive@example.com',
      name: 'Inactive User',
      password: hashedPassword,
      age: 40,
      role: UserRole.USER,
      isActive: false,
    },
  ]

  for (const user of users) {
    await prisma.user.create({
      data: user,
    })
    console.log(`  ✓ Created ${user.role} user: ${user.name} (${user.email})`)
  }

  console.log('\n✅ Seeding complete!')
  console.log('\n📋 Test Accounts:')
  console.log(`  Admin:     admin@example.com`)
  console.log(`  Moderator: moderator@example.com`)
  console.log(`  User:      john.doe@example.com`)
  console.log(`  Password:  ${defaultPassword}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
