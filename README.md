# 🚀 Nexst - Next.js with NestJS Architecture

A production-ready Next.js boilerplate featuring NestJS-style architecture patterns, bringing enterprise-level backend practices to your Next.js applications.

## ✨ Features

- **🎯 Dependency Injection** - Full DI container using TSyringe
- **🎨 Decorator-based Controllers** - NestJS-style `@Controller()`, `@Get()`, `@Post()`, etc.
- **✅ DTO Validation** - Automatic request validation using class-validator
- **🛡️ Type Safety** - Full TypeScript support with strict mode
- **🔒 Guards & Middleware** - Authentication and authorization system
- **🏢 Multi-Tenancy** - Optional tenant isolation with database-level segregation
- **⚡ Error Handling** - Centralized exception handling with custom exceptions
- **🧪 Testing Ready** - Jest configuration with example tests
- **📦 Clean Architecture** - Separation of concerns with services, controllers, and DTOs

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Core Concepts](#core-concepts)
- [Multi-Tenancy](#multi-tenancy)
- [API Examples](#api-examples)
- [Testing](#testing)
- [Best Practices](#best-practices)

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

### Quick Start - Create Your First API

1. **Create a DTO** (Data Transfer Object)

```typescript
// src/server/dto/product.dto.ts
import { IsString, IsNumber, Min } from 'class-validator'

export class CreateProductDto {
  @IsString()
  name!: string

  @IsNumber()
  @Min(0)
  price!: number
}
```

2. **Create a Service**

```typescript
// src/server/services/product.service.ts
import { Injectable } from '../decorators'

@Injectable()
export class ProductService {
  async create(dto: CreateProductDto) {
    // Your business logic here
    return { id: 1, ...dto }
  }
}
```

3. **Create a Controller**

```typescript
// src/server/controllers/product.controller.ts
import { Controller, Post, Body } from '../decorators'
import { ProductService } from '../services/product.service'
import { CreateProductDto } from '../dto/product.dto'

@Controller('/products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Post()
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productService.create(dto)
  }
}
```

4. **Register the Route**

```typescript
// src/app/api/products/route.ts
import 'reflect-metadata'
import { ProductController } from '@/server/controllers/product.controller'
import { createRouteHandler } from '@/server/core/route-handler'
import { CreateProductDto } from '@/server/dto/product.dto'

export const POST = createRouteHandler(ProductController, 'createProduct', CreateProductDto)
```

That's it! Your API endpoint is ready at `POST /api/products` with automatic validation.

## 📁 Project Structure

```
nexst/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes
│   │   │   ├── users/           # User endpoints
│   │   │   ├── tenants/         # Tenant management endpoints
│   │   │   └── health/          # Health check
│   │   ├── tenants/             # Tenant admin UI
│   │   │   ├── api/             # Tenant API client
│   │   │   ├── components/      # UI components
│   │   │   └── page.tsx         # Tenant management page
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   │
│   ├── server/                   # Backend (NestJS-style)
│   │   ├── controllers/         # API controllers
│   │   │   ├── user.controller.ts
│   │   │   └── tenant.controller.ts
│   │   ├── services/            # Business logic
│   │   │   ├── user.service.ts
│   │   │   └── tenant.service.ts
│   │   ├── database/            # Database layer
│   │   │   ├── repositories/   # Data access
│   │   │   │   └── tenant.repository.ts
│   │   │   └── prisma.service.ts
│   │   ├── dto/                 # Data transfer objects
│   │   │   ├── user.dto.ts
│   │   │   └── tenant.dto.ts
│   │   ├── decorators/          # Custom decorators
│   │   │   ├── controller.decorator.ts
│   │   │   ├── http-methods.decorator.ts
│   │   │   ├── param.decorator.ts
│   │   │   └── guards.decorator.ts
│   │   ├── filters/             # Exception filters
│   │   │   ├── http-exception.ts
│   │   │   └── exception.filter.ts
│   │   ├── pipes/               # Validation pipes
│   │   │   └── validation.pipe.ts
│   │   ├── guards/              # Auth guards
│   │   │   ├── auth.guard.ts
│   │   │   └── tenant.guard.ts
│   │   ├── logger/              # Logging service
│   │   │   └── logger.service.ts
│   │   ├── container/           # DI container
│   │   │   └── container.ts
│   │   └── core/                # Core functionality
│   │       └── route-handler.ts
│   │
│   └── shared/                   # Shared utilities
│
├── middleware.ts                # Next.js middleware (tenant validation)
├── prisma/
│   └── schema.prisma            # Database schema
├── package.json
├── tsconfig.json
├── jest.config.js
└── next.config.js
```

## 🎓 Core Concepts

### 1. Dependency Injection

Nexst uses TSyringe for dependency injection, allowing you to easily manage dependencies:

```typescript
import { Injectable } from '@/server/decorators'

@Injectable()
export class UserService {
  // Service implementation
}

@Injectable()
export class OrderService {
  // Inject UserService
  constructor(private userService: UserService) {}
}
```

### 2. Controllers

Controllers handle incoming HTTP requests and return responses:

```typescript
@Controller('/api/users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async getAll() {
    return this.userService.findAll()
  }

  @Get('/:id')
  async getOne(@Param('id') id: string) {
    return this.userService.findOne(parseInt(id))
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto)
  }
}
```

### 3. DTOs and Validation

DTOs define the shape of data with automatic validation:

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator'

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  name!: string

  @IsEmail()
  email!: string
}
```

Invalid requests automatically return a 400 error with detailed validation messages.

### 4. Exception Handling

Use built-in exceptions for common HTTP errors:

```typescript
import { NotFoundException, BadRequestException } from '@/server/filters'

async findOne(id: number) {
  const user = await this.repository.find(id)

  if (!user) {
    throw new NotFoundException('User not found')
  }

  return user
}
```

Available exceptions:
- `BadRequestException` (400)
- `UnauthorizedException` (401)
- `ForbiddenException` (403)
- `NotFoundException` (404)
- `ConflictException` (409)
- `UnprocessableEntityException` (422)
- `InternalServerErrorException` (500)

### 5. Guards

Protect your routes with guards:

```typescript
import { UseGuards } from '@/server/decorators'
import { AuthGuard } from '@/server/guards/auth.guard'

@Controller('/admin')
@UseGuards(AuthGuard)
export class AdminController {
  // All routes protected by AuthGuard
}
```

## 🏢 Multi-Tenancy

Nexst includes a complete, production-ready multi-tenancy system with optional tenant isolation. This feature allows you to serve multiple organizations (tenants) from a single application instance while keeping their data completely separated.

### Overview

**What is Multi-Tenancy?**

Multi-tenancy enables a single application to serve multiple customers (tenants) with complete data isolation. Each tenant has:
- Separate user base
- Isolated data storage
- Independent settings and configuration
- Optional custom domains
- Status management (ACTIVE, INACTIVE, SUSPENDED)

**When to Use Multi-Tenancy:**
- SaaS applications serving multiple organizations
- B2B platforms with customer isolation requirements
- Applications requiring strict data segregation
- Systems with per-organization billing/subscriptions

### Configuration

Multi-tenancy is controlled via environment variables:

```bash
# .env
ENABLE_MULTI_TENANCY=true  # Enable multi-tenant mode (default: false)
```

When disabled, the application runs in single-tenant mode and all tenant-related validations are bypassed.

### Database Schema

The multi-tenant feature uses Prisma with the following schema:

```prisma
model Tenant {
  id        Int          @id @default(autoincrement())
  name      String       // Display name (e.g., "Acme Corporation")
  slug      String       @unique  // URL-safe identifier (e.g., "acme")
  domain    String?      @unique  // Optional custom domain
  status    TenantStatus @default(ACTIVE)
  settings  String?      // JSON string for tenant-specific settings

  users     User[]       // All users belong to a tenant

  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
}

enum TenantStatus {
  ACTIVE      // Tenant is active and accessible
  INACTIVE    // Tenant is disabled temporarily
  SUSPENDED   // Tenant is suspended (billing issues, etc.)
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  password  String

  tenantId  Int?     // Optional tenant association
  tenant    Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Tenant Identification

The middleware supports three methods to identify tenants (checked in order):

**1. X-Tenant-ID Header (Numeric ID)**
```bash
curl -H "X-Tenant-ID: 123" https://api.example.com/api/users
```

**2. X-Tenant-Slug Header (String Slug)**
```bash
curl -H "X-Tenant-Slug: acme-corp" https://api.example.com/api/users
```

**3. Subdomain Extraction**
```bash
# Automatically extracts "acme" as tenant slug
https://acme.example.com/api/users
```

### API Usage

#### Managing Tenants

**Create a Tenant**
```bash
POST /api/tenants
Content-Type: application/json

{
  "name": "Acme Corporation",
  "slug": "acme",
  "domain": "acme.example.com",
  "status": "ACTIVE",
  "settings": "{\"theme\":\"blue\",\"features\":{\"analytics\":true}}"
}
```

**List All Tenants**
```bash
GET /api/tenants?page=1&limit=10&search=acme&status=ACTIVE
```

**Get Tenant by ID**
```bash
GET /api/tenants/123
```

**Update Tenant**
```bash
PUT /api/tenants/123
Content-Type: application/json

{
  "name": "Acme Corp Updated",
  "settings": "{\"theme\":\"green\"}"
}
```

**Delete Tenant** (cascades to all users)
```bash
DELETE /api/tenants/123
```

**Tenant Status Management**
```bash
# Suspend a tenant
POST /api/tenants/123/suspend

# Activate a tenant
POST /api/tenants/123/activate

# Deactivate a tenant
POST /api/tenants/123/deactivate
```

**Get Tenant User Count**
```bash
GET /api/tenants/123/user-count
```

#### Creating Tenant-Aware Resources

When multi-tenancy is enabled, include the tenant identifier in requests:

```bash
# Create a user for a specific tenant
POST /api/users
X-Tenant-ID: 123
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@acme.com",
  "password": "secure123"
}
```

### Middleware Protection

The Next.js middleware (`/middleware.ts`) automatically validates tenant context for protected routes:

**Protected Routes** (require tenant context):
- `/api/users/*`
- `/api/tenants/*`
- Custom routes you define

**Public Routes** (no tenant required):
- `/api/auth/*`
- `/api/health`
- Static assets (`/_next/*`, `/favicon.ico`, etc.)

**Middleware Behavior:**
1. Checks if route requires tenant validation
2. Extracts tenant identifier (header or subdomain)
3. Returns 401 if tenant context is missing for protected routes
4. Adds `x-middleware-tenant-id` header for downstream use

### Using TenantGuard in Controllers

Protect specific controller routes with `TenantGuard`:

```typescript
import { Controller, Get, Post, UseGuards } from '@/server/decorators'
import { TenantGuard } from '@/server/guards/tenant.guard'

@Controller('/api/resources')
@UseGuards(TenantGuard)  // Apply to all routes in controller
export class ResourceController {
  constructor(private resourceService: ResourceService) {}

  @Get()
  async getAll(@Req() request: Request) {
    // TenantGuard has validated tenant and attached to request
    const tenantId = request.tenantId
    return this.resourceService.findByTenant(tenantId)
  }
}
```

**TenantGuard Features:**
- Validates tenant exists and is ACTIVE
- Blocks access to INACTIVE or SUSPENDED tenants
- Supports lookup by ID, slug, or domain
- Attaches tenant object to request for downstream use
- Throws `UnauthorizedException` if tenant invalid
- Throws `NotFoundException` if tenant not found

### Frontend UI

Nexst includes a complete admin interface for tenant management:

**Access:** [http://localhost:3000/tenants](http://localhost:3000/tenants)

**Features:**
- View all tenants with pagination
- Search by name, slug, or domain
- Filter by status (ACTIVE, INACTIVE, SUSPENDED)
- Create new tenants with form validation
- Edit existing tenants
- Status management (suspend, activate, deactivate)
- Delete tenants (with cascade to users)
- Real-time user count display
- JSON settings editor with validation

**Example: Creating a Tenant via UI**
1. Navigate to `/tenants`
2. Click "Create Tenant"
3. Fill in tenant name (slug auto-generates)
4. Optionally add domain and settings
5. Click "Create Tenant"

### Service Layer

Use `TenantService` for business logic:

```typescript
import { TenantService } from '@/server/services/tenant.service'

@Injectable()
export class MyService {
  constructor(private tenantService: TenantService) {}

  async doSomething(tenantSlug: string) {
    // Find tenant by slug
    const tenant = await this.tenantService.findBySlug(tenantSlug)

    // Get user count
    const userCount = await this.tenantService.getUserCount(tenant.id)

    // Update tenant settings
    await this.tenantService.update(tenant.id, {
      settings: JSON.stringify({ feature: true })
    })
  }
}
```

**Available Methods:**
- `findAll()` - Get all tenants
- `findById(id)` - Get tenant by ID
- `findBySlug(slug)` - Get tenant by slug
- `findByDomain(domain)` - Get tenant by domain
- `findActive()` - Get only active tenants
- `findByIdWithUserCount(id)` - Get tenant with user count
- `create(dto)` - Create new tenant
- `update(id, dto)` - Update tenant
- `delete(id)` - Delete tenant (cascades)
- `suspend(id)` - Suspend tenant
- `activate(id)` - Activate tenant
- `deactivate(id)` - Deactivate tenant
- `getUserCount(id)` - Get user count for tenant

### Testing Multi-Tenancy

Run tenant-specific tests:

```bash
# Run all tenant tests
npm test -- --testPathPattern=tenant

# Run specific test suites
npm test -- tenant.service.test.ts
npm test -- tenant-integration.test.ts
```

**Test Coverage:**
- ✅ Tenant CRUD operations (43 tests)
- ✅ Tenant guard validation (19 tests)
- ✅ Tenant service methods (37 tests)
- ✅ End-to-end integration (17 tests)
- **Total: 116 tests, 100% passing**

**Example Integration Test:**

```typescript
it('should isolate users between tenants', async () => {
  // Create two tenants
  const tenant1 = await prisma.tenant.create({
    data: { name: 'Tenant 1', slug: 'tenant1' }
  })
  const tenant2 = await prisma.tenant.create({
    data: { name: 'Tenant 2', slug: 'tenant2' }
  })

  // Create users for each tenant
  await prisma.user.create({
    data: { email: 'user1@tenant1.com', tenantId: tenant1.id }
  })
  await prisma.user.create({
    data: { email: 'user2@tenant2.com', tenantId: tenant2.id }
  })

  // Verify isolation
  const tenant1Users = await prisma.user.findMany({
    where: { tenantId: tenant1.id }
  })
  expect(tenant1Users).toHaveLength(1)
  expect(tenant1Users[0].email).toBe('user1@tenant1.com')
})
```

### Best Practices

**1. Always Validate Tenant Context**
```typescript
// ✅ Do - Use TenantGuard
@UseGuards(TenantGuard)
@Get('/resources')
async getResources(@Req() req: Request) {
  return this.service.findByTenant(req.tenantId)
}

// ❌ Don't - Skip validation
@Get('/resources')
async getResources() {
  return this.service.findAll()  // Exposes all tenants' data!
}
```

**2. Use Cascade Deletes**
```prisma
// ✅ Do - Define cascade behavior
tenant Tenant? @relation(fields: [tenantId], references: [id], onDelete: Cascade)

// ❌ Don't - Leave orphaned records
tenant Tenant? @relation(fields: [tenantId], references: [id])
```

**3. Check Tenant Status**
```typescript
// ✅ Do - Verify tenant is active
if (tenant.status !== 'ACTIVE') {
  throw new UnauthorizedException('Tenant is not active')
}

// ❌ Don't - Ignore status
const tenant = await this.tenantService.findById(id)
// Proceed without checking status
```

**4. Store Tenant Settings as JSON**
```typescript
// ✅ Do - Parse and validate JSON settings
const settings = JSON.parse(tenant.settings || '{}')
if (settings.featureEnabled) {
  // Use setting
}

// ❌ Don't - Store complex objects directly
await this.tenantService.update(id, {
  settings: complexObject  // Will fail
})
```

**5. Test Tenant Isolation**
```typescript
// ✅ Do - Test cross-tenant access prevention
it('should prevent cross-tenant data access', async () => {
  const user = await prisma.user.findFirst({
    where: { id: user1.id, tenantId: tenant2.id }
  })
  expect(user).toBeNull()
})
```

### Disabling Multi-Tenancy

To run in single-tenant mode:

```bash
# .env
ENABLE_MULTI_TENANCY=false
```

When disabled:
- Middleware allows all requests through
- TenantGuard can be optionally disabled
- Users can exist without `tenantId`
- All tenant validations are bypassed

### Migration Guide

**From Single-Tenant to Multi-Tenant:**

1. **Update Environment**
```bash
ENABLE_MULTI_TENANCY=true
```

2. **Run Prisma Migration**
```bash
npx prisma migrate dev --name add-multi-tenancy
```

3. **Create Initial Tenant**
```typescript
const tenant = await prisma.tenant.create({
  data: {
    name: 'Default Tenant',
    slug: 'default',
    status: 'ACTIVE'
  }
})
```

4. **Migrate Existing Users**
```typescript
await prisma.user.updateMany({
  where: { tenantId: null },
  data: { tenantId: tenant.id }
})
```

5. **Add TenantGuard to Controllers**
```typescript
@UseGuards(TenantGuard)
```

6. **Update API Clients**
Add `X-Tenant-ID` or `X-Tenant-Slug` headers to requests.

## 📚 API Examples

### Example User API

The boilerplate includes a complete User CRUD API:

**Get all users**
```bash
GET /api/users
```

**Get user by ID**
```bash
GET /api/users/1
```

**Create user**
```bash
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```

**Update user**
```bash
PUT /api/users/1
Content-Type: application/json

{
  "name": "Jane Doe"
}
```

**Delete user**
```bash
DELETE /api/users/1
```

### Example with Query Parameters

```typescript
@Get('/search')
async search(@Query('q') query: string, @Query('page') page: string) {
  return this.service.search(query, parseInt(page))
}
```

### Example with Request Object

```typescript
@Get('/profile')
async getProfile(@Req() request: NextRequest) {
  const token = request.headers.get('authorization')
  return this.service.getProfile(token)
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

Example service test:

```typescript
import 'reflect-metadata'
import { UserService } from '../user.service'
import { NotFoundException } from '../../filters'

describe('UserService', () => {
  let service: UserService

  beforeEach(() => {
    service = new UserService()
  })

  it('should create a user', async () => {
    const dto = { name: 'Test', email: 'test@example.com' }
    const user = await service.create(dto)

    expect(user.name).toBe('Test')
    expect(user.id).toBeDefined()
  })

  it('should throw NotFoundException', async () => {
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException)
  })
})
```

## 📖 Best Practices

### 1. Separation of Concerns

- **Controllers** - Handle HTTP requests/responses only
- **Services** - Contain business logic
- **DTOs** - Define data structures and validation
- **Repositories** - Handle data persistence (when using a database)

### 2. Error Handling

Always use typed exceptions:

```typescript
// ❌ Don't
throw new Error('User not found')

// ✅ Do
throw new NotFoundException('User not found')
```

### 3. Validation

Always validate incoming data with DTOs:

```typescript
// ❌ Don't
@Post()
async create(@Body() data: any) {
  return this.service.create(data)
}

// ✅ Do
@Post()
async create(@Body() dto: CreateUserDto) {
  return this.service.create(dto)
}
```

### 4. Dependency Injection

Use constructor injection for dependencies:

```typescript
// ✅ Do
@Injectable()
export class UserService {
  constructor(
    private emailService: EmailService,
    private loggerService: LoggerService
  ) {}
}
```

### 5. Testing

Write tests for all services and critical business logic:

```typescript
describe('UserService', () => {
  let service: UserService

  beforeEach(() => {
    service = new UserService()
  })

  // Test each method
})
```

## 🔧 Advanced Usage

### Custom Decorators

Create your own decorators:

```typescript
export function RequireRole(role: string) {
  return UseGuards(RoleGuard(role))
}

// Usage
@RequireRole('admin')
@Get('/admin-only')
async adminRoute() {
  return { message: 'Admin only' }
}
```

### Request-Scoped Services

Create request-scoped containers:

```typescript
import { createRequestContainer } from '@/server/container/container'

const requestContainer = createRequestContainer()
const service = requestContainer.resolve(UserService)
```

### Custom Validation

Create custom validation decorators:

```typescript
import { registerDecorator, ValidationOptions } from 'class-validator'

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === 'string' && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value)
        },
      },
    })
  }
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [NestJS](https://nestjs.com/) - Architecture inspiration
- [TSyringe](https://github.com/microsoft/tsyringe) - Dependency injection
- [class-validator](https://github.com/typestack/class-validator) - Validation

---

Built with ❤️ by the Nexst team
