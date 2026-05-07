import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../shared/errors';
import { logger } from '../shared/logger';

const formatZodIssues = (error: ZodError): Array<{ path: string; message: string }> => {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  void _next;

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errorCode: error.errorCode,
      ...(error.details ? { details: error.details } : {}),
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Request validation failed',
      errorCode: 'VALIDATION_ERROR',
      details: formatZodIssues(error),
    });
  }

  logger.error('Unhandled application error', {
    name: error instanceof Error ? error.name : 'UnknownError',
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    code:
      typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: unknown }).code
        : undefined,
  });

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    errorCode: 'INTERNAL_SERVER_ERROR',
  });
};
