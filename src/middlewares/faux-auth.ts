import type { RequestHandler } from 'express';

import { AppError } from '../shared/errors';

export type AuthenticatedUser = {
  id: string;
};

export const fauxAuth: RequestHandler = (req, _res, next) => {
  const userId = req.header('x-user-id')?.trim();

  if (!userId) {
    next(AppError.unauthorized('x-user-id header is required', 'MISSING_AUTH_HEADER'));
    return;
  }

  req.user = {
    id: userId,
  };

  next();
};
