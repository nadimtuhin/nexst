/**
 * Base HTTP Exception class
 */
export class HttpException extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly errors?: any
  ) {
    super(message)
    this.name = 'HttpException'
  }

  toJSON() {
    return {
      statusCode: this.statusCode,
      message: this.message,
      ...(this.errors && { errors: this.errors }),
    }
  }
}

/**
 * 400 Bad Request Exception
 */
export class BadRequestException extends HttpException {
  constructor(message = 'Bad Request', errors?: any) {
    super(message, 400, errors)
    this.name = 'BadRequestException'
  }
}

/**
 * 401 Unauthorized Exception
 */
export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized') {
    super(message, 401)
    this.name = 'UnauthorizedException'
  }
}

/**
 * 403 Forbidden Exception
 */
export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden') {
    super(message, 403)
    this.name = 'ForbiddenException'
  }
}

/**
 * 404 Not Found Exception
 */
export class NotFoundException extends HttpException {
  constructor(message = 'Not Found') {
    super(message, 404)
    this.name = 'NotFoundException'
  }
}

/**
 * 409 Conflict Exception
 */
export class ConflictException extends HttpException {
  constructor(message = 'Conflict') {
    super(message, 409)
    this.name = 'ConflictException'
  }
}

/**
 * 422 Unprocessable Entity Exception
 */
export class UnprocessableEntityException extends HttpException {
  constructor(message = 'Unprocessable Entity', errors?: any) {
    super(message, 422, errors)
    this.name = 'UnprocessableEntityException'
  }
}

/**
 * 500 Internal Server Error Exception
 */
export class InternalServerErrorException extends HttpException {
  constructor(message = 'Internal Server Error') {
    super(message, 500)
    this.name = 'InternalServerErrorException'
  }
}
