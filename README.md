# Nexst - Next.js with NestJS Architecture

A production-ready Next.js boilerplate with NestJS-style architecture patterns, bringing enterprise-level backend practices to Next.js applications.

## Features

- **Dependency Injection** - Full DI container using TSyringe
- **Decorator-based Controllers** - NestJS-style `@Controller()`, `@Get()`, `@Post()`, etc.
- **DTO Validation** - Automatic request validation using class-validator
- **Type Safety** - Full TypeScript support with strict mode
- **Guards & Middleware** - Authentication and authorization system
- **Error Handling** - Centralized exception handling with custom exceptions
- **Testing Ready** - Jest configuration with example tests
- **Clean Architecture** - Separation of concerns with services, controllers, and DTOs

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Core Concepts](#core-concepts)
- [API Examples](#api-examples)
- [Testing](#testing)
- [Best Practices](#best-practices)

## Getting Started

### Installation

```bash
npm install
npm run dev
npm test
npm run build
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

Your API endpoint is ready at `POST /api/products` with automatic validation.

## Project Structure

```
nexst/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes
│   │   │   ├── users/           # User endpoints
│   │   │   └── health/          # Health check
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   │
│   ├── server/                   # Backend (NestJS-style)
│   │   ├── controllers/         # API controllers
│   │   │   └── user.controller.ts
│   │   ├── services/            # Business logic
│   │   │   └── user.service.ts
│   │   ├── dto/                 # Data transfer objects
│   │   │   └── user.dto.ts
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
│   │   │   └── auth.guard.ts
│   │   ├── container/           # DI container
│   │   │   └── container.ts
│   │   └── core/                # Core functionality
│   │       └── route-handler.ts
│   │
│   └── shared/                   # Shared utilities
│
├── package.json
├── tsconfig.json
├── jest.config.js
└── next.config.js
```

## Core Concepts

### 1. Dependency Injection

Nexst uses TSyringe for dependency injection:

```typescript
import { Injectable } from '@/server/decorators'

@Injectable()
export class UserService {
  // Service implementation
}

@Injectable()
export class OrderService {
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

Protect routes with guards:

```typescript
import { UseGuards } from '@/server/decorators'
import { AuthGuard } from '@/server/guards/auth.guard'

@Controller('/admin')
@UseGuards(AuthGuard)
export class AdminController {
  // All routes protected by AuthGuard
}
```

## API Examples

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

## Testing

### Running Tests

```bash
npm test
npm run test:watch
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

## Best Practices

### 1. Separation of Concerns

- **Controllers** - Handle HTTP requests/responses only
- **Services** - Contain business logic
- **DTOs** - Define data structures and validation
- **Repositories** - Handle data persistence (when using a database)

### 2. Error Handling

Always use typed exceptions:

```typescript
// Don't
throw new Error('User not found')

// Do
throw new NotFoundException('User not found')
```

### 3. Validation

Always validate incoming data with DTOs:

```typescript
// Don't
@Post()
async create(@Body() data: any) {
  return this.service.create(data)
}

// Do
@Post()
async create(@Body() dto: CreateUserDto) {
  return this.service.create(dto)
}
```

### 4. Dependency Injection

Use constructor injection for dependencies:

```typescript
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

## Advanced Usage

### Custom Decorators

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

```typescript
import { createRequestContainer } from '@/server/container/container'

const requestContainer = createRequestContainer()
const service = requestContainer.resolve(UserService)
```

### Custom Validation

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

## Contributing

Contributions are welcome. Submit a Pull Request.

## License

MIT

## Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [NestJS](https://nestjs.com/) - Architecture inspiration
- [TSyringe](https://github.com/microsoft/tsyringe) - Dependency injection
- [class-validator](https://github.com/typestack/class-validator) - Validation
