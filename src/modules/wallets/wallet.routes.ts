import { Router } from 'express';

import { fauxAuth } from '../../middlewares/faux-auth';
import { validateRequest } from '../../middlewares/validate-request';
import { WalletController, walletController } from './wallet.controller';
import {
  fundWalletSchema,
  listWalletTransactionsSchema,
  transferWalletSchema,
  withdrawWalletSchema,
} from './wallet.validation';

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
  router.post(
    '/:walletId/transfers',
    fauxAuth,
    validateRequest(transferWalletSchema),
    controller.transferWallet,
  );
  router.get(
    '/:walletId/transactions',
    fauxAuth,
    validateRequest(listWalletTransactionsSchema),
    controller.listWalletTransactions,
  );

  return router;
};
