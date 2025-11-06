# Week 1: Foundation Features

This document describes the foundational infrastructure features implemented in Week 1.

## 📦 New Dependencies

```bash
# Configuration & Validation
- joi                           # Schema validation for configuration
- dotenv                        # Environment variable loading

# Logging
- winston                       # Structured logging
- winston-daily-rotate-file     # Log file rotation

# Security & Middleware
- helmet                        # Security headers
- cors                          # CORS handling
- express-rate-limit            # Rate limiting
```

## 🔧 Features Implemented

### 1. Configuration Management

**Location:** `src/config/`

A robust configuration system with validation, type safety, and environment-specific configs.

#### Features:
- ✅ Environment variable validation with Joi
- ✅ Type-safe configuration access
- ✅ Environment-specific config files (.env.development, .env.test, .env.production)
- ✅ Grouped configuration (app, security, rateLimit, cors, log, database, redis, email, aws)
- ✅ Environment detection helpers (isDevelopment(), isProduction(), isTest(), isStaging())

#### Usage:

```typescript
import { ConfigService } from '@/config'
import { container } from '@/server/container/container'

// Get config service from DI container
const config = container.resolve(ConfigService)

// Access configuration
console.log(config.app.port)              // 3000
console.log(config.security.jwtSecret)    // your-jwt-secret
console.log(config.isDevelopment())       // true

// Grouped access
const appConfig = config.app
const securityConfig = config.security
const rateLimitConfig = config.rateLimit
```

#### Configuration Groups:

**App Configuration:**
```typescript
config.app.nodeEnv      // 'development' | 'production' | 'test' | 'staging'
config.app.port         // 3000
config.app.appName      // 'nexst'
config.app.appUrl       // 'http://localhost:3000'
config.app.apiPrefix    // '/api'
config.app.apiVersion   // 'v1'
```

**Security Configuration:**
```typescript
config.security.apiKey              // API key for basic auth
config.security.jwtSecret           // JWT signing secret
config.security.jwtExpiresIn        // '1h'
config.security.jwtRefreshSecret    // JWT refresh token secret
config.security.jwtRefreshExpiresIn // '7d'
```

**Rate Limit Configuration:**
```typescript
config.rateLimit.ttl    // 60 (seconds)
config.rateLimit.max    // 100 (requests per TTL)
```

**CORS Configuration:**
```typescript
config.cors.origin      // '*' or ['http://localhost:3000']
config.cors.credentials // true/false
```

**Logging Configuration:**
```typescript
config.log.level         // 'error' | 'warn' | 'info' | 'debug' etc.
config.log.fileEnabled   // true/false
config.log.fileMaxSize   // '20m'
config.log.fileMaxFiles  // '14d'
```

---

### 2. Logging Service

**Location:** `src/server/logger/`

Production-ready logging with Winston, featuring structured logs, file rotation, and context support.

#### Features:
- ✅ Multiple log levels (error, warn, info, http, verbose, debug, silly)
- ✅ Console and file output
- ✅ Daily log rotation
- ✅ Structured JSON logging
- ✅ Context-aware logging
- ✅ Automatic exception and rejection handling

#### Usage:

```typescript
import { LoggerService } from '@/server/logger'
import { container } from '@/server/container/container'

// Get logger from DI container
const logger = container.resolve(LoggerService)

// Basic logging
logger.error('Database connection failed', stackTrace)
logger.warn('Cache miss for key: users:123')
logger.info('User logged in successfully')
logger.http('GET /api/users - 200 OK - 45ms')
logger.debug('Processing payment with ID: abc123')

// With context
const userLogger = logger.setContext('UserService')
userLogger.info('Creating new user')
userLogger.error('Failed to create user', error.stack)

// Custom context per call
logger.info('Operation completed', 'CustomContext')
```

#### Log Files:

Logs are written to the `logs/` directory:
```
logs/
├── error-2025-01-15.log      # Error logs only
├── combined-2025-01-15.log   # All logs
├── error-2025-01-14.log
└── combined-2025-01-14.log
```

#### Log Levels:

- **error**: Application errors, exceptions
- **warn**: Warning messages
- **info**: General information
- **http**: HTTP request/response logging
- **verbose**: Detailed operational information
- **debug**: Debug information
- **silly**: Very detailed debug information

