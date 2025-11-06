import { NextRequest, NextResponse } from 'next/server'
import { ConfigService } from '../../config'

/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing headers
 */
export class CorsMiddleware {
  constructor(private configService: ConfigService) {}

  /**
   * Apply CORS headers to response
   */
  apply(request: NextRequest, response: NextResponse): NextResponse {
    const config = this.configService.cors

    // Get origin from request
    const requestOrigin = request.headers.get('origin') || ''

    // Determine if origin is allowed
    const allowedOrigin = this.isOriginAllowed(requestOrigin, config.origin)

    if (allowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    }

    // Allow credentials if configured
    if (config.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, PATCH, OPTIONS'
      )
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With, X-API-Key'
      )
      response.headers.set('Access-Control-Max-Age', '86400') // 24 hours
    }

    return response
  }

  /**
   * Check if origin is allowed
   */
  private isOriginAllowed(
    origin: string,
    allowed: string | string[]
  ): string | null {
    if (allowed === '*') {
      return '*'
    }

    if (Array.isArray(allowed)) {
      return allowed.includes(origin) ? origin : null
    }

    return allowed === origin ? origin : null
  }

  /**
   * Handle OPTIONS preflight request
   */
  handlePreflight(request: NextRequest): NextResponse | null {
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 })
      return this.apply(request, response)
    }
    return null
  }
}
