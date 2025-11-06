# Architecture Documentation

## Overview

Nexst implements NestJS-style architecture patterns within Next.js, bringing enterprise-level backend practices to your Next.js applications while maintaining the benefits of Next.js's file-based routing.

## Core Components

### 1. Dependency Injection Container

**Location:** `src/server/container/`

The DI container is built on top of TSyringe, providing:
- Singleton service instances by default
- Request-scoped containers when needed
- Automatic constructor injection
- Easy testing with mock services

**How it works:**
```typescript
// Service gets registered
@Injectable()
class UserService { }

// Controller receives the service
@Controller()
class UserController {
  constructor(private userService: UserService) {}
}

// Container resolves dependencies
const controller = container.resolve(UserController)
```

### 2. Decorators System

**Location:** `src/server/decorators/`

Decorators provide a declarative way to define routes and handle requests:

#### @Controller(prefix)
- Marks a class as a controller
- Automatically makes it injectable
- Defines a route prefix

#### HTTP Method Decorators
- `@Get(path)`, `@Post(path)`, `@Put(path)`, `@Delete(path)`, `@Patch(path)`
- Define route handlers
- Store metadata about routes

#### Parameter Decorators
- `@Body()` - Extract request body
- `@Query(key?)` - Extract query parameters
- `@Param(key?)` - Extract route parameters
- `@Req()` - Get full request object
- `@Res()` - Get response object

#### Guard Decorator
- `@UseGuards(...guards)` - Apply guards to routes or controllers

### 3. Route Handler Factory

**Location:** `src/server/core/route-handler.ts`

The route handler factory bridges NestJS-style controllers with Next.js Route Handlers:

**Process Flow:**
1. Resolve controller from DI container
2. Execute guards (if any)
3. Parse request (body, query, params)
4. Apply validation to DTOs
5. Extract and inject parameters
6. Call controller method
7. Return response or catch exceptions

**Integration with Next.js:**
```typescript
// Next.js route file
export const GET = createRouteHandler(UserController, 'getUsers')
```

### 4. Validation Pipeline

**Location:** `src/server/pipes/`

Automatic validation using class-validator:

1. Plain object received from request
2. Transform to DTO class instance (class-transformer)
3. Validate using decorators (class-validator)
4. Throw BadRequestException if validation fails
5. Pass validated instance to controller method

**Validation Features:**
- Type transformation
- Whitelist mode (strip unknown properties)
- Detailed error messages
- Nested object validation

### 5. Exception Handling

**Location:** `src/server/filters/`

Centralized error handling:

**Exception Hierarchy:**
```
Error
  └── HttpException
        ├── BadRequestException (400)
        ├── UnauthorizedException (401)
        ├── ForbiddenException (403)
        ├── NotFoundException (404)
        ├── ConflictException (409)
        ├── UnprocessableEntityException (422)
        └── InternalServerErrorException (500)
```

**Exception Filter:**
- Catches all errors in route handlers
- Formats errors into consistent JSON structure
- Handles validation errors specially
- Logs errors for debugging

### 6. Guards System

**Location:** `src/server/guards/`

Guards control access to routes:

**Guard Interface:**
```typescript
interface Guard {
  canActivate(context: any): boolean | Promise<boolean>
}
```

**Execution:**
- Guards run before route handlers
- Can be applied to controllers (all routes) or specific methods
- Can access request and route parameters
- Should throw UnauthorizedException or ForbiddenException

## Request Lifecycle

1. **Request arrives** at Next.js API route
2. **Route handler created** by `createRouteHandler()`
3. **Controller resolved** from DI container
4. **Guards executed** (if any)
5. **Request parsed** (body, query, params)
6. **Validation applied** to DTOs
7. **Parameters extracted** based on decorators
8. **Controller method called** with parameters
9. **Response returned** or exception caught
10. **Exception filter** formats errors (if any)
11. **Response sent** to client

## Metadata Storage

The decorator system uses TypeScript's reflect-metadata to store information:

- **Controller metadata:** Prefix path
- **Route metadata:** HTTP method, path, method name
- **Parameter metadata:** Index, type, property key
- **Guard metadata:** Guard classes to execute

## Integration with Next.js

### File-based Routing

Next.js routing is preserved:
```
src/app/api/
  ├── users/
  │   ├── route.ts           -> /api/users
  │   └── [id]/
  │       └── route.ts       -> /api/users/:id
  └── products/
      └── route.ts           -> /api/products
```

