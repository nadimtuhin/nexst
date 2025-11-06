import { Injectable } from '../decorators'
import { UnauthorizedException } from '../filters'

/**
 * Example authentication guard
 * Checks for an API key in the request headers
 */
@Injectable()
export class AuthGuard {
  async canActivate(context: any): Promise<boolean> {
    const { request } = context
    const apiKey = request.headers.get('x-api-key')

    // In a real application, you would validate the API key against a database
    // For demo purposes, we'll just check if it exists
    if (!apiKey) {
      throw new UnauthorizedException('API key is required')
    }

    // Example: validate API key format
    if (apiKey.length < 10) {
      throw new UnauthorizedException('Invalid API key')
    }

    return true
  }
}
