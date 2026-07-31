# Nexst Architecture: Unified Front-End & Back-End

This document outlines the design decisions behind **Nexst**—specifically, why we choose to co-locate the Frontend (FE) and Backend (BE) using NestJS-style architecture patterns inside a Next.js App Router project.

---

## The Core Philosophy: "Boring" is Scalable

Many teams split their stacks early: a separate Single Page Application (React/Vue) and a decoupled Backend API (Go, Python, NestJS/Node). While this works for large, hyper-specialized teams, it introduces massive tax for 90% of product lifecycles:

1. **Deployment Synchronization**: Shipping a feature requires deploying BE, waiting for migrations, then deploying FE, managing API version drift.
2. **Type Duplication**: Constantly rewriting TypeScript interfaces, API clients, and validation models on both ends.
3. **Infrastructure Overhead**: Running separate CDN setups, Kubernetes services, load balancers, CI pipelines, and environment variables.

**Nexst** bypasses this complexity by unifying them into one codebase under the **Next.js App Router** but imposing **strict NestJS backend discipline**.

---

## Why Front-End and Back-End Together?

Co-locating your front-end and back-end in a unified framework like Next.js yields three massive operational wins:

### 1. Zero-Cost Shared Types
You don't need code generators or OpenAPI sync tools. If a DTO changes on the backend, the frontend typescript type-checker immediately flags it in the forms, API clients, or components. 
```typescript
// Shared directly by frontend and backend
import { CreateUserDto } from '@/server/dto/user.dto'
```

### 2. Monolithic Simplicity, Serverless Scaling
Nexst builds into a single deployment target (e.g., Vercel, Netlify, Docker, or AWS Amplify). Next.js automatically splits your API endpoints into isolated serverless functions (or a single monolith container), giving you cheap, granular scaling with zero infrastructure configuration.

### 3. Immediate Server-Side Rendering (SSR) & Server Actions
Colocation allows React Server Components to query services or databases directly during server rendering without making slow HTTP requests to a external backend:
```typescript
// src/app/users/page.tsx (Server Component)
import { container } from '@/server/container'
import { UserService } from '@/server/services/user.service'

export default async function UsersPage() {
  const userService = container.resolve(UserService)
  const users = await userService.findAll() // Direct server-side DB call!
  return <UserList users={users} />
}
```

---

## Why NestJS Architecture inside Next.js?

Next.js is notoriously unopinionated about how you write your backend APIs. Developers often end up writing raw SQL inside API route handlers, leading to unmaintainable spaghetti code. 

Nexst brings **NestJS discipline** to Next.js API routes:

### 1. Separation of Concerns (SoC)
Rather than writing logic in route handlers, we divide concerns:
- **Routes (`src/app/api/...`)**: HTTP Entrypoint, maps to a Controller.
- **Controllers (`src/server/controllers/...`)**: Parses requests, triggers guards, delegates to services.
- **Services (`src/server/services/...`)**: Business logic.
- **Repositories (`src/server/database/repositories/...`)**: Data access layer.
- **DTOs (`src/server/dto/...`)**: Strict validation at the trust boundary.

### 2. Real Dependency Injection (DI)
Nexst uses TSyringe to build a true DI container. This makes mocking dependencies during testing trivial and prevents class instantiation spaghetti:
```typescript
@Injectable()
export class OrderService {
  constructor(
    private userService: UserService,
    private paymentService: PaymentService
  ) {}
}
```

### 3. Declarative Security & Validation via Decorators
Guards and validation logic are declared on classes and methods rather than nested in conditionals:
```typescript
@Controller('/admin')
@UseGuards(AuthGuard, RoleGuard)
export class AdminController {
  @Post()
  async create(@Body() dto: CreateAdminDto) { ... }
}
```

---

## The Best of Both Worlds

Nexst combines the developer experience and performance of Next.js frontend (SSR, ISR, Server Components) with the maintainability, scalability, and testability of an enterprise NestJS backend. You write clean backend code, test it easily with Jest, deploy it in one click, and share types seamlessly with your UI.
