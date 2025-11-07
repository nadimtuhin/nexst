# Multi-Tenancy Guide

This guide covers the multi-tenant features available in this Next.js boilerplate.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Setup](#setup)
- [Tenant Identification](#tenant-identification)
- [API Reference](#api-reference)
- [Code Examples](#code-examples)
- [Testing](#testing)
- [Security Considerations](#security-considerations)
- [Best Practices](#best-practices)

## Overview

Multi-tenancy allows a single instance of the application to serve multiple tenants (organizations, companies, or workspaces), each with isolated data and optional custom settings. This implementation provides optional multi-tenant support that can be toggled via environment configuration.

### Key Characteristics

- **Optional**: Multi-tenancy can be enabled or disabled via `MULTI_TENANT_ENABLED` environment variable
- **Database-level isolation**: Each tenant's data is isolated using tenant IDs
- **Flexible identification**: Supports tenant identification via headers or subdomain
- **Status management**: Tenants can be ACTIVE, INACTIVE, or SUSPENDED
- **JWT integration**: Tenant context is included in authentication tokens

## Features

### Tenant Management

- Create, read, update, and delete tenants
- Suspend, activate, and deactivate tenants
- Custom settings per tenant (stored as JSON)
- Domain and slug-based tenant identification
- User count tracking per tenant

### Data Isolation

- All users are associated with a tenant (optional)
- Refresh tokens include tenant context
- Authentication tokens include tenant ID
- TenantGuard validates tenant access on protected routes

### Flexible Configuration

- Feature toggle via environment variable
- Multiple tenant identification methods
- Configurable tenant statuses
- Custom tenant settings support

## Architecture

### Database Schema

```prisma
enum TenantStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

model Tenant {
  id        Int          @id @default(autoincrement())
  name      String
  slug      String       @unique
  domain    String?      @unique
  status    TenantStatus @default(ACTIVE)
  settings  String?      // JSON string
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  users         User[]
  refreshTokens RefreshToken[]
}

model User {
  // ... other fields
  tenantId  Int?
  tenant    Tenant? @relation(fields: [tenantId], references: [id])
}
```

### Service Layer

```
┌─────────────────┐
│ TenantController│  ← REST API endpoints
└────────┬────────┘
         │
┌────────▼────────┐
│  TenantService  │  ← Business logic & validation
└────────┬────────┘
         │
┌────────▼────────────┐
│ TenantRepository    │  ← Data access layer
└─────────────────────┘
```

### Guard Layer

```
Request → TenantGuard → Validate tenant → Add to context → Controller
                ↓
          Extract tenant ID from:
          - X-Tenant-ID header
          - X-Tenant-Slug header
          - Subdomain
```

## Setup

### 1. Enable Multi-Tenancy

Update your `.env` file:

```bash
MULTI_TENANT_ENABLED=true
```

### 2. Run Database Migration

The tenant tables are included in the schema. If you haven't run migrations yet:

```bash
npx prisma migrate dev
```

### 3. Seed Test Data

Run the seed script to create sample tenants:

```bash
npm run db:seed
```

This will create 4 sample tenants:
- Acme Corporation (active)
- TechStart Inc (active)
- Global Services Ltd (active)
- Suspended Company (suspended)

### 4. Verify Installation

Run tests to verify everything is working:

```bash
npm test -- tenant
```

## Tenant Identification

The application supports three methods for tenant identification (in order of priority):

### 1. X-Tenant-ID Header (Highest Priority)

Use the tenant's numeric ID:

```bash
curl -H "X-Tenant-ID: 1" http://localhost:3000/api/tenants
```

### 2. X-Tenant-Slug Header

Use the tenant's unique slug:

```bash
curl -H "X-Tenant-Slug: acme" http://localhost:3000/api/tenants
```

### 3. Subdomain (Lowest Priority)

Access the application via tenant subdomain:

```bash
curl http://acme.example.com/api/tenants
```

The TenantGuard extracts the subdomain and matches it against tenant slugs.

**Note**: When multi-tenancy is disabled, none of these methods are required.

## API Reference

### Authentication

All tenant management endpoints require admin role. Include your access token:

```bash
Authorization: Bearer <access_token>
```

### Endpoints

#### GET /api/tenants

Get all tenants with pagination and filtering.

**Query Parameters:**
- `search` (optional): Search by name, slug, or domain
- `status` (optional): Filter by status (ACTIVE, INACTIVE, SUSPENDED)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Acme Corporation",
      "slug": "acme",
      "domain": "acme.example.com",
      "status": "ACTIVE",
      "settings": "{\"theme\":\"blue\"}",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### GET /api/tenants/with-counts

Get all tenants with user counts.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Acme Corporation",
    "slug": "acme",
    "status": "ACTIVE",
    "_count": {
      "users": 15
    }
  }
]
```

#### GET /api/tenants/active

Get only active tenants.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Acme Corporation",
    "slug": "acme",
    "status": "ACTIVE"
  }
]
```

#### GET /api/tenants/:id

Get a specific tenant by ID.

**Response:**
```json
{
  "id": 1,
  "name": "Acme Corporation",
  "slug": "acme",
  "domain": "acme.example.com",
  "status": "ACTIVE",
  "settings": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET /api/tenants/:id/user-count

Get user count for a specific tenant.

**Response:**
```json
{
  "tenantId": 1,
  "userCount": 15
}
```

#### GET /api/tenants/slug/:slug

Get a tenant by slug.

#### GET /api/tenants/domain/:domain

Get a tenant by domain.

#### POST /api/tenants

Create a new tenant.

**Request Body:**
```json
{
  "name": "New Company",
  "slug": "new-company",
  "domain": "new.example.com",
  "status": "ACTIVE",
  "settings": "{\"theme\":\"dark\"}"
}
```

**Validation Rules:**
- `name`: 2-100 characters (required)
- `slug`: 2-50 characters, lowercase letters, numbers, and hyphens only (required)
- `domain`: Valid URL format (optional)
- `status`: ACTIVE, INACTIVE, or SUSPENDED (optional, default: ACTIVE)
- `settings`: Valid JSON string (optional)

**Response:**
```json
{
  "id": 5,
  "name": "New Company",
  "slug": "new-company",
  "domain": "new.example.com",
  "status": "ACTIVE",
  "settings": "{\"theme\":\"dark\"}",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### PUT /api/tenants/:id

Update a tenant.

**Request Body:**
```json
{
  "name": "Updated Name",
  "status": "INACTIVE"
}
```

#### PUT /api/tenants/:id/suspend

Suspend a tenant (sets status to SUSPENDED).

#### PUT /api/tenants/:id/activate

Activate a tenant (sets status to ACTIVE).

#### PUT /api/tenants/:id/deactivate

Deactivate a tenant (sets status to INACTIVE).

#### DELETE /api/tenants/:id

Delete a tenant. **Warning**: This will cascade delete all users and refresh tokens associated with the tenant.

## Code Examples

### Creating a Tenant

```typescript
import { TenantService } from '@/server/services/tenant.service'

const tenantService = container.resolve(TenantService)

const tenant = await tenantService.create({
  name: 'My Company',
  slug: 'my-company',
  domain: 'my-company.example.com',
  settings: JSON.stringify({
    theme: 'blue',
    features: ['analytics', 'reports']
  })
})
```

### Finding Tenants with Filters

```typescript
const result = await tenantService.findAll({
  search: 'tech',
  status: TenantStatus.ACTIVE,
  page: 1,
  limit: 20
})

console.log(`Found ${result.meta.total} tenants`)
result.data.forEach(tenant => {
  console.log(`- ${tenant.name} (${tenant.slug})`)
})
```

### Using TenantGuard in Routes

```typescript
import { TenantGuard } from '@/server/guards/tenant.guard'

// The guard automatically validates tenant and adds to request context
export const GET = createRouteHandler(
  MyController,
  'myMethod',
  undefined,
  [TenantGuard] // Add guard
)

// In your controller method:
async myMethod(request: any) {
  const tenant = request.tenant      // Full tenant object
  const tenantId = request.tenantId  // Tenant ID

  // Your logic here
}
```

### Accessing Tenant from Auth Token

```typescript
import { TokenService } from '@/server/auth/token.service'

const tokenService = container.resolve(TokenService)

// Generate token with tenant context
const token = tokenService.generateAccessToken({
  sub: user.id,
  email: user.email,
  role: user.role,
  tenantId: user.tenantId // Include tenant
})

// Verify token
const payload = tokenService.verifyAccessToken(token)
console.log('Tenant ID:', payload.tenantId)
```

### Filtering Users by Tenant

```typescript
import { UserRepository } from '@/server/database/repositories/user.repository'

const userRepository = container.resolve(UserRepository)

// Get users for a specific tenant
const users = await userRepository.findAll({
  where: { tenantId: 1 }
})
```

## Testing

### Running Tenant Tests

```bash
# Run all tenant-related tests
npm test -- tenant

# Run specific test suites
npm test -- tenant.repository.test
npm test -- tenant.service.test
npm test -- tenant.guard.test
```

### Test Coverage

The multi-tenant feature includes comprehensive tests for:

- **TenantRepository**: CRUD operations, domain-specific methods, user counts
- **TenantService**: Business logic, validation, feature toggle
- **TenantGuard**: Tenant identification, status validation, context population

### Testing with Multi-Tenancy Disabled

Set `MULTI_TENANT_ENABLED=false` in your test environment to verify the application works correctly when multi-tenancy is disabled.

## Security Considerations

### Tenant Isolation

- **Data segregation**: Always filter queries by `tenantId` when multi-tenancy is enabled
- **Cascade deletes**: Deleting a tenant removes all associated users and tokens
- **Status checks**: Suspended tenants are rejected by TenantGuard

### Best Practices

1. **Always validate tenant context**: Use TenantGuard on routes that require tenant isolation
2. **Include tenant in queries**: When querying user data, always filter by `tenantId`
3. **Verify tenant ownership**: Before updating resources, verify they belong to the current tenant
4. **Audit tenant changes**: Log tenant creation, updates, and status changes
5. **Handle suspended tenants**: Return appropriate error messages when tenants are suspended

### Common Pitfalls

❌ **DON'T** query all users without tenant filtering:
```typescript
const users = await userRepository.findAll() // Returns all users across tenants!
```

✅ **DO** filter by tenant:
```typescript
const users = await userRepository.findAll({
  where: { tenantId: request.tenantId }
})
```

❌ **DON'T** trust client-provided tenant IDs without validation:
```typescript
const tenantId = request.body.tenantId // Dangerous!
```

✅ **DO** use TenantGuard to validate and populate tenant context:
```typescript
// TenantGuard ensures request.tenantId is validated
const tenantId = request.tenantId
```

## Best Practices

### Tenant Settings

Store tenant-specific configuration as JSON:

```typescript
const settings = {
  theme: 'dark',
  features: ['analytics', 'reports', 'export'],
  limits: {
    maxUsers: 100,
    maxStorage: 10737418240 // 10GB in bytes
  }
}

await tenantService.create({
  name: 'My Company',
  slug: 'my-company',
  settings: JSON.stringify(settings)
})

// Later, retrieve and parse:
const tenant = await tenantService.findById(1)
const parsedSettings = JSON.parse(tenant.settings || '{}')
console.log(parsedSettings.theme) // 'dark'
```

### Slug Validation

Slugs must:
- Be 2-50 characters
- Contain only lowercase letters, numbers, and hyphens
- Be unique across all tenants

```typescript
// Valid slugs
'acme'
'tech-start'
'global-services-2024'

// Invalid slugs
'Acme'           // Uppercase
'tech_start'     // Underscores
'tech start'     // Spaces
'a'              // Too short
```

### Domain Configuration

Domains are optional but must be unique:

```typescript
// With domain
await tenantService.create({
  name: 'Acme',
  slug: 'acme',
  domain: 'acme.example.com'
})

// Without domain (subdomain-only access)
await tenantService.create({
  name: 'TechStart',
  slug: 'techstart'
})
```

### Handling Tenant Status

```typescript
// Check tenant status before operations
if (tenant.status === TenantStatus.SUSPENDED) {
  throw new UnauthorizedException('This tenant has been suspended')
}

if (tenant.status === TenantStatus.INACTIVE) {
  // Log warning but may allow read-only access
  logger.warn(`Accessing inactive tenant: ${tenant.slug}`)
}
```

### Migration Strategy

When adding multi-tenancy to an existing application:

1. Set `MULTI_TENANT_ENABLED=false` initially
2. Run migrations to add tenant tables
3. Create a default tenant for existing users
4. Update existing users to point to default tenant
5. Enable multi-tenancy: `MULTI_TENANT_ENABLED=true`
6. Add TenantGuard to protected routes
7. Test thoroughly before production deployment

### Monitoring and Analytics

Track tenant-specific metrics:

```typescript
// Get tenant user count
const count = await tenantService.getUserCount(tenantId)

// Get all tenants with counts
const tenants = await tenantService.findAllWithCounts()
tenants.forEach(tenant => {
  console.log(`${tenant.name}: ${tenant._count.users} users`)
})
```

## Troubleshooting

### Common Issues

**Issue**: "Multi-tenancy is not enabled" error
- **Solution**: Set `MULTI_TENANT_ENABLED=true` in your `.env` file

**Issue**: "Tenant identifier is required" error
- **Solution**: Include `X-Tenant-ID`, `X-Tenant-Slug` header, or use a tenant subdomain

**Issue**: "Tenant not found" error
- **Solution**: Verify the tenant exists and the identifier is correct

**Issue**: "Tenant is suspended" error
- **Solution**: Activate the tenant using PUT `/api/tenants/:id/activate`

**Issue**: Cascade delete warnings
- **Solution**: This is expected behavior. Deleting a tenant removes all associated data.

## Additional Resources

- [Prisma Multi-Tenancy Guide](https://www.prisma.io/docs/guides/database/multi-tenancy)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## Support

For issues, questions, or contributions related to multi-tenancy:

1. Check existing GitHub issues
2. Review this documentation
3. Run tests to verify your setup
4. Create a new issue with detailed information

---

**Version**: 1.0.0
**Last Updated**: 2024
