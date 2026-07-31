# Decorator Reference

All decorators live in `@/server/decorators`. Import only what you need.

---

## Class Decorators

### `@Injectable()`
Marks a class as a DI-managed singleton. Required for services, repositories, and any class resolved via TSyringe container.

```typescript
@Injectable()
export class UserService {}
```

### `@Controller(prefix: string)`
Marks a class as an HTTP controller. The prefix is prepended to all route method paths defined in the class.

```typescript
@Controller('/users')
export class UserController {}
```

### `@UseGuards(...guards)`
Attaches one or more guards to a controller class or individual method. Guards run in declaration order.

```typescript
@Controller('/admin')
@UseGuards(AuthGuard, RoleGuard)
export class AdminController {}
```

---

## Method Decorators (HTTP Verbs)

| Decorator | HTTP Method | Example |
|-----------|-------------|---------|
| `@Get(path?)` | GET | `@Get('/:id')` |
| `@Post(path?)` | POST | `@Post()` |
| `@Put(path?)` | PUT | `@Put('/:id')` |
| `@Patch(path?)` | PATCH | `@Patch('/:id')` |
| `@Delete(path?)` | DELETE | `@Delete('/:id')` |

All `path` arguments are optional. If omitted, inherits the controller prefix.

---

## Parameter Decorators

### `@Body()`
Injects the parsed and validated request body. Requires a DTO class defined in the route handler mapping.

```typescript
async create(@Body() dto: CreateUserDto) {}
```

### `@Param(key: string)`
Extracts a named URL parameter.

```typescript
// Route: GET /users/:id
async findOne(@Param('id') id: string) {}
```

### `@Query(key?: string)`
Extracts a query string parameter. If `key` is omitted, returns the entire query object.

```typescript
// GET /users?page=2
async list(@Query('page') page: string) {}
```

### `@Req()`
Injects the raw Next.js `NextRequest` object. Use only when you need access to headers, cookies, or raw body.

```typescript
async me(@Req() req: NextRequest) {
  const token = req.headers.get('Authorization')
}
```

---

## Guard Decorators

```typescript
import { UseGuards } from '@/server/decorators'
import { AuthGuard } from '@/server/guards/auth.guard'
import { RoleGuard } from '@/server/guards/role.guard'

@UseGuards(AuthGuard)                    // Requires valid JWT
@UseGuards(AuthGuard, RoleGuard)         // Auth + role check
```

See `documentation/GUARDS.md` for guard implementation details.
