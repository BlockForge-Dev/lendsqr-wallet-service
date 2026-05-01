import { Router } from 'express';

import { validateRequest } from '../../middlewares/validate-request';
import { UserController, userController } from './user.controller';
import { createUserSchema } from './user.validation';

export const createUserRouter = (controller: UserController = userController): Router => {
  const router = Router();

  router.post('/', validateRequest(createUserSchema), controller.createUser);

  return router;
};
