import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  Matches,
  IsUrl,
} from 'class-validator'
import { TenantStatus } from '@prisma/client'

/**
 * DTO for creating a new tenant
 */
export class CreateTenantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug!: string

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(255)
  domain?: string

  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus

  @IsOptional()
  @IsString()
  settings?: string
}

/**
 * DTO for updating a tenant
 */
export class UpdateTenantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  name?: string

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  @IsOptional()
  slug?: string

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(255)
  domain?: string

  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus

  @IsOptional()
  @IsString()
  settings?: string
}

/**
 * DTO for querying tenants
 */
export class GetTenantsQueryDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus

  @IsOptional()
  page?: number

  @IsOptional()
  limit?: number
}
