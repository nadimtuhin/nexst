import 'reflect-metadata'
import { AuditLogService } from '../audit-log.service'
import { AuditLogRepository } from '../../database/repositories/audit-log.repository'
import { AuditAction } from '../audit.types'
import { LoggerService } from '../../logger/logger.service'

// Minimal mocks
const mockCreate = jest.fn().mockResolvedValue({ id: 1 })
const mockFindMany = jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 50 })

const mockRepo = {
  create: mockCreate,
  findMany: mockFindMany,
} as unknown as AuditLogRepository

const mockLogger = {
  setContext: jest.fn().mockReturnThis(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
} as unknown as LoggerService

describe('AuditLogService', () => {
  let service: AuditLogService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new AuditLogService(mockRepo, mockLogger)
  })

  describe('log()', () => {
    it('calls repository.create with correct data', async () => {
      await service.log({
        action: AuditAction.USER_LOGIN,
        userId: 42,
        targetId: 42,
        targetType: 'User',
      })
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.USER_LOGIN,
          userId: 42,
        })
      )
    })

    it('does not throw if repository.create fails', async () => {
      mockCreate.mockRejectedValueOnce(new Error('DB down'))
      await expect(
        service.log({ action: AuditAction.USER_LOGIN_FAILED })
      ).resolves.toBeUndefined()
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('query()', () => {
    it('delegates to repository.findMany', async () => {
      await service.query({ action: AuditAction.USER_DELETED, page: 2, limit: 10 })
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.USER_DELETED, page: 2, limit: 10 })
      )
    })
  })

  describe('extractRequestMeta()', () => {
    it('extracts ip from x-forwarded-for', () => {
      const req = {
        headers: {
          get: (k: string) => {
            if (k === 'x-forwarded-for') return '1.2.3.4, 5.6.7.8'
            if (k === 'user-agent') return 'TestAgent/1.0'
            return null
          },
        },
      } as any
      const meta = AuditLogService.extractRequestMeta(req)
      expect(meta.ipAddress).toBe('1.2.3.4')
      expect(meta.userAgent).toBe('TestAgent/1.0')
    })
  })
})