### Route Handler Pattern

Each Next.js route file imports and registers controllers:

```typescript
import 'reflect-metadata'  // Required
import { Controller } from '@/server/controllers/...'
import { createRouteHandler } from '@/server/core/route-handler'
import { DTO } from '@/server/dto/...'

export const GET = createRouteHandler(Controller, 'methodName')
export const POST = createRouteHandler(Controller, 'methodName', DTO)
```

## Testing Strategy

### Unit Tests

Test services and business logic in isolation:
```typescript
const service = new UserService()
const result = await service.findOne(1)
expect(result).toBeDefined()
```

### Integration Tests

Test controllers with DI:
```typescript
const container = createRequestContainer()
const controller = container.resolve(UserController)
const result = await controller.getUser('1')
```

### Mocking

Replace dependencies with mocks:
```typescript
container.register(UserService, { useValue: mockUserService })
const controller = container.resolve(UserController)
```

## Best Practices

### 1. Keep Controllers Thin
Controllers should only:
- Handle HTTP concerns (request/response)
- Delegate to services
- Return data

### 2. Services Own Business Logic
All business logic belongs in services:
- Validation beyond DTOs
- Data transformation
- Business rules
- External API calls

### 3. DTOs for Data Shape
Use DTOs to:
- Define request/response shapes
- Add validation rules
- Document API contracts
- Transform data

### 4. Exceptions for Control Flow
Use typed exceptions:
- Clear intent
- Consistent error responses
- Proper HTTP status codes
- Detailed error messages

### 5. Guards for Authorization
Guards should:
- Check permissions
- Validate tokens
- Control access
- Be reusable

## Performance Considerations

### Singleton Services
Services are singleton by default:
- Created once
- Shared across requests
- Better memory usage
- Faster resolution

### Request Scoping
Create child containers when needed:
```typescript
const requestContainer = createRequestContainer()
```

### Metadata Caching
Decorator metadata is read once:
- No runtime overhead
- Fast route resolution

## Extending the System

### Custom Decorators

Create decorators for common patterns:
```typescript
export function Cache(ttl: number) {
  // Implementation
}

@Get('/users')
@Cache(60)
async getUsers() { }
```

### Custom Guards

Implement reusable authorization:
```typescript
@Injectable()
export class RoleGuard {
  constructor(private requiredRole: string) {}

  async canActivate(context: any) {
    // Check role
  }
}
```

### Custom Pipes

Transform and validate data:
```typescript
export class ParseIntPipe {
  transform(value: string): number {
    return parseInt(value, 10)
  }
}
```

### Middleware

Add middleware to the request pipeline:
```typescript
export function Logger() {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    const original = descriptor.value
    descriptor.value = async function(...args: any[]) {
      console.log(`Calling ${key}`)
      return original.apply(this, args)
    }
  }
}
```

## Comparison with NestJS

### Similarities
- Decorator-based architecture
- Dependency injection
- DTO validation
- Exception handling
- Guards system

### Differences
- Built on Next.js (not Express)
- File-based routing (Next.js style)
- Smaller bundle (fewer abstractions)
- Integrated with React
- Serverless-friendly

## Migration Guide

### From Express/NestJS

1. Controllers map directly
2. Services remain the same
3. Guards are similar
4. DTOs are identical
5. Routes are file-based instead of decorator-based

### From Next.js API Routes

1. Move logic to services
2. Add DTOs for validation
3. Use controllers for routing
4. Apply proper error handling
5. Add dependency injection

## Troubleshooting

### Common Issues

**"Cannot resolve dependency"**
- Ensure `@Injectable()` decorator is applied
- Check import paths
- Verify reflect-metadata is imported

**"Validation not working"**
- Import DTO class in route file
- Pass DTO to createRouteHandler
- Check class-validator decorators

**"Guards not executing"**
- Apply @UseGuards decorator
- Ensure guard implements canActivate
- Check guard is Injectable

**"Parameters undefined"**
- Use parameter decorators (@Body, @Query, etc.)
- Verify request content-type
- Check route parameter names match

## Future Enhancements

Potential additions:
- Interceptors for response transformation
- WebSocket support
- GraphQL integration
- OpenAPI/Swagger generation
- Rate limiting
- Caching layer
- Database integration (Prisma, TypeORM)
- Authentication providers
