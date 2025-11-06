import { LoggerService } from '../logger.service'
import { ConfigService } from '../../../config'

describe('LoggerService', () => {
  let loggerService: LoggerService
  let configService: ConfigService

  beforeAll(() => {
    // Set up minimal config for testing
    process.env.NODE_ENV = 'test'
    process.env.API_KEY = 'test-api-key-12345678901234567890'
    process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long-12345'
    process.env.LOG_LEVEL = 'error'
    process.env.LOG_FILE_ENABLED = 'false'

    configService = new ConfigService()
    loggerService = new LoggerService(configService)
  })

  describe('Context Setting', () => {
    it('should create logger with context', () => {
      const contextLogger = loggerService.setContext('TestContext')

      expect(contextLogger).toBeDefined()
      expect(contextLogger).toBeInstanceOf(LoggerService)
    })

    it('should allow multiple contexts', () => {
      const logger1 = loggerService.setContext('Context1')
      const logger2 = loggerService.setContext('Context2')

      expect(logger1).not.toBe(logger2)
    })
  })

  describe('Logging Methods', () => {
    it('should have error method', () => {
      expect(typeof loggerService.error).toBe('function')
      expect(() => loggerService.error('Test error')).not.toThrow()
    })

    it('should have warn method', () => {
      expect(typeof loggerService.warn).toBe('function')
      expect(() => loggerService.warn('Test warning')).not.toThrow()
    })

    it('should have info method', () => {
      expect(typeof loggerService.info).toBe('function')
      expect(() => loggerService.info('Test info')).not.toThrow()
    })

    it('should have http method', () => {
      expect(typeof loggerService.http).toBe('function')
      expect(() => loggerService.http('Test http')).not.toThrow()
    })

    it('should have debug method', () => {
      expect(typeof loggerService.debug).toBe('function')
      expect(() => loggerService.debug('Test debug')).not.toThrow()
    })

    it('should accept context parameter', () => {
      expect(() => loggerService.error('Test error', undefined, 'CustomContext')).not.toThrow()
      expect(() => loggerService.warn('Test warning', 'CustomContext')).not.toThrow()
      expect(() => loggerService.info('Test info', 'CustomContext')).not.toThrow()
    })

    it('should log with stack trace', () => {
      const stackTrace = new Error('Test error').stack
      expect(() => loggerService.error('Error with trace', stackTrace)).not.toThrow()
    })
  })

  describe('Custom Log Levels', () => {
    it('should support custom log level', () => {
      expect(typeof loggerService.log).toBe('function')
      expect(() => loggerService.log('info', 'Custom level message')).not.toThrow()
    })

    it('should support all winston levels', () => {
      expect(() => loggerService.verbose('Verbose message')).not.toThrow()
      expect(() => loggerService.silly('Silly message')).not.toThrow()
    })
  })
})
