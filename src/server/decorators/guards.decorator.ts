import 'reflect-metadata'

const GUARDS_METADATA = Symbol('guards:metadata')

export interface Guard {
  canActivate(context: any): boolean | Promise<boolean>
}

/**
 * Apply guards to a controller method or class
 * @param guards - Array of guard classes
 */
export function UseGuards(...guards: any[]) {
  return function (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) {
    if (propertyKey) {
      // Method decorator
      Reflect.defineMetadata(GUARDS_METADATA, guards, target, propertyKey)
    } else {
      // Class decorator
      Reflect.defineMetadata(GUARDS_METADATA, guards, target)
    }
    return descriptor
  }
}

/**
 * Get guards metadata
 */
export function getGuards(target: any, methodName?: string | symbol): any[] {
  if (methodName) {
    return Reflect.getMetadata(GUARDS_METADATA, target, methodName) || []
  }
  return Reflect.getMetadata(GUARDS_METADATA, target) || []
}
