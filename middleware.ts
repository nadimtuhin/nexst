import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Middleware for Multi-Tenant Support
 *
 * This middleware runs on every request and validates tenant context
 * when multi-tenancy is enabled.
 *
 * Features:
 * - Validates tenant context for protected routes
 * - Allows public/auth routes to bypass tenant validation
 * - Supports multiple tenant identification methods
 * - Returns appropriate error responses for invalid tenants
 */

// Routes that don't require tenant validation
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/health',
  '/api/ping',
  '/_next',
  '/favicon.ico',
  '/public',
]

// Routes that should always be validated for tenants (when enabled)
const TENANT_PROTECTED_ROUTES = [
  '/api/users',
  '/api/tenants',
  // Add more tenant-specific routes here
]

/**
 * Check if multi-tenancy is enabled
 */
function isMultiTenancyEnabled(): boolean {
  return process.env.MULTI_TENANT_ENABLED === 'true'
}

/**
 * Check if route is public (doesn't require tenant validation)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Check if route requires tenant validation
 */
function requiresTenantValidation(pathname: string): boolean {
  return TENANT_PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Extract tenant identifier from request
 * Supports multiple methods:
 * 1. X-Tenant-ID header (numeric ID)
 * 2. X-Tenant-Slug header (string slug)
 * 3. Subdomain extraction from host
 */
function extractTenantIdentifier(request: NextRequest): string | null {
  // Method 1: X-Tenant-ID header
  const tenantId = request.headers.get('x-tenant-id')
  if (tenantId) {
    return tenantId
  }

  // Method 2: X-Tenant-Slug header
  const tenantSlug = request.headers.get('x-tenant-slug')
  if (tenantSlug) {
    return tenantSlug
  }

  // Method 3: Subdomain extraction
  const host = request.headers.get('host')
  if (host) {
    const subdomain = extractSubdomain(host)
    if (subdomain) {
      return subdomain
    }
  }

  return null
}

/**
 * Extract subdomain from host header
 * Examples:
 * - "acme.example.com" → "acme"
 * - "localhost:3000" → null
 * - "example.com" → null
 */
function extractSubdomain(host: string): string | null {
  // Remove port if present
  const hostname = host.split(':')[0]

  // Split by dots
  const parts = hostname.split('.')

  // Need at least 3 parts for a subdomain (subdomain.domain.tld)
  if (parts.length < 3) {
    return null
  }

  // Get the first part as subdomain
  const subdomain = parts[0]

  // Ignore common non-tenant subdomains
  const ignoredSubdomains = ['www', 'api', 'admin', 'localhost']
  if (ignoredSubdomains.includes(subdomain)) {
    return null
  }

  // Ignore IP addresses
  if (/^\d+$/.test(subdomain)) {
    return null
  }

  return subdomain
}

/**
 * Main middleware function
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // If multi-tenancy is disabled, allow all requests
  if (!isMultiTenancyEnabled()) {
    return NextResponse.next()
  }

  // For tenant-protected routes, validate tenant context
  if (requiresTenantValidation(pathname)) {
    const tenantIdentifier = extractTenantIdentifier(request)

    if (!tenantIdentifier) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Tenant context required. Provide X-Tenant-ID header, X-Tenant-Slug header, or use a tenant subdomain.',
          statusCode: 401,
        },
        { status: 401 }
      )
    }

    // Add tenant identifier to headers for downstream processing
    // The TenantGuard will validate the actual tenant exists and is active
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-middleware-tenant-id', tenantIdentifier)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // For other routes, allow through (TenantGuard will handle validation if needed)
  return NextResponse.next()
}

/**
 * Configure which routes this middleware runs on
 * We want it to run on all API routes except public ones
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
