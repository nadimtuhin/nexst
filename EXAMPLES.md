# Usage Examples

## Table of Contents

1. [Basic CRUD Operations](#basic-crud-operations)
2. [Authentication & Authorization](#authentication--authorization)
3. [File Upload](#file-upload)
4. [Pagination & Filtering](#pagination--filtering)
5. [Error Handling](#error-handling)
6. [Testing](#testing)

## Basic CRUD Operations

### Complete CRUD Example

Let's build a Product API from scratch:

#### 1. Create the DTO

```typescript
// src/server/dto/product.dto.ts
import { IsString, IsNumber, IsOptional, Min, MaxLength } from 'class-validator'

export class CreateProductDto {
  @IsString()
  @MaxLength(100)
  name!: string

  @IsString()
  @MaxLength(500)
  description!: string

  @IsNumber()
  @Min(0)
  price!: number

  @IsNumber()
  @Min(0)
  stock!: number
}

export class UpdateProductDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number
}
```

#### 2. Create the Service

```typescript
// src/server/services/product.service.ts
import { Injectable } from '../decorators'
import { NotFoundException, ConflictException } from '../filters'
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto'

interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class ProductService {
  private products: Product[] = []
  private nextId = 1

  async findAll(): Promise<Product[]> {
    return this.products
  }

  async findOne(id: number): Promise<Product> {
    const product = this.products.find(p => p.id === id)

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`)
    }

    return product
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product: Product = {
      id: this.nextId++,
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.products.push(product)
    return product
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id)

    Object.assign(product, {
      ...dto,
      updatedAt: new Date(),
    })

    return product
  }

  async remove(id: number): Promise<void> {
    const index = this.products.findIndex(p => p.id === id)

    if (index === -1) {
      throw new NotFoundException(`Product with ID ${id} not found`)
    }

    this.products.splice(index, 1)
  }
}
```

#### 3. Create the Controller

```typescript
// src/server/controllers/product.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param } from '../decorators'
import { ProductService } from '../services/product.service'
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto'

@Controller('/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async getAllProducts() {
    const products = await this.productService.findAll()
    return { data: products }
  }

  @Get('/:id')
  async getProduct(@Param('id') id: string) {
    const product = await this.productService.findOne(parseInt(id))
    return { data: product }
  }

  @Post()
  async createProduct(@Body() dto: CreateProductDto) {
    const product = await this.productService.create(dto)
    return {
      data: product,
      message: 'Product created successfully',
    }
  }

  @Put('/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto
  ) {
    const product = await this.productService.update(parseInt(id), dto)
    return {
      data: product,
      message: 'Product updated successfully',
    }
  }

  @Delete('/:id')
  async deleteProduct(@Param('id') id: string) {
    await this.productService.remove(parseInt(id))
    return { message: 'Product deleted successfully' }
  }
}
```

#### 4. Register the Routes

```typescript
// src/app/api/products/route.ts
import 'reflect-metadata'
import { ProductController } from '@/server/controllers/product.controller'
import { createRouteHandler } from '@/server/core/route-handler'
import { CreateProductDto } from '@/server/dto/product.dto'

export const GET = createRouteHandler(ProductController, 'getAllProducts')
export const POST = createRouteHandler(ProductController, 'createProduct', CreateProductDto)
```

```typescript
// src/app/api/products/[id]/route.ts
import 'reflect-metadata'
import { ProductController } from '@/server/controllers/product.controller'
import { createRouteHandler } from '@/server/core/route-handler'
import { UpdateProductDto } from '@/server/dto/product.dto'

export const GET = createRouteHandler(ProductController, 'getProduct')
export const PUT = createRouteHandler(ProductController, 'updateProduct', UpdateProductDto)
export const DELETE = createRouteHandler(ProductController, 'deleteProduct')
```

## Authentication & Authorization

### JWT Authentication Example

#### 1. Create Auth DTOs

```typescript
// src/server/dto/auth.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(6)
  password!: string
}

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name!: string

  @IsEmail()
  email!: string

  @IsString()
  @MinLength(6)
  password!: string
}
```

#### 2. Create Auth Service

```typescript
// src/server/services/auth.service.ts
import { Injectable } from '../decorators'
import { UnauthorizedException } from '../filters'
import { LoginDto, RegisterDto } from '../dto/auth.dto'

