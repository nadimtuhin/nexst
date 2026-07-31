# Testing Reference

Nexst uses **Jest** with a shared SQLite database per test suite for fast, reliable tests. All services and controllers are wired through TSyringe's DI container.

---

## Setup Pattern

Every test file follows this structure:

```typescript
import 'reflect-metadata'
import { container } from 'tsyringe'
import { PrismaService } from '@/server/database/prisma.service'
import { UserService } from '@/server/services/user.service'

let prisma: PrismaService
let service: UserService

beforeEach(async () => {
  container.clearInstances()
  prisma = container.resolve(PrismaService)
  service = container.resolve(UserService)
  await prisma.cleanDatabase()       // Reset DB state between tests
})

afterAll(async () => {
  await prisma.$disconnect()
})
```

Key rules:
- `reflect-metadata` **must** be the first import.
- `container.clearInstances()` prevents stale singleton bleed between tests.
- `prisma.cleanDatabase()` clears all rows and resets auto-increment counters (IDs restart at 1).

---

## Unit Test: Service

```typescript
describe('UserService', () => {
  it('creates a user', async () => {
    const user = await service.create({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret123'
    })

    expect(user.id).toBe(1)
    expect(user.email).toBe('alice@example.com')
  })

  it('throws ConflictException on duplicate email', async () => {
    await service.create({ name: 'Alice', email: 'alice@example.com', password: 'secret123' })

    await expect(
      service.create({ name: 'Bob', email: 'alice@example.com', password: 'other123' })
    ).rejects.toThrow('Email already exists')
  })
})
```

---

## Unit Test: Controller

```typescript
import { UserController } from '@/server/controllers/user.controller'

let controller: UserController

beforeEach(async () => {
  container.clearInstances()
  prisma = container.resolve(PrismaService)
  controller = container.resolve(UserController)
  await prisma.cleanDatabase()
  await prisma.user.create({
    data: { name: 'Alice', email: 'alice@example.com', password: 'hashed' }
  })
})

describe('UserController', () => {
  it('getUsers returns seeded users', async () => {
    const result = await controller.getUsers()
    expect(result.data).toHaveLength(1)
    expect(result.data[0].email).toBe('alice@example.com')
  })
})
```

---

## Integration Test: API Route

Integration tests hit the full route handler stack (guards → validation → controller → service):

```typescript
import { createRouteHandler } from '@/server/core/route-handler'
import { UserController } from '@/server/controllers/user.controller'
import { CreateUserDto } from '@/server/dto/user.dto'
import { NextRequest } from 'next/server'

const POST = createRouteHandler(UserController, 'createUser', CreateUserDto)

it('POST /api/users creates a user', async () => {
  const req = new NextRequest('http://localhost/api/users', {
    method: 'POST',
    body: JSON.stringify({ name: 'Alice', email: 'alice@example.com', password: 'secret123' }),
    headers: { 'Content-Type': 'application/json' }
  })

  const res = await POST(req)
  const body = await res.json()

  expect(res.status).toBe(201)
  expect(body.data.email).toBe('alice@example.com')
})
```

---

## Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Single file
npx jest src/server/services/__tests__/user.service.test.ts

# Coverage
npm run test:coverage
```

---

## Pitfalls

| Problem | Cause | Fix |
|---------|-------|-----|
| `reflect-metadata` error | Not imported first | Add `import 'reflect-metadata'` at top |
| Tests pollute each other | No `cleanDatabase()` | Call `await prisma.cleanDatabase()` in `beforeEach` |
| IDs not starting at 1 | Auto-increment not reset | `cleanDatabase()` resets `sqlite_sequence` |
| `ConflictException` on re-run | Email already in DB | Same — call `cleanDatabase()` before each test |
| `container.resolve` returns stale instance | No `clearInstances()` | Call `container.clearInstances()` before each test |