---

### 3. Security Middleware

**Location:** `src/server/middleware/`

Comprehensive security middleware including CORS, security headers, and rate limiting.

#### Components:

##### 3.1 CORS Middleware

Handles Cross-Origin Resource Sharing with configurable origins.

**Features:**
- ✅ Origin validation
- ✅ Credentials support
- ✅ Preflight request handling
- ✅ Configurable allowed methods and headers

**Configuration:**
```env
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=true
```

##### 3.2 Security Headers Middleware

Adds security headers similar to Helmet.js.

**Headers Added:**
- `Content-Security-Policy`: Prevents XSS and injection attacks
- `Strict-Transport-Security`: Enforces HTTPS
- `X-Content-Type-Options`: Prevents MIME sniffing
- `X-Frame-Options`: Prevents clickjacking
- `X-XSS-Protection`: Legacy XSS protection
- `Referrer-Policy`: Controls referrer information
- `Permissions-Policy`: Controls browser features
- `Cross-Origin-*-Policy`: Cross-origin isolation

##### 3.3 Rate Limiting Middleware

In-memory rate limiting with token bucket algorithm.

**Features:**
- ✅ Per-IP rate limiting
- ✅ Configurable limits and windows
- ✅ Automatic cleanup of expired entries
- ✅ Rate limit headers in responses
- ✅ 429 Too Many Requests error handling

**Configuration:**
```env
RATE_LIMIT_TTL=60      # Time window in seconds
RATE_LIMIT_MAX=100     # Max requests per window
```

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1673891234
```

##### 3.4 Logger Middleware

HTTP request/response logging middleware.

**Features:**
- ✅ Request logging (method, URL, user-agent)
- ✅ Response logging (status, duration)
- ✅ Automatic log level based on status code
- ✅ Request timing

#### Middleware Manager

**Location:** `src/server/middleware/middleware.manager.ts`

Orchestrates all middleware execution.

**Usage:**
```typescript
import { MiddlewareManager } from '@/server/middleware'
import { container } from '@/server/container/container'

const middlewareManager = container.resolve(MiddlewareManager)

// In route handler or Next.js middleware
export async function middleware(request: NextRequest) {
  // Pre-process (rate limiting, logging, CORS preflight)
  const preResponse = await middlewareManager.preProcess(request)
  if (preResponse) return preResponse

  // Your route handler logic here...
  let response = NextResponse.next()

  // Post-process (add headers, log response)
  response = middlewareManager.postProcess(request, response)

  return response
}
```

---

## 📁 File Structure

```
src/
├── config/
│   ├── __tests__/
│   │   └── config.service.test.ts
│   ├── config.schema.ts         # Joi validation schema
│   ├── config.service.ts        # Configuration service
│   └── index.ts
│
├── server/
│   ├── logger/
│   │   ├── __tests__/
│   │   │   └── logger.service.test.ts
│   │   ├── logger.service.ts    # Winston logger service
│   │   └── index.ts
│   │
│   ├── middleware/
│   │   ├── cors.middleware.ts          # CORS handling
│   │   ├── security.middleware.ts      # Security headers
│   │   ├── rate-limit.middleware.ts    # Rate limiting
│   │   ├── logger.middleware.ts        # HTTP logging
│   │   ├── middleware.manager.ts       # Orchestrates all middleware
│   │   └── index.ts
│   │
│   └── filters/
│       └── http-exception.ts           # Added TooManyRequestsException
│
└── .env.development           # Development config
    .env.test                  # Test config
    .env.example               # Updated example config
```

---

## 🚀 Getting Started

### 1. Environment Setup

Copy the example environment file:
```bash
cp .env.example .env
```

Update required values in `.env`:
```env
# REQUIRED - Change these!
API_KEY=your-secure-api-key-here-minimum-20-characters
JWT_SECRET=your-jwt-secret-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key-minimum-32-characters-long

# Optional - defaults provided
PORT=3000
LOG_LEVEL=info
RATE_LIMIT_MAX=100
```

### 2. Configuration Usage

```typescript
import { ConfigService } from '@/config'
import { container } from '@/server/container/container'

// In your service or controller
@Injectable()
export class MyService {
  constructor(private config: ConfigService) {
    const port = this.config.app.port
    const apiKey = this.config.security.apiKey
  }
}
```

### 3. Logging Usage

```typescript
import { LoggerService } from '@/server/logger'

