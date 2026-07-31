# Guards Reference

Guards control access to controller methods. They run before the controller action and can short-circuit the request with a 401/403 response.

---

## Built-in Guards

### `AuthGuard`
Validates the `Authorization: Bearer <token>` header. Extracts user from JWT and attaches to request context.

```typescript
import { AuthGuard } from '@/server/guards/auth.guard'

@Controller('/profile')
@UseGuards(AuthGuard)
export class ProfileController {}
```

**On failure**: throws `UnauthorizedException (401)`.

---

### `RoleGuard`
Checks that the authenticated user's role matches the required role. Must be used **after** `AuthGuard` (relies on user being in context).

```typescript
import { AuthGuard } from '@/server/guards/auth.guard'
import { RoleGuard } from '@/server/guards/role.guard'
import { Roles } from '@/server/decorators/roles.decorator'

@Controller('/admin')
@UseGuards(AuthGuard, RoleGuard)
@Roles('admin')
export class AdminController {}
```

**On failure**: throws `ForbiddenException (403)`.

---

### `TenantGuard`
Validates that the `x-tenant-id` header resolves to an existing, active tenant. Used for multi-tenant routes.

```typescript
import { TenantGuard } from '@/server/guards/tenant.guard'

@Controller('/tenant-resources')
@UseGuards(AuthGuard, TenantGuard)
export class TenantController {}
```

**On failure**: throws `UnauthorizedException (401)` or `ForbiddenException (403)`.

---

## Writing a Custom Guard

Guards implement a `canActivate(req: NextRequest): boolean | Promise<boolean>` contract:

```typescript
import { Injectable } from '@/server/decorators'
import type { NextRequest } from 'next/server'

@Injectable()
export class ApiKeyGuard {
  canActivate(req: NextRequest): boolean {
    const key = req.headers.get('x-api-key')
    return key === process.env.INTERNAL_API_KEY
  }
}
```

Then use it like any built-in guard:

```typescript
@UseGuards(ApiKeyGuard)
export class WebhookController {}
```

---

## Guard Execution Order

Guards run **left-to-right** in the `@UseGuards()` argument list. If one guard fails, subsequent guards are not evaluated.

```typescript
// AuthGuard runs first, RoleGuard second
@UseGuards(AuthGuard, RoleGuard)
```
