import { NextRequest, NextResponse } from 'next/server'
import { LoggerService } from '../logger'

/**
 * HTTP Logger Middleware
 * Logs incoming requests and their responses
 */
export class LoggerMiddleware {
  constructor(private logger: LoggerService) {
    this.logger = logger.setContext('HTTP')
  }

  /**
   * Log request
   */
  logRequest(request: NextRequest): void {
    const method = request.method
    const url = request.url
    const userAgent = request.headers.get('user-agent') || 'unknown'

    this.logger.http(`${method} ${url} - User-Agent: ${userAgent}`)
  }

  /**
   * Log response
   */
  logResponse(
    request: NextRequest,
    response: NextResponse,
    duration: number
  ): void {
    const method = request.method
    const url = request.url
    const status = response.status

    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'http'

    this.logger.log(
      level,
      `${method} ${url} ${status} - ${duration}ms`
    )
  }
}
