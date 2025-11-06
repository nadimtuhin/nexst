import { ConfigService } from '../config.service'

describe('ConfigService', () => {
  let configService: ConfigService

  beforeAll(() => {
    // Set required environment variables for testing
    process.env.NODE_ENV = 'test'
    process.env.API_KEY = 'test-api-key-12345678901234567890'
    process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long-12345'

    configService = new ConfigService()
  })

  describe('Environment Detection', () => {
    it('should detect test environment', () => {
      expect(configService.isTest()).toBe(true)
      expect(configService.isDevelopment()).toBe(false)
      expect(configService.isProduction()).toBe(false)
      expect(configService.isStaging()).toBe(false)
    })
  })

  describe('Configuration Access', () => {
    it('should get values from config', () => {
      expect(configService.get('NODE_ENV')).toBe('test')
      expect(configService.get('API_KEY')).toBe('test-api-key-12345678901234567890')
    })

    it('should get values with defaults', () => {
      expect(configService.getOrDefault('NON_EXISTENT', 'default')).toBe('default')
      expect(configService.getOrDefault('NODE_ENV', 'default')).toBe('test')
    })
  })

  describe('Grouped Configuration', () => {
    it('should get app configuration', () => {
      const appConfig = configService.app

      expect(appConfig).toHaveProperty('nodeEnv')
      expect(appConfig).toHaveProperty('port')
      expect(appConfig).toHaveProperty('appName')
      expect(appConfig).toHaveProperty('appUrl')
      expect(appConfig.nodeEnv).toBe('test')
    })

    it('should get security configuration', () => {
      const securityConfig = configService.security

      expect(securityConfig).toHaveProperty('apiKey')
      expect(securityConfig).toHaveProperty('jwtSecret')
      expect(securityConfig).toHaveProperty('jwtExpiresIn')
      expect(securityConfig.apiKey).toBeDefined()
    })

    it('should get rate limit configuration', () => {
      const rateLimitConfig = configService.rateLimit

      expect(rateLimitConfig).toHaveProperty('ttl')
      expect(rateLimitConfig).toHaveProperty('max')
      expect(typeof rateLimitConfig.ttl).toBe('number')
      expect(typeof rateLimitConfig.max).toBe('number')
    })

    it('should get CORS configuration', () => {
      const corsConfig = configService.cors

      expect(corsConfig).toHaveProperty('origin')
      expect(corsConfig).toHaveProperty('credentials')
      expect(typeof corsConfig.credentials).toBe('boolean')
    })

    it('should get log configuration', () => {
      const logConfig = configService.log

      expect(logConfig).toHaveProperty('level')
      expect(logConfig).toHaveProperty('fileEnabled')
      expect(logConfig).toHaveProperty('fileMaxSize')
      expect(logConfig).toHaveProperty('fileMaxFiles')
    })

    it('should get database configuration', () => {
      const dbConfig = configService.database

      expect(dbConfig).toHaveProperty('type')
      expect(dbConfig.type).toBe('postgres')
    })

    it('should get Redis configuration', () => {
      const redisConfig = configService.redis

      expect(redisConfig).toHaveProperty('host')
      expect(redisConfig).toHaveProperty('port')
      expect(typeof redisConfig.port).toBe('number')
    })
  })

  describe('Validation', () => {
    it('should validate configuration on initialization', () => {
      // Config service should already be initialized without errors
      expect(configService).toBeDefined()
      expect(configService.get('NODE_ENV')).toBe('test')
    })

    it('should have required security fields', () => {
      const security = configService.security

      expect(security.apiKey).toBeDefined()
      expect(security.jwtSecret).toBeDefined()
      expect(security.jwtSecret.length).toBeGreaterThanOrEqual(32)
    })
  })
})
