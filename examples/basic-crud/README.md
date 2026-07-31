# Basic CRUD Example (Todos)

This example project demonstrates how to build a complete, type-safe CRUD (Create, Read, Update, Delete) endpoint using Nexst's NestJS-style architecture patterns.

## Directory Structure

```
basic-crud/
├── todo.dto.ts          # Request validation
├── todo.service.ts      # Business logic
├── todo.controller.ts   # HTTP endpoint handlers
└── route.ts             # Next.js API route mapping
```

---

## 1. DTO Validation (`todo.dto.ts`)

```typescript
import { IsString, IsBoolean, IsOptional, MinLength } from 'class-validator'

export class CreateTodoDto {
  @IsString()
  @MinLength(3)
  title!: string
}

export class UpdateTodoDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  title?: string

  @IsBoolean()
  @IsOptional()
  completed?: boolean
}
```

## 2. Service (`todo.service.ts`)

```typescript
import { Injectable } from '@/server/decorators'
import { PrismaService } from '@/server/database/prisma.service'
import { CreateTodoDto, UpdateTodoDto } from './todo.dto'
import { NotFoundException } from '@/server/filters'

@Injectable()
export class TodoService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTodoDto) {
    return this.prisma.todo.create({
      data: {
        title: dto.title,
        completed: false
      }
    })
  }

  async findAll() {
    return this.prisma.todo.findMany()
  }

  async update(id: number, dto: UpdateTodoDto) {
    const todo = await this.prisma.todo.findUnique({ where: { id } })
    if (!todo) throw new NotFoundException('Todo not found')

    return this.prisma.todo.update({
      where: { id },
      data: dto
    })
  }

  async delete(id: number) {
    const todo = await this.prisma.todo.findUnique({ where: { id } })
    if (!todo) throw new NotFoundException('Todo not found')

    await this.prisma.todo.delete({ where: { id } })
    return { success: true }
  }
}
```

## 3. Controller (`todo.controller.ts`)

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param } from '@/server/decorators'
import { TodoService } from './todo.service'
import { CreateTodoDto, UpdateTodoDto } from './todo.dto'

@Controller('/todos')
export class TodoController {
  constructor(private todoService: TodoService) {}

  @Post()
  async create(@Body() dto: CreateTodoDto) {
    return this.todoService.create(dto)
  }

  @Get()
  async findAll() {
    return this.todoService.findAll()
  }

  @Put('/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateTodoDto) {
    return this.todoService.update(parseInt(id), dto)
  }

  @Delete('/:id')
  async delete(@Param('id') id: string) {
    return this.todoService.delete(parseInt(id))
  }
}
```

## 4. API Route Mapping (`route.ts`)

Next.js handles file-based routing. To hook up the controller actions, map them to your App Router endpoints using `createRouteHandler`:

```typescript
// src/app/api/todos/route.ts
import 'reflect-metadata'
import { TodoController } from '@/examples/basic-crud/todo.controller'
import { createRouteHandler } from '@/server/core/route-handler'
import { CreateTodoDto } from '@/examples/basic-crud/todo.dto'

export const POST = createRouteHandler(TodoController, 'create', CreateTodoDto)
export const GET = createRouteHandler(TodoController, 'findAll')
```

```typescript
// src/app/api/todos/[id]/route.ts
import 'reflect-metadata'
import { TodoController } from '@/examples/basic-crud/todo.controller'
import { createRouteHandler } from '@/server/core/route-handler'
import { UpdateTodoDto } from '@/examples/basic-crud/todo.dto'

export const PUT = createRouteHandler(TodoController, 'update', UpdateTodoDto)
export const DELETE = createRouteHandler(TodoController, 'delete')
```
