import 'reflect-metadata'

const PARAM_METADATA = Symbol('param:metadata')

export interface ParamMetadata {
  index: number
  type: 'body' | 'query' | 'param' | 'request' | 'response'
  propertyKey?: string
  pipes?: any[]
}

/**
 * Store parameter metadata
 */
function createParamDecorator(type: ParamMetadata['type']) {
  return function (propertyKey?: string) {
    return function (
      target: any,
      methodName: string | symbol,
      parameterIndex: number
    ) {
      const existingParams: ParamMetadata[] =
        Reflect.getMetadata(PARAM_METADATA, target, methodName) || []

      existingParams.push({
        index: parameterIndex,
        type,
        propertyKey,
      })

      Reflect.defineMetadata(PARAM_METADATA, existingParams, target, methodName)
    }
  }
}

/**
 * Get parameter metadata for a method
 */
export function getParamMetadata(
  target: any,
  methodName: string | symbol
): ParamMetadata[] {
  return Reflect.getMetadata(PARAM_METADATA, target, methodName) || []
}

/**
 * Injects the request body into the parameter
 * @param propertyKey - Optional property key to extract from body
 */
export const Body = createParamDecorator('body')

/**
 * Injects query parameters into the parameter
 * @param propertyKey - Optional property key to extract from query
 */
export const Query = createParamDecorator('query')

/**
 * Injects route parameters into the parameter
 * @param propertyKey - Optional property key to extract from params
 */
export const Param = createParamDecorator('param')

/**
 * Injects the entire request object
 */
export const Req = createParamDecorator('request')

/**
 * Injects the response object
 */
export const Res = createParamDecorator('response')
