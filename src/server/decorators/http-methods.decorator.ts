import 'reflect-metadata'
import { addRoute, RouteMetadata } from './controller.decorator'

/**
 * Creates an HTTP method decorator
 */
function createMethodDecorator(method: RouteMetadata['method']) {
  return function (path = '') {
    return function (
      target: any,
      propertyKey: string | symbol,
      descriptor: PropertyDescriptor
    ) {
      addRoute(target, {
        method,
        path,
        methodName: propertyKey,
      })
      return descriptor
    }
  }
}

/**
 * Marks a method as a GET route handler
 * @param path - The route path (default: '')
 */
export const Get = createMethodDecorator('GET')

/**
 * Marks a method as a POST route handler
 * @param path - The route path (default: '')
 */
export const Post = createMethodDecorator('POST')

/**
 * Marks a method as a PUT route handler
 * @param path - The route path (default: '')
 */
export const Put = createMethodDecorator('PUT')

/**
 * Marks a method as a DELETE route handler
 * @param path - The route path (default: '')
 */
export const Delete = createMethodDecorator('DELETE')

/**
 * Marks a method as a PATCH route handler
 * @param path - The route path (default: '')
 */
export const Patch = createMethodDecorator('PATCH')

export const HTTP_CODE_METADATA = 'http:statusCode'

/**
 * Sets the HTTP status code for a successful response from a handler method.
 * The status is stored as metadata; createRouteHandler reads it when building
 * the JSON response. Without it, successful responses default to 200.
 * @param statusCode - The success status code (e.g. 200, 201, 204)
 */
export function HttpCode(statusCode: number) {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    Reflect.defineMetadata(HTTP_CODE_METADATA, statusCode, target, propertyKey)
    return descriptor
  }
}
