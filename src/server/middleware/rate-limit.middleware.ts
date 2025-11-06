import { NextRequest, NextResponse } from 'next/server'
import { ConfigService } from '../../config'
import { TooManyRequestsException } from '../filters'

interface RateLimitRecord {
  count: number
  resetTime: number
}

/**
 * Rate Limiting Middleware
 * Implements token bucket algorithm with in-memory storage
 */
export class RateLimitMiddleware {
  private store: Map<string, RateLimitRecord> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor(private configService: ConfigService) {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  /**
   * Check if request should be rate limited
   */
  async check(request: NextRequest): Promise<void> {
    const config = this.configService.rateLimit
    const key = this.getKey(request)
    const now = Date.now()

    let record = this.store.get(key)

    // Initialize or reset if expired
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + config.ttl * 1000,
      }
      this.store.set(key, record)
    }

    // Increment counter
    record.count++

    // Check if limit exceeded
    if (record.count > config.max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000)
      throw new TooManyRequestsException(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        {
          limit: config.max,
          remaining: 0,
          reset: record.resetTime,
          retryAfter,
        }
      )
    }
  }

  /**
   * Add rate limit headers to response
   */
  addHeaders(request: NextRequest, response: NextResponse): NextResponse {
    const config = this.configService.rateLimit
    const key = this.getKey(request)
    const record = this.store.get(key)

    if (record) {
      const remaining = Math.max(0, config.max - record.count)
      const reset = Math.ceil(record.resetTime / 1000)

      response.headers.set('X-RateLimit-Limit', config.max.toString())
      response.headers.set('X-RateLimit-Remaining', remaining.toString())
      response.headers.set('X-RateLimit-Reset', reset.toString())
    }

    return response
  }

  /**
   * Get rate limit key from request (IP address)
   */
  private getKey(request: NextRequest): string {
    // Try to get real IP from headers (for proxies/load balancers)
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')

    let ip = forwarded?.split(',')[0].trim() || realIp || 'unknown'

    // Fallback to URL if IP not available (for testing)
    if (ip === 'unknown') {
      ip = request.url
    }

    return `rate-limit:${ip}`
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key)
      }
    }
  }

  /**
   * Clear all rate limit records (for testing)
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Destroy middleware and cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}
