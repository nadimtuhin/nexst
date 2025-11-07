import * as Joi from 'joi'

/**
 * Configuration validation schema
 * Ensures all required environment variables are present and valid
 */
export const configValidationSchema = Joi.object({
  // Node Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),

  // Application
  PORT: Joi.number().default(3000),
  APP_NAME: Joi.string().default('nexst'),
  APP_URL: Joi.string().uri().default('http://localhost:3000'),

  // API
  API_PREFIX: Joi.string().default('/api'),
  API_VERSION: Joi.string().default('v1'),

  // Security
  API_KEY: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  JWT_REFRESH_SECRET: Joi.string().min(32).optional(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Rate Limiting
  RATE_LIMIT_TTL: Joi.number().default(60), // seconds
  RATE_LIMIT_MAX: Joi.number().default(100), // requests per TTL

  // CORS
  CORS_ORIGIN: Joi.string().default('*'),
  CORS_CREDENTIALS: Joi.boolean().default(false),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),
  LOG_FILE_ENABLED: Joi.boolean().default(true),
  LOG_FILE_MAX_SIZE: Joi.string().default('20m'),
  LOG_FILE_MAX_FILES: Joi.string().default('14d'),

  // Database (for future use)
  DATABASE_URL: Joi.string().uri().optional(),
  DATABASE_TYPE: Joi.string()
    .valid('postgres', 'mysql', 'sqlite', 'mongodb')
    .default('postgres'),

  // Redis (for future use)
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),

  // Email (for future use)
  EMAIL_HOST: Joi.string().optional(),
  EMAIL_PORT: Joi.number().optional(),
  EMAIL_USER: Joi.string().optional(),
  EMAIL_PASSWORD: Joi.string().optional(),
  EMAIL_FROM: Joi.string().email().optional(),

  // AWS (for future use)
  AWS_REGION: Joi.string().optional(),
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  AWS_S3_BUCKET: Joi.string().optional(),

  // Multi-Tenancy
  MULTI_TENANT_ENABLED: Joi.boolean().default(false),
})
