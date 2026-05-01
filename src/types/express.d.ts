import type { AuthenticatedUser } from '../middlewares/faux-auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
