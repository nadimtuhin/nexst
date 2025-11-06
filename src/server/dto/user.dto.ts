import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator'

/**
 * DTO for creating a new user
 */
export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string

  @IsEmail()
  email!: string

  @IsInt()
  @Min(18)
  @IsOptional()
  age?: number
}

/**
 * DTO for updating a user
 */
export class UpdateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  name?: string

  @IsEmail()
  @IsOptional()
  email?: string

  @IsInt()
  @Min(18)
  @IsOptional()
  age?: number
}

/**
 * DTO for querying users
 */
export class GetUsersQueryDto {
  @IsString()
  @IsOptional()
  search?: string

  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number

  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number
}
