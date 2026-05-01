import type { Request, Response } from 'express';

import { AppError } from '../../shared/errors';
import { sendSuccess } from '../../shared/response';
import { walletService, type WalletService } from './wallet.service';

export class WalletController {
  constructor(private readonly service: WalletService = walletService) {}

  fundWallet = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw AppError.unauthorized('x-user-id header is required', 'MISSING_AUTH_HEADER');
    }

    const walletId = req.params.walletId;

    if (typeof walletId !== 'string') {
      throw AppError.badRequest('walletId route parameter is required', 'VALIDATION_ERROR');
    }

    const result = await this.service.fundWallet({
      walletId,
      userId: req.user.id,
      amountMinor: req.body.amount,
      description: req.body.description,
    });

    return sendSuccess(res, 200, 'Wallet funded successfully', result);
  };

  withdrawWallet = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw AppError.unauthorized('x-user-id header is required', 'MISSING_AUTH_HEADER');
    }

    const walletId = req.params.walletId;

    if (typeof walletId !== 'string') {
      throw AppError.badRequest('walletId route parameter is required', 'VALIDATION_ERROR');
    }

    const result = await this.service.withdrawWallet({
      walletId,
      userId: req.user.id,
      amountMinor: req.body.amount,
      description: req.body.description,
    });

    return sendSuccess(res, 200, 'Wallet withdrawal successful', result);
  };

  transferWallet = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw AppError.unauthorized('x-user-id header is required', 'MISSING_AUTH_HEADER');
    }

    const walletId = req.params.walletId;

    if (typeof walletId !== 'string') {
      throw AppError.badRequest('walletId route parameter is required', 'VALIDATION_ERROR');
    }

    const result = await this.service.transferWallet({
      senderWalletId: walletId,
      senderUserId: req.user.id,
      recipientWalletId: req.body.recipientWalletId,
      amountMinor: req.body.amount,
      description: req.body.description,
    });

    return sendSuccess(res, 200, 'Wallet transfer successful', result);
  };
}

export const walletController = new WalletController();