@Injectable()
export class AuthService {
  private users = new Map<string, any>()

  async register(dto: RegisterDto) {
    if (this.users.has(dto.email)) {
      throw new ConflictException('Email already exists')
    }

    // In production: hash password with bcrypt
    const user = {
      id: Date.now(),
      name: dto.name,
      email: dto.email,
      password: dto.password, // Should be hashed!
    }

    this.users.set(dto.email, user)

    // Generate JWT token
    const token = this.generateToken(user)

    return {
      user: { id: user.id, name: user.name, email: user.email },
      token,
    }
  }

  async login(dto: LoginDto) {
    const user = this.users.get(dto.email)

    if (!user || user.password !== dto.password) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const token = this.generateToken(user)

    return {
      user: { id: user.id, name: user.name, email: user.email },
      token,
    }
  }

  private generateToken(user: any): string {
    // In production: use jsonwebtoken
    return Buffer.from(JSON.stringify({ id: user.id })).toString('base64')
  }

  verifyToken(token: string): any {
    try {
      return JSON.parse(Buffer.from(token, 'base64').toString())
    } catch {
      throw new UnauthorizedException('Invalid token')
    }
  }
}
```

#### 3. Create Auth Guard

```typescript
// src/server/guards/jwt-auth.guard.ts
import { Injectable } from '../decorators'
import { UnauthorizedException } from '../filters'
import { AuthService } from '../services/auth.service'

@Injectable()
export class JwtAuthGuard {
  constructor(private authService: AuthService) {}

  async canActivate(context: any): Promise<boolean> {
    const { request } = context
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      throw new UnauthorizedException('No token provided')
    }

    const token = authHeader.replace('Bearer ', '')

    try {
      const user = this.authService.verifyToken(token)
      // Attach user to request for use in controllers
      request.user = user
      return true
    } catch {
      throw new UnauthorizedException('Invalid token')
    }
  }
}
```

#### 4. Protect Routes

```typescript
// src/server/controllers/profile.controller.ts
import { Controller, Get, Req, UseGuards } from '../decorators'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { NextRequest } from 'next/server'

@Controller('/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  @Get()
  async getProfile(@Req() request: NextRequest) {
    return {
      data: (request as any).user,
    }
  }
}
```

## File Upload

```typescript
// src/server/controllers/upload.controller.ts
import { Controller, Post, Req } from '../decorators'
import { BadRequestException } from '../filters'
import { NextRequest } from 'next/server'

@Controller('/upload')
export class UploadController {
  @Post()
  async uploadFile(@Req() request: NextRequest) {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      throw new BadRequestException('No file provided')
    }

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File too large (max 5MB)')
    }

    // Process file
    const buffer = await file.arrayBuffer()

    // Save to storage (S3, local, etc.)

    return {
      message: 'File uploaded successfully',
      filename: file.name,
      size: file.size,
    }
  }
}
```

## Pagination & Filtering

```typescript
// src/server/dto/pagination.dto.ts
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator'
import { Type } from 'class-transformer'

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10

  @IsOptional()
  @IsString()
  sortBy?: string

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc'

  @IsOptional()
  @IsString()
  search?: string
}

// Usage in service
async findAll(dto: PaginationDto) {
  let items = [...this.items]

  // Search
  if (dto.search) {
    items = items.filter(item =>
      item.name.toLowerCase().includes(dto.search!.toLowerCase())
    )
  }

  // Sort
  if (dto.sortBy) {
    items.sort((a, b) => {
      const aVal = a[dto.sortBy!]
      const bVal = b[dto.sortBy!]
      return dto.sortOrder === 'asc'
        ? aVal > bVal ? 1 : -1
        : aVal < bVal ? 1 : -1
    })
  }

  // Paginate
  const total = items.length
  const page = dto.page || 1
  const limit = dto.limit || 10
  const start = (page - 1) * limit
  const end = start + limit
  const data = items.slice(start, end)

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}
```

## Error Handling

### Custom Exception

```typescript
// src/server/filters/payment-exception.ts
import { HttpException } from './http-exception'

