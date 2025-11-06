import { NextRequest, NextResponse } from 'next/server'
import { ConfigService } from '../../config'

/**
 * Security Headers Middleware
 * Adds various security headers (similar to Helmet.js)
 */
export class SecurityMiddleware {
  constructor(private configService: ConfigService) {}

  /**
   * Apply security headers to response
   */
  apply(request: NextRequest, response: NextResponse): NextResponse {
    const isDevelopment = this.configService.isDevelopment()

    // Content Security Policy
    if (!isDevelopment) {
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: https:; " +
          "font-src 'self' data:; " +
          "connect-src 'self'; " +
          "frame-ancestors 'none';"
      )
    }

    // Strict Transport Security (HTTPS only)
    if (!isDevelopment) {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
      )
    }

    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff')

    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY')

    // XSS Protection (legacy, but still useful)
    response.headers.set('X-XSS-Protection', '1; mode=block')

    // Referrer Policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Permissions Policy (formerly Feature Policy)
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    )

    // Remove X-Powered-By header if present
    response.headers.delete('X-Powered-By')

    // Add custom server header
    response.headers.set('X-DNS-Prefetch-Control', 'off')

    // Cross-Origin policies
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
    response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')

    // Origin Agent Cluster
    response.headers.set('Origin-Agent-Cluster', '?1')

    return response
  }
}
