import { randomUUID } from 'node:crypto';

import { transactionRunner } from '../../database/transaction';
import { AppError } from '../../shared/errors';
import { addMinorUnits, assertPositiveMinorUnitAmount } from '../../shared/money';
import { transactionRepository } from '../transactions/transaction.repository';
import { walletRepository } from './wallet.repository';
import type { FundWalletInput, FundWalletResult, WalletFundingDependencies } from './wallet.types';

const createTransactionReference = (prefix: string): string => {
  return `${prefix}-${randomUUID()}`;
};

export class WalletService {
  constructor(
    private readonly dependencies: WalletFundingDependencies = {
      wallets: walletRepository,
      transactions: transactionRepository,
      transactionRunner,
    },
  ) {}

  async fundWallet(input: FundWalletInput): Promise<FundWalletResult> {
    assertPositiveMinorUnitAmount(input.amountMinor);

    return this.dependencies.transactionRunner.run(async (trx) => {
      const wallet = await this.dependencies.wallets.findByIdForUpdate(input.walletId, trx);

      if (!wallet) {
        throw AppError.notFound('Wallet not found', 'WALLET_NOT_FOUND');
      }

      if (wallet.userId !== input.userId) {
        throw AppError.forbidden(
          'You are not allowed to operate on this wallet',
          'WALLET_FORBIDDEN',
        );
      }

      const balanceBeforeMinor = wallet.balanceMinor;
      const balanceAfterMinor = addMinorUnits(balanceBeforeMinor, input.amountMinor);
      const updatedWallet = await this.dependencies.wallets.updateBalance(
        wallet.id,
        balanceAfterMinor,
        trx,
      );
      const transaction = await this.dependencies.transactions.create(
        {
          reference: createTransactionReference('FUND'),
          walletId: wallet.id,
          type: 'FUND',
          amountMinor: input.amountMinor,
          balanceBeforeMinor,
          balanceAfterMinor,
          status: 'SUCCESS',
          description: input.description?.trim() || null,
        },
        trx,
      );

      return {
        wallet: updatedWallet,
        transaction,
      };
    });
  }
}

export const walletService = new WalletService();
