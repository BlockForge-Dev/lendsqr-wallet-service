import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { ZodError } from 'zod';

import { AppError } from '../shared/errors';

type RequestValidationSchemas = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

const formatZodIssues = (error: ZodError): Array<{ path: string; message: string }> => {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
};

export const validateRequest = (schemas: RequestValidationSchemas): RequestHandler => {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }

      if (schemas.query) {
        Object.assign(req.query, schemas.query.parse(req.query));
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          AppError.badRequest(
            'Request validation failed',
            'VALIDATION_ERROR',
            formatZodIssues(error),
          ),
        );
        return;
      }

      next(error);
    }
  };
};
