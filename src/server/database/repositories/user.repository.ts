import { User } from '@prisma/client'
import { Injectable } from '../../decorators'
import { PrismaService } from '../prisma.service'
import { BaseRepository } from './base.repository'

export interface FindUsersOptions {
  search?: string
  page?: number
  limit?: number
}

/**
 * User Repository
 * Handles all database operations for User model
 */
@Injectable()
export class UserRepository extends BaseRepository<User> {
  protected modelName = 'user'

  constructor(prisma: PrismaService) {
    super(prisma)
  }

  /**
   * Find users with search and pagination
   * Note: Search is case-insensitive in SQLite by default for ASCII characters
   */
  async findUsers(options: FindUsersOptions = {}) {
    const { search, page = 1, limit = 10 } = options

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : undefined

    return this.findWithPagination(page, limit, { where })
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email })
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string, excludeId?: number): Promise<boolean> {
    const where: any = { email }
    if (excludeId) {
      where.id = { not: excludeId }
    }
    return this.exists(where)
  }

  /**
   * Find users by age range
   */
  async findByAgeRange(minAge?: number, maxAge?: number): Promise<User[]> {
    const where: any = {
      age: { not: null }, // Always exclude null ages
    }

    if (minAge !== undefined || maxAge !== undefined) {
      if (minAge !== undefined) {
        where.age.gte = minAge
      }
      if (maxAge !== undefined) {
        where.age.lte = maxAge
      }
    }

    return this.findAll({ where })
  }

  /**
   * Get users created after date
   */
  async findCreatedAfter(date: Date): Promise<User[]> {
    return this.findAll({
      where: {
        createdAt: {
          gte: date,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Get user count by age
   */
  async countByAge(age: number): Promise<number> {
    return this.count({ age })
  }

  /**
   * Delete users older than date
   */
  async deleteOlderThan(date: Date): Promise<number> {
    return this.deleteMany({
      createdAt: {
        lt: date,
      },
    })
  }
}
