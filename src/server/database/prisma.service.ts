import { PrismaClient } from '@prisma/client'
import { Injectable } from '../decorators'
import { LoggerService } from '../logger'

/**
 * Prisma Service
 * Provides singleton Prisma Client instance with connection management
 */
@Injectable()
export class PrismaService extends PrismaClient {
  private logger: LoggerService

  constructor(logger: LoggerService) {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    })

    this.logger = logger.setContext('PrismaService')

    // Log database queries in development
    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as any, (e: any) => {
        this.logger.debug(`Query: ${e.query}`)
        this.logger.debug(`Duration: ${e.duration}ms`)
      })
    }

    // Log errors
    this.$on('error' as any, (e: any) => {
      this.logger.error(`Prisma Error: ${e.message}`, e.stack)
    })

    // Log warnings
    this.$on('warn' as any, (e: any) => {
      this.logger.warn(`Prisma Warning: ${e.message}`)
    })

    this.logger.info('Prisma Client initialized')
  }

  /**
   * Connect to database
   */
  async onModuleInit() {
    await this.$connect()
    this.logger.info('Database connected successfully')
  }

  /**
   * Disconnect from database
   */
  async onModuleDestroy() {
    await this.$disconnect()
    this.logger.info('Database disconnected')
  }

  /**
   * Clean database (for testing)
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase can only be called in test environment')
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => key[0] !== '_' && key[0] !== '$'
    )

    return Promise.all(
      models.map((modelKey) => {
        const model = (this as any)[modelKey]
        if (model && typeof model.deleteMany === 'function') {
          return model.deleteMany()
        }
      })
    )
  }
}
