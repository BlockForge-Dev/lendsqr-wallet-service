import { Router } from 'express';

import { fauxAuth } from '../../middlewares/faux-auth';
import { validateRequest } from '../../middlewares/validate-request';
import { WalletController, walletController } from './wallet.controller';
import { fundWalletSchema, withdrawWalletSchema } from './wallet.validation';

export const createWalletRouter = (controller: WalletController = walletController): Router => {
  const router = Router();

  router.post(
    '/:walletId/fund',
    fauxAuth,
    validateRequest(fundWalletSchema),
    controller.fundWallet,
  );
  router.post(
    '/:walletId/withdraw',
    fauxAuth,
    validateRequest(withdrawWalletSchema),
    controller.withdrawWallet,
  );

  return router;
};
