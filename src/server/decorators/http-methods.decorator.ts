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
