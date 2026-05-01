export type ErrorDetails = Record<string, unknown> | Array<Record<string, unknown>>;

export class AppError extends Error {
  public readonly errorCode: string;
  public readonly statusCode: number;
  public readonly details?: ErrorDetails;
  public readonly isOperational = true;

  constructor(message: string, statusCode: number, errorCode: string, details?: ErrorDetails) {
    super(message);

    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errorCode = 'BAD_REQUEST', details?: ErrorDetails): AppError {
    return new AppError(message, 400, errorCode, details);
  }

  static unauthorized(
    message = 'Authentication is required',
    errorCode = 'UNAUTHORIZED',
    details?: ErrorDetails,
  ): AppError {
    return new AppError(message, 401, errorCode, details);
  }

  static forbidden(
    message = 'You are not allowed to perform this action',
    errorCode = 'FORBIDDEN',
    details?: ErrorDetails,
  ): AppError {
    return new AppError(message, 403, errorCode, details);
  }

  static notFound(message = 'Resource not found', errorCode = 'NOT_FOUND'): AppError {
    return new AppError(message, 404, errorCode);
  }

  static conflict(message: string, errorCode = 'CONFLICT', details?: ErrorDetails): AppError {
    return new AppError(message, 409, errorCode, details);
  }
}
