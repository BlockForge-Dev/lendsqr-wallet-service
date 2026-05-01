import { AppError } from './errors';

export const MIN_MINOR_UNIT_AMOUNT = 1;

export const isValidMinorUnitAmount = (amount: unknown): amount is number => {
  return (
    typeof amount === 'number' && Number.isSafeInteger(amount) && amount >= MIN_MINOR_UNIT_AMOUNT
  );
};

export function assertPositiveMinorUnitAmount(
  amount: unknown,
  fieldName = 'amount',
): asserts amount is number {
  if (!isValidMinorUnitAmount(amount)) {
    throw AppError.badRequest(
      `${fieldName} must be a positive integer in minor units`,
      'INVALID_AMOUNT',
    );
  }
}

export const addMinorUnits = (left: number, right: number): number => {
  const result = left + right;

  if (!Number.isSafeInteger(result)) {
    throw AppError.badRequest(
      'Money operation exceeds safe integer range',
      'INVALID_MONEY_OPERATION',
    );
  }

  return result;
};

export const subtractMinorUnits = (left: number, right: number): number => {
  const result = left - right;

  if (result < 0) {
    throw AppError.badRequest('Insufficient wallet balance', 'INSUFFICIENT_FUNDS');
  }

  if (!Number.isSafeInteger(result)) {
    throw AppError.badRequest(
      'Money operation exceeds safe integer range',
      'INVALID_MONEY_OPERATION',
    );
  }

  return result;
};
