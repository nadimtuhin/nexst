import { injectable } from 'tsyringe'

/**
 * Marks a class as injectable, allowing it to be resolved by the DI container
 * This is equivalent to NestJS @Injectable() decorator
 */
export function Injectable() {
  return injectable()
}
