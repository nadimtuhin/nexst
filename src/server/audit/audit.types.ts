/**
 * Audit action enum — values stored as strings in DB
 */
export enum AuditAction {
  // Auth actions
  USER_REGISTER = 'USER_REGISTER',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGIN_FAILED = 'USER_LOGIN_FAILED',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_LOGOUT_ALL = 'USER_LOGOUT_ALL',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  TOKEN_REFRESHED = 'TOKEN_REFRESHED',

  // RBAC / user management actions
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  ROLE_CHANGED = 'ROLE_CHANGED',
}

export interface CreateAuditLogDto {
  action: AuditAction
  userId?: number
  targetId?: number
  targetType?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export interface AuditLogFilter {
  action?: AuditAction
  userId?: number
  targetType?: string
  from?: Date
  to?: Date
  page?: number
  limit?: number
}
