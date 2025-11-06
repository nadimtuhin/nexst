import 'reflect-metadata'
import { injectable } from 'tsyringe'

const CONTROLLER_PREFIX = Symbol('controller:prefix')
const CONTROLLER_ROUTES = Symbol('controller:routes')

export interface RouteMetadata {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  methodName: string | symbol
  middleware?: any[]
  guards?: any[]
}

/**
 * Marks a class as a controller with an optional path prefix
 * @param prefix - The path prefix for all routes in this controller
 */
export function Controller(prefix = '') {
  return function (target: any) {
    // Make the controller injectable
    injectable()(target)

    // Store the prefix
    Reflect.defineMetadata(CONTROLLER_PREFIX, prefix, target)

    // Initialize routes array if it doesn't exist
    if (!Reflect.hasMetadata(CONTROLLER_ROUTES, target)) {
      Reflect.defineMetadata(CONTROLLER_ROUTES, [], target)
    }
  }
}

/**
 * Get the controller prefix
 */
export function getControllerPrefix(target: any): string {
  return Reflect.getMetadata(CONTROLLER_PREFIX, target) || ''
}

/**
 * Get all routes from a controller
 */
export function getControllerRoutes(target: any): RouteMetadata[] {
  return Reflect.getMetadata(CONTROLLER_ROUTES, target) || []
}

/**
 * Add a route to a controller
 */
export function addRoute(target: any, route: RouteMetadata) {
  const routes = Reflect.getMetadata(CONTROLLER_ROUTES, target.constructor) || []
  routes.push(route)
  Reflect.defineMetadata(CONTROLLER_ROUTES, routes, target.constructor)
}
