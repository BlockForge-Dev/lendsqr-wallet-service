import { randomUUID } from 'node:crypto';

import { transactionRunner } from '../../database/transaction';
import { AppError } from '../../shared/errors';
import {
  addMinorUnits,
  assertPositiveMinorUnitAmount,
  subtractMinorUnits,
} from '../../shared/money';
import { transactionRepository } from '../transactions/transaction.repository';
import { walletRepository } from './wallet.repository';
import type {
  FundWalletInput,
  FundWalletResult,
  TransferWalletInput,
  TransferWalletResult,
  WalletFundingDependencies,
  WalletRecord,
  WithdrawWalletInput,
  WithdrawWalletResult,
} from './wallet.types';

const createTransactionReference = (prefix: string): string => {
  return `${prefix}-${randomUUID()}`;
};

const getDeterministicWalletLockOrder = (
  firstWalletId: string,
  secondWalletId: string,
): string[] => {
  return [firstWalletId, secondWalletId].sort((left, right) => left.localeCompare(right));
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

  async withdrawWallet(input: WithdrawWalletInput): Promise<WithdrawWalletResult> {
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
      const balanceAfterMinor = subtractMinorUnits(balanceBeforeMinor, input.amountMinor);
      const updatedWallet = await this.dependencies.wallets.updateBalance(
        wallet.id,
        balanceAfterMinor,
        trx,
      );
      const transaction = await this.dependencies.transactions.create(
        {
          reference: createTransactionReference('WITHDRAW'),
          walletId: wallet.id,
          type: 'WITHDRAW',
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

  async transferWallet(input: TransferWalletInput): Promise<TransferWalletResult> {
    assertPositiveMinorUnitAmount(input.amountMinor);

    if (input.senderWalletId === input.recipientWalletId) {
      throw AppError.badRequest(
        'Sender and recipient wallets must be different',
        'SAME_WALLET_TRANSFER',
      );
    }

    return this.dependencies.transactionRunner.run(async (trx) => {
      const lockedWallets = new Map<string, WalletRecord>();

      for (const walletId of getDeterministicWalletLockOrder(
        input.senderWalletId,
        input.recipientWalletId,
      )) {
        const wallet = await this.dependencies.wallets.findByIdForUpdate(walletId, trx);

        if (wallet) {
          lockedWallets.set(wallet.id, wallet);
        }
      }

      const senderWallet = lockedWallets.get(input.senderWalletId);
      const recipientWallet = lockedWallets.get(input.recipientWalletId);

      if (!senderWallet) {
        throw AppError.notFound('Wallet not found', 'WALLET_NOT_FOUND');
      }

      if (!recipientWallet) {
        throw AppError.notFound('Recipient wallet not found', 'RECIPIENT_WALLET_NOT_FOUND');
      }

      if (senderWallet.userId !== input.senderUserId) {
        throw AppError.forbidden(
          'You are not allowed to operate on this wallet',
          'WALLET_FORBIDDEN',
        );
      }

      const senderBalanceBeforeMinor = senderWallet.balanceMinor;
      const recipientBalanceBeforeMinor = recipientWallet.balanceMinor;
      const senderBalanceAfterMinor = subtractMinorUnits(
        senderBalanceBeforeMinor,
        input.amountMinor,
      );
      const recipientBalanceAfterMinor = addMinorUnits(
        recipientBalanceBeforeMinor,
        input.amountMinor,
      );

      const updatedSenderWallet = await this.dependencies.wallets.updateBalance(
        senderWallet.id,
        senderBalanceAfterMinor,
        trx,
      );
      const updatedRecipientWallet = await this.dependencies.wallets.updateBalance(
        recipientWallet.id,
        recipientBalanceAfterMinor,
        trx,
      );
      let senderTransaction = await this.dependencies.transactions.create(
        {
          reference: createTransactionReference('TRANSFER_OUT'),
          walletId: senderWallet.id,
          type: 'TRANSFER_OUT',
          amountMinor: input.amountMinor,
          balanceBeforeMinor: senderBalanceBeforeMinor,
          balanceAfterMinor: senderBalanceAfterMinor,
          status: 'SUCCESS',
          counterpartyWalletId: recipientWallet.id,
          description: input.description?.trim() || null,
        },
        trx,
      );
      const recipientTransaction = await this.dependencies.transactions.create(
        {
          reference: createTransactionReference('TRANSFER_IN'),
          walletId: recipientWallet.id,
          type: 'TRANSFER_IN',
          amountMinor: input.amountMinor,
          balanceBeforeMinor: recipientBalanceBeforeMinor,
          balanceAfterMinor: recipientBalanceAfterMinor,
          status: 'SUCCESS',
          counterpartyWalletId: senderWallet.id,
          relatedTransactionId: senderTransaction.id,
          description: input.description?.trim() || null,
        },
        trx,
      );

      if (this.dependencies.transactions.updateRelatedTransaction) {
        senderTransaction = await this.dependencies.transactions.updateRelatedTransaction(
          senderTransaction.id,
          recipientTransaction.id,
          trx,
        );
      }

      return {
        senderWallet: updatedSenderWallet,
        recipientWallet: updatedRecipientWallet,
        senderTransaction,
        recipientTransaction,
      };
    });
  }
}

export const walletService = new WalletService();
