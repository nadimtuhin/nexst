import { Injectable } from '../decorators'
import { PrismaService } from './prisma.service'
import { UserRepository } from './repositories/user.repository'
import { RefreshTokenRepository } from './repositories/refresh-token.repository'
import { TransactionClient } from './repositories/base.repository'

/**
 * UnitOfWork
 *
 * Wraps a Prisma interactive transaction so multiple repositories share one
 * atomic DB round-trip.
 *
 * Usage:
 *   const result = await uow.execute(async ({ users, refreshTokens }) => {
 *     const user = await users.create(data)
 *     await refreshTokens.createToken({ ... })
 *     return user
 *   })
 */

export interface UnitOfWorkContext {
  users: UserRepository
  refreshTokens: RefreshTokenRepository
}

@Injectable()
export class UnitOfWork {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository
  ) {}

  /**
   * Run `work` inside a Prisma $transaction.
   * Repositories available in `ctx` are bound to the transaction client.
   * If `work` throws, the transaction is rolled back automatically.
   */
  async execute<T>(
    work: (ctx: UnitOfWorkContext) => Promise<T>,
    options?: Parameters<PrismaService['$transaction']>[1]
  ): Promise<T> {
    return this.prisma.$transaction(async (tx: TransactionClient) => {
      const ctx: UnitOfWorkContext = {
        users: this.userRepository.withTransaction(tx),
        refreshTokens: this.refreshTokenRepository.withTransaction(tx),
      }
      return work(ctx)
    }, options)
  }
}
