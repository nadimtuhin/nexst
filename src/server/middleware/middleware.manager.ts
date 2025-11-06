import { NextRequest, NextResponse } from 'next/server'
import { Injectable } from '../decorators'
import { ConfigService } from '../../config'
import { LoggerService } from '../logger'
import { CorsMiddleware } from './cors.middleware'
import { SecurityMiddleware } from './security.middleware'
import { RateLimitMiddleware } from './rate-limit.middleware'
import { LoggerMiddleware } from './logger.middleware'
import { ExceptionFilter } from '../filters'

/**
 * Middleware Manager
 * Orchestrates all middleware execution
 */
@Injectable()
export class MiddlewareManager {
  private corsMiddleware: CorsMiddleware
  private securityMiddleware: SecurityMiddleware
  private rateLimitMiddleware: RateLimitMiddleware
  private loggerMiddleware: LoggerMiddleware

  constructor(
    private configService: ConfigService,
    private logger: LoggerService
  ) {
    this.corsMiddleware = new CorsMiddleware(configService)
    this.securityMiddleware = new SecurityMiddleware(configService)
    this.rateLimitMiddleware = new RateLimitMiddleware(configService)
    this.loggerMiddleware = new LoggerMiddleware(logger)
  }

  /**
   * Execute all pre-processing middleware
   */
  async preProcess(request: NextRequest): Promise<NextResponse | null> {
    try {
      const startTime = Date.now()

      // Log incoming request
      this.loggerMiddleware.logRequest(request)

      // Handle CORS preflight
      const preflightResponse = this.corsMiddleware.handlePreflight(request)
      if (preflightResponse) {
        return preflightResponse
      }

      // Check rate limit
      await this.rateLimitMiddleware.check(request)

      // Store start time for response logging
      ;(request as any)._startTime = startTime

      return null // Continue to route handler
    } catch (error) {
      // Handle middleware errors
      return ExceptionFilter.catch(error)
    }
  }

  /**
   * Execute all post-processing middleware
   */
  postProcess(request: NextRequest, response: NextResponse): NextResponse {
    const startTime = (request as any)._startTime || Date.now()
    const duration = Date.now() - startTime

    // Add CORS headers
    response = this.corsMiddleware.apply(request, response)

    // Add security headers
    response = this.securityMiddleware.apply(request, response)

    // Add rate limit headers
    response = this.rateLimitMiddleware.addHeaders(request, response)

    // Log response
    this.loggerMiddleware.logResponse(request, response, duration)

    return response
  }

  /**
   * Get rate limit middleware (for testing/clearing)
   */
  get rateLimit(): RateLimitMiddleware {
    return this.rateLimitMiddleware
  }
}
