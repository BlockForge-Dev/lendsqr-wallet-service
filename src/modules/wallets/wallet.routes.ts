import { Router } from 'express';

import { fauxAuth } from '../../middlewares/faux-auth';
import { validateRequest } from '../../middlewares/validate-request';
import { WalletController, walletController } from './wallet.controller';
import { fundWalletSchema } from './wallet.validation';

export const createWalletRouter = (controller: WalletController = walletController): Router => {
  const router = Router();

  router.post(
    '/:walletId/fund',
    fauxAuth,
    validateRequest(fundWalletSchema),
    controller.fundWallet,
  );

  return router;
};
