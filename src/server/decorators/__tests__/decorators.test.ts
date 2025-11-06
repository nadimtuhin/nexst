import 'reflect-metadata'
import { Controller, getControllerPrefix, getControllerRoutes } from '../controller.decorator'
import { Get, Post, Put, Delete, Patch } from '../http-methods.decorator'
import { Body, Query, Param, Req, Res, getParamMetadata } from '../param.decorator'
import { UseGuards, getGuards } from '../guards.decorator'
import { Injectable } from '../injectable.decorator'
import { container } from '../../container/container'

describe('Decorators', () => {
  beforeEach(() => {
    container.clearInstances()
  })

  describe('@Injectable', () => {
    it('should make class injectable', () => {
      @Injectable()
      class TestService {
        getValue() {
          return 'test'
        }
      }

      const instance = container.resolve(TestService)
      expect(instance).toBeInstanceOf(TestService)
      expect(instance.getValue()).toBe('test')
    })

    it('should create singleton instances by default', () => {
      // Clear instances first to start fresh
      container.clearInstances()

      @Injectable()
      class SingletonService {
        private value = Math.random()

        getValue() {
          return this.value
        }
      }

      const instance1 = container.resolve(SingletonService)
      const instance2 = container.resolve(SingletonService)

      // TSyringe creates singletons by default
      expect(instance1).toBe(instance2)
      expect(instance1.getValue()).toBe(instance2.getValue())
    })

    it('should support dependency injection', () => {
      @Injectable()
      class DependencyService {
        getValue() {
          return 'dependency'
        }
      }

      @Injectable()
      class ParentService {
        constructor(private dep: DependencyService) {}

        getValue() {
          return this.dep.getValue()
        }
      }

      const instance = container.resolve(ParentService)
      expect(instance.getValue()).toBe('dependency')
    })
  })

  describe('@Controller', () => {
    it('should mark class as controller', () => {
      @Controller()
      class TestController {}

      expect(getControllerPrefix(TestController)).toBe('')
    })

    it('should store controller prefix', () => {
      @Controller('/users')
      class UserController {}

      expect(getControllerPrefix(UserController)).toBe('/users')
    })

    it('should make controller injectable', () => {
      @Controller('/test')
      class TestController {
        getValue() {
          return 'test'
        }
      }

      const instance = container.resolve(TestController)
      expect(instance).toBeInstanceOf(TestController)
    })

    it('should handle empty prefix', () => {
      @Controller('')
      class EmptyController {}

      expect(getControllerPrefix(EmptyController)).toBe('')
    })

    it('should initialize routes array', () => {
      @Controller('/test')
      class TestController {}

      const routes = getControllerRoutes(TestController)
      expect(routes).toEqual([])
    })

    it('should handle multiple controllers with different prefixes', () => {
      @Controller('/users')
      class UserController {}

      @Controller('/posts')
      class PostController {}

      expect(getControllerPrefix(UserController)).toBe('/users')
      expect(getControllerPrefix(PostController)).toBe('/posts')
    })
  })

  describe('HTTP Method Decorators', () => {
    describe('@Get', () => {
      it('should register GET route', () => {
        @Controller('/test')
        class TestController {
          @Get()
          getAll() {}
        }

        const routes = getControllerRoutes(TestController)
        expect(routes).toHaveLength(1)
        expect(routes[0].method).toBe('GET')
        expect(routes[0].path).toBe('')
        expect(routes[0].methodName).toBe('getAll')
      })

      it('should register GET route with path', () => {
        @Controller('/test')
        class TestController {
          @Get('/items')
          getItems() {}
        }

        const routes = getControllerRoutes(TestController)
        expect(routes[0].method).toBe('GET')
        expect(routes[0].path).toBe('/items')
      })
    })

    describe('@Post', () => {
      it('should register POST route', () => {
        @Controller('/test')
        class TestController {
          @Post()
          create() {}
        }

        const routes = getControllerRoutes(TestController)
        expect(routes[0].method).toBe('POST')
        expect(routes[0].methodName).toBe('create')
      })

      it('should register POST route with path', () => {
        @Controller('/test')
        class TestController {
          @Post('/create')
          create() {}
        }

        const routes = getControllerRoutes(TestController)
        expect(routes[0].method).toBe('POST')
        expect(routes[0].path).toBe('/create')
      })
    })

    describe('@Put', () => {
      it('should register PUT route', () => {
        @Controller('/test')
        class TestController {
          @Put()
          update() {}
        }

        const routes = getControllerRoutes(TestController)
        expect(routes[0].method).toBe('PUT')
      })

      it('should register PUT route with path', () => {
        @Controller('/test')
        class TestController {
          @Put('/:id')
          updateById() {}
        }

        const routes = getControllerRoutes(TestController)
        expect(routes[0].path).toBe('/:id')
      })
    })

    describe('@Delete', () => {
      it('should register DELETE route', () => {
        @Controller('/test')
        class TestController {
          @Delete()
          remove() {}
        }

        const routes = getControllerRoutes(TestController)
        expect(routes[0].method).toBe('DELETE')
      })
    })

    describe('@Patch', () => {
      it('should register PATCH route', () => {
        @Controller('/test')
        class TestController {
          @Patch()
          partialUpdate() {}
        }

        const routes = getControllerRoutes(TestController)
        expect(routes[0].method).toBe('PATCH')
      })
    })

    it('should register multiple routes on same controller', () => {
      @Controller('/users')
      class UserController {
        @Get()
        getAll() {}

        @Get('/:id')
        getOne() {}

        @Post()
        create() {}

        @Put('/:id')
        update() {}

        @Delete('/:id')
        remove() {}
      }

      const routes = getControllerRoutes(UserController)
      expect(routes).toHaveLength(5)
      expect(routes.map(r => r.method)).toEqual(['GET', 'GET', 'POST', 'PUT', 'DELETE'])
    })
  })

  describe('Parameter Decorators', () => {
    describe('@Body', () => {
      it('should store body parameter metadata', () => {
        class TestController {
          create(@Body() body: any) {}
        }

        const metadata = getParamMetadata(TestController.prototype, 'create')
        expect(metadata).toHaveLength(1)
        expect(metadata[0].type).toBe('body')
        expect(metadata[0].index).toBe(0)
      })

      it('should support property key extraction', () => {
        class TestController {
          create(@Body('name') name: string) {}
        }

        const metadata = getParamMetadata(TestController.prototype, 'create')
        expect(metadata[0].type).toBe('body')
        expect(metadata[0].propertyKey).toBe('name')
      })

      it('should support multiple body parameters', () => {
        class TestController {
          create(@Body('name') name: string, @Body('email') email: string) {}
        }

        const metadata = getParamMetadata(TestController.prototype, 'create')
        expect(metadata).toHaveLength(2)
        // Parameters are stored in reverse order by decorators
        expect(metadata.find(m => m.index === 0)?.propertyKey).toBe('name')
        expect(metadata.find(m => m.index === 1)?.propertyKey).toBe('email')
      })
    })

    describe('@Query', () => {
      it('should store query parameter metadata', () => {
        class TestController {
          getAll(@Query() query: any) {}
        }

        const metadata = getParamMetadata(TestController.prototype, 'getAll')
        expect(metadata).toHaveLength(1)
        expect(metadata[0].type).toBe('query')
      })

      it('should support property key extraction', () => {
        class TestController {
          getAll(@Query('page') page: string) {}
        }

        const metadata = getParamMetadata(TestController.prototype, 'getAll')
        expect(metadata[0].propertyKey).toBe('page')
      })
    })

    describe('@Param', () => {
      it('should store param parameter metadata', () => {
        class TestController {
          getOne(@Param() params: any) {}
        }

        const metadata = getParamMetadata(TestController.prototype, 'getOne')
        expect(metadata).toHaveLength(1)
        expect(metadata[0].type).toBe('param')
      })

      it('should support property key extraction', () => {
        class TestController {
          getOne(@Param('id') id: string) {}
        }

        const metadata = getParamMetadata(TestController.prototype, 'getOne')
        expect(metadata[0].propertyKey).toBe('id')
      })
    })

    describe('@Req', () => {
      it('should store request parameter metadata', () => {
        class TestController {
          handle(@Req() request: any) {}
        }

        const metadata = getParamMetadata(TestController.prototype, 'handle')
        expect(metadata).toHaveLength(1)
        expect(metadata[0].type).toBe('request')
      })
    })

    describe('@Res', () => {
      it('should store response parameter metadata', () => {
        class TestController {
          handle(@Res() response: any) {}
        }

        const metadata = getParamMetadata(TestController.prototype, 'handle')
        expect(metadata).toHaveLength(1)
        expect(metadata[0].type).toBe('response')
      })
    })

    it('should handle mixed parameter types', () => {
      class TestController {
        create(
          @Body() body: any,
          @Query('page') page: string,
          @Param('id') id: string,
          @Req() request: any
        ) {}
      }

      const metadata = getParamMetadata(TestController.prototype, 'create')
      expect(metadata).toHaveLength(4)
      expect(metadata.find(m => m.index === 0)?.type).toBe('body')
      expect(metadata.find(m => m.index === 1)?.type).toBe('query')
      expect(metadata.find(m => m.index === 2)?.type).toBe('param')
      expect(metadata.find(m => m.index === 3)?.type).toBe('request')
    })

    it('should maintain parameter order', () => {
      class TestController {
        method(
          @Param('id') id: string,
          @Body() body: any,
          @Query('search') search: string
        ) {}
      }

      const metadata = getParamMetadata(TestController.prototype, 'method')
      expect(metadata.find(m => m.index === 0)).toBeDefined()
      expect(metadata.find(m => m.index === 1)).toBeDefined()
      expect(metadata.find(m => m.index === 2)).toBeDefined()
    })
  })

  describe('@UseGuards', () => {
    class TestGuard {
      canActivate() {
        return true
      }
    }

    class AnotherGuard {
      canActivate() {
        return true
      }
    }

    describe('Method-level guards', () => {
      it('should apply guard to method', () => {
        class TestController {
          @UseGuards(TestGuard)
          protectedMethod() {}
        }

        const guards = getGuards(TestController.prototype, 'protectedMethod')
        expect(guards).toHaveLength(1)
        expect(guards[0]).toBe(TestGuard)
      })

      it('should apply multiple guards to method', () => {
        class TestController {
          @UseGuards(TestGuard, AnotherGuard)
          protectedMethod() {}
        }

        const guards = getGuards(TestController.prototype, 'protectedMethod')
        expect(guards).toHaveLength(2)
        expect(guards).toEqual([TestGuard, AnotherGuard])
      })

      it('should not affect other methods', () => {
        class TestController {
          @UseGuards(TestGuard)
          protectedMethod() {}

          publicMethod() {}
        }

        const protectedGuards = getGuards(TestController.prototype, 'protectedMethod')
        const publicGuards = getGuards(TestController.prototype, 'publicMethod')

        expect(protectedGuards).toHaveLength(1)
        expect(publicGuards).toHaveLength(0)
      })
    })

    describe('Class-level guards', () => {
      it('should apply guard to class', () => {
        @UseGuards(TestGuard)
        class TestController {}

        const guards = getGuards(TestController)
        expect(guards).toHaveLength(1)
        expect(guards[0]).toBe(TestGuard)
      })

      it('should apply multiple guards to class', () => {
        @UseGuards(TestGuard, AnotherGuard)
        class TestController {}

        const guards = getGuards(TestController)
        expect(guards).toHaveLength(2)
      })

      it('should support both class and method guards', () => {
        @UseGuards(TestGuard)
        class TestController {
          @UseGuards(AnotherGuard)
          protectedMethod() {}
        }

        const classGuards = getGuards(TestController)
        const methodGuards = getGuards(TestController.prototype, 'protectedMethod')

        expect(classGuards).toHaveLength(1)
        expect(classGuards[0]).toBe(TestGuard)
        expect(methodGuards).toHaveLength(1)
        expect(methodGuards[0]).toBe(AnotherGuard)
      })
    })

    it('should return empty array when no guards', () => {
      class TestController {
        method() {}
      }

      const classGuards = getGuards(TestController)
      const methodGuards = getGuards(TestController.prototype, 'method')

      expect(classGuards).toEqual([])
      expect(methodGuards).toEqual([])
    })
  })

  describe('Combined Decorators', () => {
    it('should work with all decorators together', () => {
      class TestGuard {
        canActivate() {
          return true
        }
      }

      @Injectable()
      @Controller('/api/test')
      @UseGuards(TestGuard)
      class TestController {
        @Get('/:id')
        @UseGuards(TestGuard)
        getOne(@Param('id') id: string, @Query('include') include: string) {
          return { id, include }
        }

        @Post()
        create(@Body() body: any, @Req() request: any) {
          return body
        }
      }

      // Test controller metadata
      expect(getControllerPrefix(TestController)).toBe('/api/test')

      // Test routes
      const routes = getControllerRoutes(TestController)
      expect(routes).toHaveLength(2)
      expect(routes[0].method).toBe('GET')
      expect(routes[1].method).toBe('POST')

      // Test guards
      const classGuards = getGuards(TestController)
      expect(classGuards).toHaveLength(1)

      // Test parameters
      const getOneParams = getParamMetadata(TestController.prototype, 'getOne')
      expect(getOneParams).toHaveLength(2)

      const createParams = getParamMetadata(TestController.prototype, 'create')
      expect(createParams).toHaveLength(2)

      // Test DI
      const instance = container.resolve(TestController)
      expect(instance).toBeInstanceOf(TestController)
    })
  })
})
