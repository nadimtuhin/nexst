import 'reflect-metadata'
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandler } from '../route-handler'
import { Controller } from '../../decorators/controller.decorator'
import { Get, Post } from '../../decorators/http-methods.decorator'
import { Body, Query, Param, Req } from '../../decorators/param.decorator'
import { UseGuards } from '../../decorators/guards.decorator'
import { Injectable } from '../../decorators/injectable.decorator'
import { container } from '../../container/container'
import { BadRequestException, UnauthorizedException } from '../../filters'
import { IsString, IsEmail, IsNumber, Min } from 'class-validator'

// Test DTO
class TestDto {
  @IsString()
  name!: string

  @IsEmail()
  email!: string

  @IsNumber()
  @Min(18)
  age?: number
}

// Test Guard
@Injectable()
class TestGuard {
  async canActivate(context: any): Promise<boolean> {
    const apiKey = context.request.headers.get('x-api-key')
    if (!apiKey || apiKey !== 'valid-key') {
      throw new UnauthorizedException('Invalid API key')
    }
    return true
  }
}

// Test Guard that returns false
@Injectable()
class RejectGuard {
  async canActivate(context: any): Promise<boolean> {
    return false
  }
}

// Test Controller
@Injectable()
@Controller('/test')
class TestController {
  @Get()
  async getAll(@Query() query: any) {
    return { message: 'getAll', query }
  }

  @Get()
  async getWithQueryParam(@Query('search') search: string) {
    return { message: 'getWithQueryParam', search }
  }

  @Get()
  async getWithParam(@Param('id') id: string) {
    return { message: 'getWithParam', id }
  }

  @Post()
  async create(@Body() body: any) {
    return { message: 'create', body }
  }

  @Post()
  async createWithDto(@Body() dto: TestDto) {
    return { message: 'createWithDto', dto }
  }

  @Post()
  async createWithBodyParam(@Body('name') name: string) {
    return { message: 'createWithBodyParam', name }
  }

  @UseGuards(TestGuard)
  @Get()
  async protectedRoute(@Query() query: any) {
    return { message: 'protectedRoute', query }
  }

  @UseGuards(RejectGuard)
  @Get()
  async rejectedRoute() {
    return { message: 'rejectedRoute' }
  }

  @Get()
  async throwError() {
    throw new BadRequestException('Test error')
  }

  @Get()
  async withRequest(@Req() request: NextRequest) {
    return { message: 'withRequest', url: request.url }
  }

  @Get()
  async returnNextResponse() {
    return NextResponse.json({ custom: 'response' }, { status: 201 })
  }
}

// Test Controller with class-level guard
@Injectable()
@Controller('/protected')
@UseGuards(TestGuard)
class ProtectedController {
  @Get()
  async getData() {
    return { message: 'protected data' }
  }
}

