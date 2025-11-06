import { Injectable } from '../decorators'
import * as winston from 'winston'
import * as DailyRotateFile from 'winston-daily-rotate-file'
import { ConfigService } from '../../config'
import * as path from 'path'

/**
 * Logger Service
 * Provides structured logging with Winston
 * Supports console and file output with rotation
 */
@Injectable()
export class LoggerService {
  private logger: winston.Logger
  private context?: string

  constructor(private configService?: ConfigService) {
    this.logger = this.createLogger()
  }

  /**
   * Create and configure Winston logger
   */
  private createLogger(): winston.Logger {
    const config = this.configService?.log || {
      level: 'info',
      fileEnabled: true,
      fileMaxSize: '20m',
      fileMaxFiles: '14d',
    }

    const transports: winston.transport[] = []

    // Console transport
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf(
            (info) =>
              `${info.timestamp} [${info.level}]${info.context ? ` [${info.context}]` : ''}: ${info.message}${
                info.stack ? `\n${info.stack}` : ''
              }`
          )
        ),
      })
    )

    // File transports (if enabled)
    if (config.fileEnabled) {
      const logsDir = path.join(process.cwd(), 'logs')

      // Error log file
      transports.push(
        new DailyRotateFile({
          dirname: logsDir,
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: config.fileMaxSize,
          maxFiles: config.fileMaxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        })
      )

      // Combined log file
      transports.push(
        new DailyRotateFile({
          dirname: logsDir,
          filename: 'combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: config.fileMaxSize,
          maxFiles: config.fileMaxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        })
      )
    }

    return winston.createLogger({
      level: config.level,
      format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports,
      exceptionHandlers: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
      rejectionHandlers: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    })
  }

  /**
   * Set context for subsequent log calls
   */
  setContext(context: string): LoggerService {
    const newLogger = Object.create(this)
    newLogger.context = context
    newLogger.logger = this.logger
    newLogger.configService = this.configService
    return newLogger
  }

  /**
   * Log error message
   */
  error(message: string, trace?: string, context?: string): void {
    this.logger.error({
      message,
      stack: trace,
      context: context || this.context,
    })
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: string): void {
    this.logger.warn({
      message,
      context: context || this.context,
    })
  }

  /**
   * Log info message
   */
  info(message: string, context?: string): void {
    this.logger.info({
      message,
      context: context || this.context,
    })
  }

  /**
   * Log http message
   */
  http(message: string, context?: string): void {
    this.logger.http({
      message,
      context: context || this.context,
    })
  }

  /**
   * Log verbose message
   */
  verbose(message: string, context?: string): void {
    this.logger.verbose({
      message,
      context: context || this.context,
    })
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: string): void {
    this.logger.debug({
      message,
      context: context || this.context,
    })
  }

  /**
   * Log silly message
   */
  silly(message: string, context?: string): void {
    this.logger.silly({
      message,
      context: context || this.context,
    })
  }

  /**
   * Log with custom level
   */
  log(level: string, message: string, context?: string): void {
    this.logger.log(level, {
      message,
      context: context || this.context,
    })
  }
}
