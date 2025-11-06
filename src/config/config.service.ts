import { Injectable } from '../server/decorators'
import { configValidationSchema } from './config.schema'
import * as dotenv from 'dotenv'
import * as path from 'path'

export interface AppConfig {
  nodeEnv: string
  port: number
  appName: string
  appUrl: string
  apiPrefix: string
  apiVersion: string
}

export interface SecurityConfig {
  apiKey: string
  jwtSecret: string
  jwtExpiresIn: string
  jwtRefreshSecret?: string
  jwtRefreshExpiresIn: string
}

export interface RateLimitConfig {
  ttl: number
  max: number
}

export interface CorsConfig {
  origin: string | string[]
  credentials: boolean
}

export interface LogConfig {
  level: string
  fileEnabled: boolean
  fileMaxSize: string
  fileMaxFiles: string
}

export interface DatabaseConfig {
  url?: string
  type: string
}

export interface RedisConfig {
  host: string
  port: number
  password?: string
}

export interface EmailConfig {
  host?: string
  port?: number
  user?: string
  password?: string
  from?: string
}

export interface AwsConfig {
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
  s3Bucket?: string
}

/**
 * Configuration Service
 * Loads and validates environment variables
 * Provides type-safe access to configuration
 */
@Injectable()
export class ConfigService {
  private config: Record<string, any>

  constructor() {
    this.loadConfig()
  }

  /**
   * Load and validate configuration from environment
   */
  private loadConfig() {
    // Load .env file
    const envFile = this.getEnvFilePath()
    dotenv.config({ path: envFile })

    // Validate configuration
    const { error, value } = configValidationSchema.validate(process.env, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errors = error.details.map((detail) => detail.message).join(', ')
      throw new Error(`Configuration validation error: ${errors}`)
    }

    this.config = value
  }

  /**
   * Get environment-specific .env file path
   */
  private getEnvFilePath(): string {
    const env = process.env.NODE_ENV || 'development'
    const rootDir = path.resolve(process.cwd())

    const envFiles = [
      path.join(rootDir, `.env.${env}.local`),
      path.join(rootDir, `.env.${env}`),
      path.join(rootDir, '.env.local'),
      path.join(rootDir, '.env'),
    ]

    // Return first existing file
    const fs = require('fs')
    for (const file of envFiles) {
      if (fs.existsSync(file)) {
        return file
      }
    }

    return path.join(rootDir, '.env')
  }

  /**
   * Get a configuration value
   */
  get<T = any>(key: string): T {
    return this.config[key]
  }

  /**
   * Get a configuration value with a default
   */
  getOrDefault<T = any>(key: string, defaultValue: T): T {
    return this.config[key] !== undefined ? this.config[key] : defaultValue
  }

  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development'
  }

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    return this.config.NODE_ENV === 'production'
  }

  /**
   * Check if running in test mode
   */
  isTest(): boolean {
    return this.config.NODE_ENV === 'test'
  }

  /**
   * Check if running in staging mode
   */
  isStaging(): boolean {
    return this.config.NODE_ENV === 'staging'
  }

  /**
   * Get application configuration
   */
  get app(): AppConfig {
    return {
      nodeEnv: this.get('NODE_ENV'),
      port: this.get('PORT'),
      appName: this.get('APP_NAME'),
      appUrl: this.get('APP_URL'),
      apiPrefix: this.get('API_PREFIX'),
      apiVersion: this.get('API_VERSION'),
    }
  }

  /**
   * Get security configuration
   */
  get security(): SecurityConfig {
    return {
      apiKey: this.get('API_KEY'),
      jwtSecret: this.get('JWT_SECRET'),
      jwtExpiresIn: this.get('JWT_EXPIRES_IN'),
      jwtRefreshSecret: this.get('JWT_REFRESH_SECRET'),
      jwtRefreshExpiresIn: this.get('JWT_REFRESH_EXPIRES_IN'),
    }
  }

  /**
   * Get rate limit configuration
   */
  get rateLimit(): RateLimitConfig {
    return {
      ttl: this.get('RATE_LIMIT_TTL'),
      max: this.get('RATE_LIMIT_MAX'),
    }
  }

  /**
   * Get CORS configuration
   */
  get cors(): CorsConfig {
    const origin = this.get<string>('CORS_ORIGIN')
    return {
      origin: origin === '*' ? '*' : origin.split(',').map((o) => o.trim()),
      credentials: this.get('CORS_CREDENTIALS'),
    }
  }

  /**
   * Get logging configuration
   */
  get log(): LogConfig {
    return {
      level: this.get('LOG_LEVEL'),
      fileEnabled: this.get('LOG_FILE_ENABLED'),
      fileMaxSize: this.get('LOG_FILE_MAX_SIZE'),
      fileMaxFiles: this.get('LOG_FILE_MAX_FILES'),
    }
  }

  /**
   * Get database configuration
   */
  get database(): DatabaseConfig {
    return {
      url: this.get('DATABASE_URL'),
      type: this.get('DATABASE_TYPE'),
    }
  }

  /**
   * Get Redis configuration
   */
  get redis(): RedisConfig {
    return {
      host: this.get('REDIS_HOST'),
      port: this.get('REDIS_PORT'),
      password: this.get('REDIS_PASSWORD'),
    }
  }

  /**
   * Get email configuration
   */
  get email(): EmailConfig {
    return {
      host: this.get('EMAIL_HOST'),
      port: this.get('EMAIL_PORT'),
      user: this.get('EMAIL_USER'),
      password: this.get('EMAIL_PASSWORD'),
      from: this.get('EMAIL_FROM'),
    }
  }

  /**
   * Get AWS configuration
   */
  get aws(): AwsConfig {
    return {
      region: this.get('AWS_REGION'),
      accessKeyId: this.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.get('AWS_SECRET_ACCESS_KEY'),
      s3Bucket: this.get('AWS_S3_BUCKET'),
    }
  }
}
