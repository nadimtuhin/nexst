import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  console.log('📝 Clearing existing data...')
  await prisma.user.deleteMany()

  // Create sample users
  console.log('👥 Creating users...')

  const users = [
    {
      email: 'john.doe@example.com',
      name: 'John Doe',
      age: 30,
    },
    {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      age: 25,
    },
    {
      email: 'bob.johnson@example.com',
      name: 'Bob Johnson',
      age: 35,
    },
    {
      email: 'alice.williams@example.com',
      name: 'Alice Williams',
      age: 28,
    },
    {
      email: 'charlie.brown@example.com',
      name: 'Charlie Brown',
      age: 42,
    },
  ]

  for (const user of users) {
    await prisma.user.create({
      data: user,
    })
    console.log(`  ✓ Created user: ${user.name}`)
  }

  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
