import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator'
import { PermissionAction, PermissionResource } from '@prisma/client'

/**
 * DTO for creating a new role
 */
export class CreateRoleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @IsOptional()
  @IsInt()
  tenantId?: number

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  permissionIds?: number[] // Array of permission IDs to assign to this role
}

/**
 * DTO for updating an existing role
 */
export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  permissionIds?: number[] // Update the permissions for this role
}

/**
 * DTO for assigning a role to a user
 */
export class AssignRoleDto {
  @IsInt()
  userId!: number

  @IsInt()
  roleId!: number

  @IsOptional()
  @IsInt()
  tenantId?: number
}

/**
 * DTO for creating a permission
 */
export class CreatePermissionDto {
  @IsEnum(PermissionAction)
  action!: PermissionAction

  @IsEnum(PermissionResource)
  resource!: PermissionResource

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string
}

/**
 * DTO for checking if a user has a specific permission
 */
export class CheckPermissionDto {
  @IsInt()
  userId!: number

  @IsEnum(PermissionAction)
  action!: PermissionAction

  @IsEnum(PermissionResource)
  resource!: PermissionResource

  @IsOptional()
  @IsInt()
  tenantId?: number
}
