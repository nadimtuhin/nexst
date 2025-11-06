import { PrismaService } from '../prisma.service'

export interface FindOptions {
  skip?: number
  take?: number
  orderBy?: any
  where?: any
  include?: any
}

export interface PaginationResult<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

/**
 * Base Repository
 * Provides common CRUD operations for all repositories
 */
export abstract class BaseRepository<T> {
  protected abstract modelName: string

  constructor(protected prisma: PrismaService) {}

  /**
   * Get Prisma model delegate
   */
  protected get model(): any {
    return (this.prisma as any)[this.modelName]
  }

  /**
   * Find all records
   */
  async findAll(options?: FindOptions): Promise<T[]> {
    return this.model.findMany(options)
  }

  /**
   * Find with pagination
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    options?: Omit<FindOptions, 'skip' | 'take'>
  ): Promise<PaginationResult<T>> {
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      this.model.findMany({
        ...options,
        skip,
        take: limit,
      }),
      this.model.count({ where: options?.where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    }
  }

  /**
   * Find one by ID
   */
  async findById(id: number | string): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
    })
  }

  /**
   * Find one by criteria
   */
  async findOne(where: any): Promise<T | null> {
    return this.model.findFirst({ where })
  }

  /**
   * Create a new record
   */
  async create(data: any): Promise<T> {
    return this.model.create({ data })
  }

  /**
   * Create many records
   */
  async createMany(data: any[]): Promise<number> {
    const result = await this.model.createMany({ data })
    return result.count
  }

  /**
   * Update a record
   */
  async update(id: number | string, data: any): Promise<T> {
    return this.model.update({
      where: { id },
      data,
    })
  }

  /**
   * Delete a record
   */
  async delete(id: number | string): Promise<T> {
    return this.model.delete({
      where: { id },
    })
  }

  /**
   * Count records
   */
  async count(where?: any): Promise<number> {
    return this.model.count({ where })
  }

  /**
   * Check if record exists
   */
  async exists(where: any): Promise<boolean> {
    const count = await this.count(where)
    return count > 0
  }

  /**
   * Find or create
   */
  async findOrCreate(where: any, create: any): Promise<T> {
    const existing = await this.findOne(where)
    if (existing) {
      return existing
    }
    return this.create(create)
  }

  /**
   * Update or create (upsert)
   */
  async upsert(where: any, create: any, update: any): Promise<T> {
    return this.model.upsert({
      where,
      create,
      update,
    })
  }

  /**
   * Delete many records
   */
  async deleteMany(where: any): Promise<number> {
    const result = await this.model.deleteMany({ where })
    return result.count
  }

  /**
   * Update many records
   */
  async updateMany(where: any, data: any): Promise<number> {
    const result = await this.model.updateMany({ where, data })
    return result.count
  }
}
