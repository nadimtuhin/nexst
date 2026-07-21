import { singleton } from 'tsyringe'

/**
 * Marks a class as injectable, allowing it to be resolved by the DI container.
 * Like NestJS @Injectable(), providers are singleton-scoped: the container
 * returns the same instance on every resolve (until instances are cleared).
 */
export function Injectable() {
  return singleton()
}
