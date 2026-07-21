import { NextRequest, NextResponse } from 'next/server'
import { container } from '../container/container'
import { getParamMetadata } from '../decorators/param.decorator'
import { ExceptionFilter } from '../filters/exception.filter'
import { ValidationPipe } from '../pipes/validation.pipe'
import { getGuards } from '../decorators/guards.decorator'
import { HTTP_CODE_METADATA } from '../decorators/http-methods.decorator'

interface RouteContext {
  params?: Record<string, string>
}

/**
 * Creates a Next.js route handler from a controller method
 */
export function createRouteHandler(
  controllerClass: new (...args: any[]) => any,
  methodName: string | symbol,
  dtoClass?: new () => any,
  extraGuards: Array<new (...args: any[]) => any> = []
) {
  return async (request: NextRequest, context?: RouteContext) => {
    try {
      // Resolve controller instance from DI container
      const controller = container.resolve(controllerClass)

      // Get method guards
      const methodGuards = getGuards(controller, methodName)
      const classGuards = getGuards(controllerClass)
      const allGuards = [...classGuards, ...methodGuards, ...extraGuards]

      // Execute guards
      for (const GuardClass of allGuards) {
        const guard = container.resolve(GuardClass) as any
        const canActivate = await guard.canActivate({ request, params: context?.params })

        if (!canActivate) {
          return NextResponse.json(
            { statusCode: 403, message: 'Forbidden' },
            { status: 403 }
          )
        }
      }

      // Get parameter metadata
      const paramMetadata = getParamMetadata(controller, methodName)

      // Prepare method arguments
      const args: any[] = []

      // Parse request body once
      let body: any = null
      const method = request.method

      if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        try {
          const contentType = request.headers.get('content-type') || ''
          if (contentType.includes('application/json')) {
            body = await request.json()
          } else {
            body = {}
          }
        } catch (error) {
          body = {}
        }
      }

      // Parse query parameters
      const url = new URL(request.url)
      const query: Record<string, string> = {}
      url.searchParams.forEach((value, key) => {
        query[key] = value
      })

      // Get route params from context
      const params = context?.params || {}

      // Build arguments based on parameter decorators
      for (const param of paramMetadata.sort((a, b) => a.index - b.index)) {
        let value: any

        switch (param.type) {
          case 'body':
            value = param.propertyKey ? body?.[param.propertyKey] : body
            // Apply validation if DTO class is provided
            if (dtoClass && !param.propertyKey) {
              value = await ValidationPipe.transform(dtoClass, value)
            }
            break

          case 'query':
            value = param.propertyKey ? query[param.propertyKey] : query
            break

          case 'param':
            value = param.propertyKey ? params[param.propertyKey] : params
            break

          case 'request':
            value = request
            break

          case 'response':
            // Response object - not used in Next.js route handlers
            value = null
            break

          default:
            value = undefined
        }

        args[param.index] = value
      }

      // Call the controller method
      const result = await controller[methodName](...args)

      // Return the response
      if (result instanceof NextResponse) {
        return result
      }

      // Default JSON response, honoring an @HttpCode() override if present.
      const statusCode = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        controller,
        methodName
      )
      return NextResponse.json(result, statusCode ? { status: statusCode } : undefined)
    } catch (error) {
      // Handle exceptions with global exception filter
      return ExceptionFilter.catch(error)
    }
  }
}

interface HandleRouteOptions {
  request: NextRequest
  params?: Record<string, string>
  guards?: Array<new (...args: any[]) => any>
  dto?: new () => any
}

/**
 * Executes a controller method for a single request. Unlike createRouteHandler
 * (which returns a reusable handler and reads guards from decorators), this runs
 * the method inline and takes guards explicitly — the shape the /api/auth routes
 * use, e.g. handleRoute(AuthController, 'me', { request, guards: [AuthGuard] }).
 */
export function handleRoute(
  controllerClass: new (...args: any[]) => any,
  methodName: string | symbol,
  options: HandleRouteOptions
) {
  const handler = createRouteHandler(
    controllerClass,
    methodName,
    options.dto,
    options.guards ?? []
  )
  return handler(options.request, { params: options.params })
}