@Injectable()
export class UserService {
  private logger: LoggerService

  constructor(logger: LoggerService) {
    this.logger = logger.setContext('UserService')
  }

  async createUser(data: CreateUserDto) {
    this.logger.info(`Creating user: ${data.email}`)

    try {
      const user = await this.userRepository.create(data)
      this.logger.info(`User created successfully: ${user.id}`)
      return user
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack)
      throw error
    }
  }
}
```

### 4. Middleware Integration

For Next.js middleware (`middleware.ts` at root):
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { MiddlewareManager } from '@/server/middleware'
import { container } from '@/server/container/container'

const middlewareManager = container.resolve(MiddlewareManager)

export async function middleware(request: NextRequest) {
  // Apply all pre-processing middleware
  const preResponse = await middlewareManager.preProcess(request)
  if (preResponse) return preResponse

  // Continue to route
  const response = NextResponse.next()

  // Apply all post-processing middleware
  return middlewareManager.postProcess(request, response)
}

export const config = {
  matcher: ['/api/:path*'],
}
```

---

## 🧪 Testing

All new features include comprehensive tests:

```bash
# Test configuration service
npm test -- src/config

# Test logger service
npm test -- src/server/logger

# Run all tests
npm test
```

**Test Coverage:**
- Configuration validation and access
- Logger context and log levels
- All configuration groups
- Environment detection

---

## 🔐 Security Considerations

### API Keys
- Minimum 20 characters
- Store securely in environment variables
- Rotate regularly in production

### JWT Secrets
- Minimum 32 characters
- Use cryptographically secure random strings
- Never commit to version control
- Different secrets for access and refresh tokens

### Rate Limiting
- Default: 100 requests per 60 seconds
- Adjust based on your API usage patterns
- Consider Redis for distributed rate limiting

### CORS
- Restrict origins in production
- Don't use '*' in production
- Enable credentials only when needed

### Security Headers
- CSP is relaxed in development
- HSTS only enabled in production
- Customize based on your requirements

---

## 📝 Best Practices

### Configuration
1. ✅ Use `.env.development` for local development
2. ✅ Use `.env.test` for testing (already configured)
3. ✅ Never commit `.env` files with secrets
4. ✅ Validate all configuration on startup
5. ✅ Use grouped access (config.app, config.security) for cleaner code

### Logging
1. ✅ Use appropriate log levels
2. ✅ Set context for domain-specific loggers
3. ✅ Include relevant information (user ID, request ID, etc.)
4. ✅ Don't log sensitive information (passwords, tokens)
5. ✅ Use structured logging for better searchability

### Middleware
1. ✅ Apply rate limiting to public APIs
2. ✅ Customize security headers for your app
3. ✅ Monitor rate limit violations
4. ✅ Configure CORS restrictively in production
5. ✅ Log all incoming requests

---

## 🎯 Next Steps (Week 2)

The foundation is now set for:
- **Database Integration**: Prisma ORM with PostgreSQL
- **Repository Pattern**: Data access layer
- **Migrations & Seeds**: Database schema management
- **Advanced Authentication**: JWT token management

---

## 🐛 Troubleshooting

### Configuration Errors

**Error:** `Configuration validation error: "JWT_SECRET" length must be at least 32 characters long`

**Solution:** Update your JWT_SECRET in `.env` to be at least 32 characters:
```env
JWT_SECRET=your-very-long-secret-key-at-least-32-characters-long
```

### Logging Issues

**Logs not appearing:**
1. Check `LOG_LEVEL` in `.env`
2. Ensure `LOG_FILE_ENABLED=true` for file logging
3. Check `logs/` directory permissions

### Rate Limiting

**Too many 429 errors:**
1. Increase `RATE_LIMIT_MAX` in `.env`
2. Increase `RATE_LIMIT_TTL` for longer windows
3. Consider IP whitelisting for internal services

### CORS Errors

**CORS policy blocking requests:**
1. Add your frontend URL to `CORS_ORIGIN`
2. Set `CORS_CREDENTIALS=true` if using cookies
3. Check browser console for specific CORS errors

---

## 📚 Additional Resources

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Joi Validation](https://joi.dev/api/)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
