/**
 * End-to-end tests for the /api/auth endpoints.
 *
 * These drive the real Next.js route handlers (register/login/refresh/logout/
 * me/change-password) through the DI container, guards, validation pipe, and
 * database — the same path a real HTTP request takes. The database is reset
 * before each test so cases stay isolated.
 */
import 'reflect-metadata'
import { NextRequest } from 'next/server'
import { container } from '@/server/container/container'
import { PrismaService } from '@/server/database/prisma.service'

import { POST as register } from '../auth/register/route'
import { POST as login } from '../auth/login/route'
import { POST as refresh } from '../auth/refresh/route'
import { POST as logout } from '../auth/logout/route'
import { GET as me } from '../auth/me/route'
import { POST as changePassword } from '../auth/change-password/route'

const BASE = 'http://localhost/api/auth'

/** Build a JSON POST request for a route handler. */
function post(path: string, body: unknown, token?: string): NextRequest {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (token) headers.authorization = `Bearer ${token}`
  return new NextRequest(`${BASE}/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

/** Build a GET request, optionally authenticated. */
function get(path: string, token?: string): NextRequest {
  const headers: Record<string, string> = {}
  if (token) headers.authorization = `Bearer ${token}`
  return new NextRequest(`${BASE}/${path}`, { method: 'GET', headers })
}

const validUser = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  password: 'SecurePass123!',
}

/** Register a user and return the parsed tokens + user. */
async function registerUser(overrides: Partial<typeof validUser> = {}) {
  const res = await register(post('register', { ...validUser, ...overrides }))
  const json = await res.json()
  return { res, json, data: json.data }
}

describe('Auth API (e2e)', () => {
  let prisma: PrismaService

  beforeAll(async () => {
    prisma = container.resolve(PrismaService)
    await prisma.onModuleInit()
  })

  beforeEach(async () => {
    await prisma.cleanDatabase()
  })

  afterEach(async () => {
    await prisma.cleanDatabase()
  })

  afterAll(async () => {
    await prisma.onModuleDestroy()
  })

  describe('POST /register', () => {
    it('registers a new user and returns tokens', async () => {
      const { res, data } = await registerUser()
      expect(res.status).toBe(200)
      expect(data.user.email).toBe(validUser.email)
      expect(data.user.role).toBe('USER')
      expect(data.tokens.accessToken).toBeDefined()
      expect(data.tokens.refreshToken).toBeDefined()
    })

    it('rejects duplicate registration with 409', async () => {
      await registerUser()
      const res = await register(post('register', validUser))
      expect(res.status).toBe(409)
    })

    it('rejects a weak password with 400', async () => {
      // Passes the DTO length check (>=8) but fails strength rules in the service.
      const res = await register(post('register', { ...validUser, password: 'alllowercase' }))
      expect(res.status).toBe(400)
    })

    it('rejects missing required fields with 400', async () => {
      const res = await register(post('register', { email: 'x@example.com' }))
      expect(res.status).toBe(400)
    })

    it('rejects an invalid email with 400', async () => {
      const res = await register(post('register', { ...validUser, email: 'not-an-email' }))
      expect(res.status).toBe(400)
    })
  })

  describe('POST /login', () => {
    beforeEach(async () => {
      await registerUser()
    })

    it('logs in with correct credentials', async () => {
      const res = await login(post('login', { email: validUser.email, password: validUser.password }))
      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.tokens.accessToken).toBeDefined()
    })

    it('rejects a wrong password with 401', async () => {
      const res = await login(post('login', { email: validUser.email, password: 'WrongPass123!' }))
      expect(res.status).toBe(401)
    })

    it('rejects a non-existent email with 401', async () => {
      const res = await login(post('login', { email: 'nobody@example.com', password: validUser.password }))
      expect(res.status).toBe(401)
    })

    it('rejects an inactive account with 401', async () => {
      await prisma.user.updateMany({ where: { email: validUser.email }, data: { isActive: false } })
      const res = await login(post('login', { email: validUser.email, password: validUser.password }))
      expect(res.status).toBe(401)
    })

    it('rejects a missing password with 400', async () => {
      const res = await login(post('login', { email: validUser.email }))
      expect(res.status).toBe(400)
    })
  })

  describe('POST /refresh', () => {
    it('rotates tokens and revokes the old refresh token', async () => {
      const { data } = await registerUser()
      const oldRefresh = data.tokens.refreshToken

      const res = await refresh(post('refresh', { refreshToken: oldRefresh }))
      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.refreshToken).toBeDefined()
      expect(json.data.refreshToken).not.toBe(oldRefresh)

      // Old (now revoked) token can no longer be used.
      const reuse = await refresh(post('refresh', { refreshToken: oldRefresh }))
      expect(reuse.status).toBe(401)
    })

    it('rejects an unknown/invalid refresh token with 401', async () => {
      const res = await refresh(post('refresh', { refreshToken: 'garbage.token.value' }))
      expect(res.status).toBe(401)
    })

    it('rejects a missing refresh token with 400', async () => {
      const res = await refresh(post('refresh', {}))
      expect(res.status).toBe(400)
    })
  })

  describe('POST /logout', () => {
    it('revokes the refresh token so it can no longer refresh', async () => {
      const { data } = await registerUser()
      const token = data.tokens.refreshToken

      const res = await logout(post('logout', { refreshToken: token }))
      expect(res.status).toBe(200)

      const afterLogout = await refresh(post('refresh', { refreshToken: token }))
      expect(afterLogout.status).toBe(401)
    })

    it('is idempotent for an unknown token (still 200)', async () => {
      const res = await logout(post('logout', { refreshToken: 'never.stored.token' }))
      expect(res.status).toBe(200)
    })

    it('rejects a missing refresh token with 400', async () => {
      const res = await logout(post('logout', {}))
      expect(res.status).toBe(400)
    })
  })

  describe('GET /me', () => {
    it('returns the current user with a valid access token', async () => {
      const { data } = await registerUser()
      const res = await me(get('me', data.tokens.accessToken))
      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.email).toBe(validUser.email)
    })

    it('rejects a request with no token with 401', async () => {
      const res = await me(get('me'))
      expect(res.status).toBe(401)
    })

    it('rejects an invalid token with 401', async () => {
      const res = await me(get('me', 'not-a-real-jwt'))
      expect(res.status).toBe(401)
    })
  })

  describe('POST /change-password', () => {
    it('changes the password: old fails, new works', async () => {
      const { data } = await registerUser()
      const token = data.tokens.accessToken
      const newPassword = 'BrandNewPass456!'

      const res = await changePassword(
        post('change-password', { currentPassword: validUser.password, newPassword }, token)
      )
      expect(res.status).toBe(200)

      const oldLogin = await login(post('login', { email: validUser.email, password: validUser.password }))
      expect(oldLogin.status).toBe(401)

      const newLogin = await login(post('login', { email: validUser.email, password: newPassword }))
      expect(newLogin.status).toBe(200)
    })

    it('rejects an incorrect current password with 401', async () => {
      const { data } = await registerUser()
      const res = await changePassword(
        post('change-password', { currentPassword: 'WrongCurrent1!', newPassword: 'BrandNewPass456!' }, data.tokens.accessToken)
      )
      expect(res.status).toBe(401)
    })

    it('rejects a weak new password with 400', async () => {
      const { data } = await registerUser()
      const res = await changePassword(
        post('change-password', { currentPassword: validUser.password, newPassword: 'alllowercase' }, data.tokens.accessToken)
      )
      expect(res.status).toBe(400)
    })

    it('rejects an unauthenticated request with 401', async () => {
      const res = await changePassword(
        post('change-password', { currentPassword: validUser.password, newPassword: 'BrandNewPass456!' })
      )
      expect(res.status).toBe(401)
    })
  })
})
