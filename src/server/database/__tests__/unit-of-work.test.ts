import 'reflect-metadata'
import { container } from 'tsyringe'
import { UnitOfWork } from '../unit-of-work'
import { PrismaService } from '../prisma.service'
import { UserRepository } from '../repositories/user.repository'
import { RefreshTokenRepository } from '../repositories/refresh-token.repository'
import { LoggerService } from '../../logger/logger.service'

describe('UnitOfWork', () => {
  let uow: UnitOfWork
  let prisma: PrismaService

  beforeAll(() => {
    if (!container.isRegistered(LoggerService)) container.registerSingleton(LoggerService)
    if (!container.isRegistered(PrismaService)) container.registerSingleton(PrismaService)
    if (!container.isRegistered(UserRepository)) container.registerSingleton(UserRepository)
    if (!container.isRegistered(RefreshTokenRepository)) container.registerSingleton(RefreshTokenRepository)
  })

  beforeEach(async () => {
    prisma = container.resolve(PrismaService)
    uow = container.resolve(UnitOfWork)
    await prisma.onModuleInit()
    await prisma.cleanDatabase()
  })

  afterEach(async () => {
    await prisma.cleanDatabase()
  })

  afterAll(async () => {
    await prisma.onModuleDestroy()
    container.clearInstances()
  })

  it('commits when work succeeds', async () => {
    const user = await uow.execute(async ({ users }) => {
      return users.create({
        email: 'uow@test.com',
        name: 'UoW User',
        password: 'hash',
      })
    })

    expect(user.email).toBe('uow@test.com')
    // Verify persisted outside tx
    const found = await prisma.user.findUnique({ where: { email: 'uow@test.com' } })
    expect(found).not.toBeNull()
  })

  it('rolls back all writes when work throws', async () => {
    await expect(
      uow.execute(async ({ users }) => {
        await users.create({
          email: 'rollback@test.com',
          name: 'Rollback',
          password: 'hash',
        })
        throw new Error('intentional failure')
      })
    ).rejects.toThrow('intentional failure')

    const found = await prisma.user.findUnique({ where: { email: 'rollback@test.com' } })
    expect(found).toBeNull()
  })

  it('commits multiple cross-repo writes atomically', async () => {
    const futureDate = new Date(Date.now() + 86_400_000)

    const result = await uow.execute(async ({ users, refreshTokens }) => {
      const user = await users.create({
        email: 'multi@test.com',
        name: 'Multi',
        password: 'hash',
      })
      const token = await refreshTokens.createToken({
        token: 'tok-abc',
        userId: user.id,
        expiresAt: futureDate,
      })
      return { user, token }
    })

    expect(result.user.email).toBe('multi@test.com')
    expect(result.token.token).toBe('tok-abc')

    const savedToken = await prisma.refreshToken.findUnique({ where: { token: 'tok-abc' } })
    expect(savedToken).not.toBeNull()
  })

  it('withTransaction returns same-type repository bound to tx', async () => {
    const userRepo = container.resolve(UserRepository)
    await uow.execute(async ({ users }) => {
      // The tx-bound repo must still be a UserRepository
      expect(users).toBeInstanceOf(UserRepository)
      expect(typeof users.findByEmail).toBe('function')
      return users.create({ email: 'type@test.com', name: 'T', password: 'h' })
    })
  })
})