describe('createRouteHandler', () => {
  beforeEach(() => {
    container.clearInstances()
  })

  describe('Query Parameters', () => {
    it('should extract all query parameters', async () => {
      const handler = createRouteHandler(TestController, 'getAll')
      const request = new NextRequest('http://localhost/test?page=1&limit=10')

      const response = await handler(request)
      const data = await response.json()

      expect(data.message).toBe('getAll')
      expect(data.query).toEqual({ page: '1', limit: '10' })
    })

    it('should extract specific query parameter', async () => {
      const handler = createRouteHandler(TestController, 'getWithQueryParam')
      const request = new NextRequest('http://localhost/test?search=john')

      const response = await handler(request)
      const data = await response.json()

      expect(data.message).toBe('getWithQueryParam')
      expect(data.search).toBe('john')
    })

    it('should handle empty query parameters', async () => {
      const handler = createRouteHandler(TestController, 'getAll')
      const request = new NextRequest('http://localhost/test')

      const response = await handler(request)
      const data = await response.json()

      expect(data.query).toEqual({})
    })

    it('should handle multiple values for same query key', async () => {
      const handler = createRouteHandler(TestController, 'getAll')
      const request = new NextRequest('http://localhost/test?tag=javascript&tag=typescript')

      const response = await handler(request)
      const data = await response.json()

      // URL searchParams only keeps the last value for duplicate keys
      expect(data.query.tag).toBe('typescript')
    })
  })

  describe('Route Parameters', () => {
    it('should extract route parameter', async () => {
      const handler = createRouteHandler(TestController, 'getWithParam')
      const request = new NextRequest('http://localhost/test/123')

      const response = await handler(request, { params: { id: '123' } })
      const data = await response.json()

      expect(data.message).toBe('getWithParam')
      expect(data.id).toBe('123')
    })

    it('should handle missing route parameters', async () => {
      const handler = createRouteHandler(TestController, 'getWithParam')
      const request = new NextRequest('http://localhost/test')

      const response = await handler(request, { params: {} })
      const data = await response.json()

      expect(data.id).toBeUndefined()
    })
  })

  describe('Body Parameters', () => {
    it('should extract request body', async () => {
      const handler = createRouteHandler(TestController, 'create')
      const body = { name: 'John', email: 'john@example.com' }
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })

      const response = await handler(request)
      const data = await response.json()

      expect(data.message).toBe('create')
      expect(data.body).toEqual(body)
    })

    it('should extract specific body parameter', async () => {
      const handler = createRouteHandler(TestController, 'createWithBodyParam')
      const body = { name: 'John', email: 'john@example.com' }
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })

      const response = await handler(request)
      const data = await response.json()

      expect(data.message).toBe('createWithBodyParam')
      expect(data.name).toBe('John')
    })

    it('should handle PUT method body', async () => {
      const handler = createRouteHandler(TestController, 'create')
      const body = { name: 'Updated' }
      const request = new NextRequest('http://localhost/test', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })

      const response = await handler(request)
      const data = await response.json()

      expect(data.body).toEqual(body)
    })

    it('should handle PATCH method body', async () => {
      const handler = createRouteHandler(TestController, 'create')
      const body = { name: 'Patched' }
      const request = new NextRequest('http://localhost/test', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })

      const response = await handler(request)
      const data = await response.json()

      expect(data.body).toEqual(body)
    })

    it('should handle missing content-type header', async () => {
      const handler = createRouteHandler(TestController, 'create')
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body: JSON.stringify({ name: 'John' }),
      })

      const response = await handler(request)
      const data = await response.json()

      expect(data.body).toEqual({})
    })

    it('should handle non-JSON content-type', async () => {
      const handler = createRouteHandler(TestController, 'create')
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: 'plain text',
      })

      const response = await handler(request)
      const data = await response.json()

      expect(data.body).toEqual({})
    })

    it('should handle invalid JSON body', async () => {
      const handler = createRouteHandler(TestController, 'create')
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid json',
      })

      const response = await handler(request)
      const data = await response.json()

      expect(data.body).toEqual({})
    })
  })

  describe('Validation with DTO', () => {
    it('should validate and transform body with DTO', async () => {
      const handler = createRouteHandler(TestController, 'createWithDto', TestDto)
      const body = { name: 'John Doe', email: 'john@example.com', age: 30 }
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })

      const response = await handler(request)
      const data = await response.json()

      expect(data.message).toBe('createWithDto')
      expect(data.dto).toMatchObject(body)
    })

    it('should throw validation error for invalid email', async () => {
      const handler = createRouteHandler(TestController, 'createWithDto', TestDto)
      const body = { name: 'John', email: 'invalid-email', age: 30 }
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })

      const response = await handler(request)

      expect(response.status).toBe(400)
    })

    it('should throw validation error for age below minimum', async () => {
      const handler = createRouteHandler(TestController, 'createWithDto', TestDto)
      const body = { name: 'John', email: 'john@example.com', age: 17 }
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })

      const response = await handler(request)

      expect(response.status).toBe(400)
    })
  })

  describe('Guards', () => {
    it('should execute method-level guard', async () => {
      const handler = createRouteHandler(TestController, 'protectedRoute')
      const request = new NextRequest('http://localhost/test?data=test', {
        headers: { 'x-api-key': 'valid-key' },
      })

      const response = await handler(request)
      const data = await response.json()

      expect(data.message).toBe('protectedRoute')
    })

    it('should reject request with invalid guard', async () => {
      const handler = createRouteHandler(TestController, 'protectedRoute')
      const request = new NextRequest('http://localhost/test')

      const response = await handler(request)

      expect(response.status).toBe(401)
    })

    it('should return 403 when guard returns false', async () => {
      const handler = createRouteHandler(TestController, 'rejectedRoute')
      const request = new NextRequest('http://localhost/test')

      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.message).toBe('Forbidden')
    })

    it('should execute class-level guard', async () => {
      const handler = createRouteHandler(ProtectedController, 'getData')
      const request = new NextRequest('http://localhost/protected', {
        headers: { 'x-api-key': 'valid-key' },
      })

      const response = await handler(request)
      const data = await response.json()

      expect(data.message).toBe('protected data')
    })

    it('should reject class-level guard with invalid key', async () => {
      const handler = createRouteHandler(ProtectedController, 'getData')
      const request = new NextRequest('http://localhost/protected')

      const response = await handler(request)

      expect(response.status).toBe(401)
    })
  })

  describe('Request Parameter', () => {
    it('should inject NextRequest object', async () => {
      const handler = createRouteHandler(TestController, 'withRequest')
      const request = new NextRequest('http://localhost/test')

      const response = await handler(request)
      const data = await response.json()

      expect(data.message).toBe('withRequest')
      expect(data.url).toBe('http://localhost/test')
    })
  })

  describe('Response Handling', () => {
    it('should return NextResponse if controller returns it', async () => {
      const handler = createRouteHandler(TestController, 'returnNextResponse')
      const request = new NextRequest('http://localhost/test')

      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.custom).toBe('response')
    })

    it('should wrap result in NextResponse.json by default', async () => {
      const handler = createRouteHandler(TestController, 'getAll')
      const request = new NextRequest('http://localhost/test')

      const response = await handler(request)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(200)
    })
  })

  describe('Exception Handling', () => {
    it('should catch and handle exceptions', async () => {
      const handler = createRouteHandler(TestController, 'throwError')
      const request = new NextRequest('http://localhost/test')

      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe('Test error')
    })
  })

  describe('Dependency Injection', () => {
    it('should resolve controller from DI container', async () => {
      const handler = createRouteHandler(TestController, 'getAll')
      const request = new NextRequest('http://localhost/test')

      const response = await handler(request)
      const data = await response.json()

      expect(data.message).toBe('getAll')
    })

    it('should resolve guards from DI container', async () => {
      const handler = createRouteHandler(TestController, 'protectedRoute')
      const request = new NextRequest('http://localhost/test', {
        headers: { 'x-api-key': 'valid-key' },
      })

      const response = await handler(request)

      expect(response.status).toBe(200)
    })
  })
})
