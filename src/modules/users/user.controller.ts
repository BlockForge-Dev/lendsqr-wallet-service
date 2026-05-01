import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/response';
import { userService, type UserService } from './user.service';

export class UserController {
  constructor(private readonly service: UserService = userService) {}

  createUser = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.service.createUser(req.body);

    return sendSuccess(res, 201, 'User onboarded successfully', result);
  };
}

export const userController = new UserController();
