/**
 * Integration tests for the /api/auth/* route handlers
 */
import 'reflect-metadata'
import { NextRequest } from 'next/server'
import { POST as registerPOST } from '../auth/register/route'
import { POST as loginPOST } from '../auth/login/route'
import { POST as refreshPOST } from '../auth/refresh/route'
import { POST as logoutPOST } from '../auth/logout/route'
import { POST as changePasswordPOST } from '../auth/change-password/route'
import { GET as meGET } from '../auth/me/route'
import { container } from '@/server/container/container'
import { PrismaService } from '@/server/database/prisma.service'

function jsonRequest(
  path: string,
  method: string,
  body?: unknown,
  headers: Record<string, string> = {}
) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

describe('Auth API routes', () => {
  const credentials = {
    name: 'Route Tester',
    email: 'route.tester@example.com',
    password: 'Str0ng!Passw0rd',
  }

  beforeEach(async () => {
    await container.resolve(PrismaService).cleanDatabase()
  })

  it('exports a handler for every auth route', () => {
    for (const handler of [
      registerPOST,
      loginPOST,
      refreshPOST,
      logoutPOST,
      changePasswordPOST,
      meGET,
    ]) {
      expect(typeof handler).toBe('function')
    }
  })

  it('rejects an invalid login body with 400', async () => {
    const response = await loginPOST(
      jsonRequest('/api/auth/login', 'POST', { email: 'not-an-email' })
    )
    expect(response.status).toBe(400)
  })

  it('returns 401 from /me without a bearer token', async () => {
    const response = await meGET(jsonRequest('/api/auth/me', 'GET'))
    expect(response.status).toBe(401)
  })

  it('supports register, login, me, refresh, change-password and logout', async () => {
    const registerRes = await registerPOST(
      jsonRequest('/api/auth/register', 'POST', credentials)
    )
    expect(registerRes.status).toBe(200)

    const loginRes = await loginPOST(
      jsonRequest('/api/auth/login', 'POST', {
        email: credentials.email,
        password: credentials.password,
      })
    )
    expect(loginRes.status).toBe(200)
    const { data } = await loginRes.json()
    const { accessToken, refreshToken } = data.tokens

    const meRes = await meGET(
      jsonRequest('/api/auth/me', 'GET', undefined, {
        authorization: `Bearer ${accessToken}`,
      })
    )
    expect(meRes.status).toBe(200)
    expect((await meRes.json()).data.email).toBe(credentials.email)

    const refreshRes = await refreshPOST(
      jsonRequest('/api/auth/refresh', 'POST', { refreshToken })
    )
    expect(refreshRes.status).toBe(200)
    const newTokens = (await refreshRes.json()).data

    const changeRes = await changePasswordPOST(
      jsonRequest(
        '/api/auth/change-password',
        'POST',
        { currentPassword: credentials.password, newPassword: 'N3w!Passw0rd!' },
        { authorization: `Bearer ${newTokens.accessToken}` }
      )
    )
    expect(changeRes.status).toBe(200)

    const logoutRes = await logoutPOST(
      jsonRequest('/api/auth/logout', 'POST', {
        refreshToken: newTokens.refreshToken,
      })
    )
    expect(logoutRes.status).toBe(200)
  })
})
