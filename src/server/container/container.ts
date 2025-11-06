import 'reflect-metadata'
import { container as globalContainer, DependencyContainer } from 'tsyringe'

/**
 * Get the global DI container instance
 */
export function getContainer(): DependencyContainer {
  return globalContainer
}

/**
 * Create a child container for request-scoped dependencies
 */
export function createRequestContainer(): DependencyContainer {
  return globalContainer.createChildContainer()
}

/**
 * Reset the container (useful for testing)
 */
export function resetContainer(): void {
  globalContainer.reset()
}

export { globalContainer as container }