export class PaymentFailedException extends HttpException {
  constructor(
    message: string = 'Payment failed',
    public readonly paymentId?: string
  ) {
    super(message, 402)
    this.name = 'PaymentFailedException'
  }

  toJSON() {
    return {
      ...super.toJSON(),
      paymentId: this.paymentId,
    }
  }
}

// Usage
if (!payment.successful) {
  throw new PaymentFailedException(
    'Card was declined',
    payment.id
  )
}
```

### Global Error Logger

```typescript
// src/server/filters/logging-exception.filter.ts
import { ExceptionFilter } from './exception.filter'

export class LoggingExceptionFilter extends ExceptionFilter {
  static catch(error: unknown) {
    // Log to external service (Sentry, LogRocket, etc.)
    console.error('[ERROR]', {
      timestamp: new Date().toISOString(),
      error,
      stack: error instanceof Error ? error.stack : undefined,
    })

    return super.catch(error)
  }
}
```

## Testing

### Service Test

```typescript
// src/server/services/__tests__/product.service.test.ts
import 'reflect-metadata'
import { ProductService } from '../product.service'
import { NotFoundException } from '../../filters'

describe('ProductService', () => {
  let service: ProductService

  beforeEach(() => {
    service = new ProductService()
  })

  describe('create', () => {
    it('should create a product', async () => {
      const dto = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        stock: 10,
      }

      const product = await service.create(dto)

      expect(product).toMatchObject(dto)
      expect(product.id).toBeDefined()
      expect(product.createdAt).toBeInstanceOf(Date)
    })
  })

  describe('findOne', () => {
    it('should find a product by id', async () => {
      const created = await service.create({
        name: 'Test',
        description: 'Test',
        price: 10,
        stock: 5,
      })

      const found = await service.findOne(created.id)

      expect(found).toEqual(created)
    })

    it('should throw NotFoundException', async () => {
      await expect(service.findOne(999))
        .rejects
        .toThrow(NotFoundException)
    })
  })
})
```

### Controller Test with DI

```typescript
// src/server/controllers/__tests__/product.controller.test.ts
import 'reflect-metadata'
import { container } from '../../container/container'
import { ProductController } from '../product.controller'
import { ProductService } from '../../services/product.service'

describe('ProductController', () => {
  let controller: ProductController
  let service: ProductService

  beforeEach(() => {
    // Reset container
    container.clearInstances()

    // Resolve with fresh instances
    service = container.resolve(ProductService)
    controller = container.resolve(ProductController)
  })

  it('should get all products', async () => {
    const result = await controller.getAllProducts()

    expect(result).toHaveProperty('data')
    expect(Array.isArray(result.data)).toBe(true)
  })

  it('should create a product', async () => {
    const dto = {
      name: 'Test Product',
      description: 'Test',
      price: 99.99,
      stock: 10,
    }

    const result = await controller.createProduct(dto)

    expect(result.data).toMatchObject(dto)
    expect(result.message).toBeDefined()
  })
})
```

### Mock Services

```typescript
// Mock a service
const mockService = {
  findAll: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue({ id: 1 }),
  create: jest.fn().mockResolvedValue({ id: 1 }),
}

container.register(ProductService, { useValue: mockService })

// Now controller will use the mock
const controller = container.resolve(ProductController)
```

### Integration Test

```typescript
// Test the full request cycle
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/products/route'

describe('POST /api/products', () => {
  it('should create a product', async () => {
    const request = new NextRequest('http://localhost/api/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Product',
        description: 'Test',
        price: 99.99,
        stock: 10,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.name).toBe('Test Product')
  })

  it('should validate required fields', async () => {
    const request = new NextRequest('http://localhost/api/products', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('Validation failed')
  })
})
```
