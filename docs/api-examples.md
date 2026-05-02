# API Examples

These examples assume the API is running locally on `http://localhost:3000`.
Wallet endpoints use faux authentication with the `x-user-id` header.

Amounts are expressed in minor units. For NGN, `5000` means `NGN 50.00`.

## Health Check

```bash
curl http://localhost:3000/health
```

```json
{
  "status": "ok",
  "service": "lendsqr-wallet-service"
}
```

## Create User

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Obinna",
    "lastName": "Victor",
    "email": "obinna@example.com",
    "phone": "08000000000",
    "bvn": "12345678901"
  }'
```

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "user-id",
      "firstName": "Obinna",
      "lastName": "Victor",
      "email": "obinna@example.com",
      "phone": "08000000000",
      "bvn": "12345678901",
      "createdAt": "2026-05-02T10:00:00.000Z",
      "updatedAt": "2026-05-02T10:00:00.000Z"
    },
    "wallet": {
      "id": "wallet-id",
      "userId": "user-id",
      "balanceMinor": 0,
      "currency": "NGN",
      "createdAt": "2026-05-02T10:00:00.000Z",
      "updatedAt": "2026-05-02T10:00:00.000Z"
    }
  }
}
```

## Get Wallet

```bash
curl http://localhost:3000/api/v1/wallets/wallet-id \
  -H "x-user-id: user-id"
```

## Fund Wallet

```bash
curl -X POST http://localhost:3000/api/v1/wallets/wallet-id/fund \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-id" \
  -d '{
    "amount": 5000,
    "description": "Initial wallet funding"
  }'
```

```json
{
  "success": true,
  "message": "Wallet funded successfully",
  "data": {
    "wallet": {
      "id": "wallet-id",
      "userId": "user-id",
      "balanceMinor": 5000,
      "currency": "NGN"
    },
    "transaction": {
      "id": "transaction-id",
      "reference": "FUND-reference",
      "walletId": "wallet-id",
      "type": "FUND",
      "amountMinor": 5000,
      "balanceBeforeMinor": 0,
      "balanceAfterMinor": 5000,
      "status": "SUCCESS",
      "counterpartyWalletId": null,
      "relatedTransactionId": null
    }
  }
}
```

## Withdraw

```bash
curl -X POST http://localhost:3000/api/v1/wallets/wallet-id/withdraw \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-id" \
  -d '{
    "amount": 2000,
    "description": "Wallet withdrawal"
  }'
```

## Transfer

```bash
curl -X POST http://localhost:3000/api/v1/wallets/sender-wallet-id/transfers \
  -H "Content-Type: application/json" \
  -H "x-user-id: sender-user-id" \
  -d '{
    "recipientWalletId": "recipient-wallet-id",
    "amount": 1000,
    "description": "Transfer to another user"
  }'
```

Successful transfers return the updated sender wallet, updated recipient wallet,
`TRANSFER_OUT` transaction, and matching `TRANSFER_IN` transaction.

## Transaction History

```bash
curl "http://localhost:3000/api/v1/wallets/wallet-id/transactions?page=1&limit=20" \
  -H "x-user-id: user-id"
```

```json
{
  "success": true,
  "message": "Wallet transactions retrieved successfully",
  "data": {
    "transactions": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

## Common Error Response

```json
{
  "success": false,
  "message": "Insufficient wallet balance",
  "errorCode": "INSUFFICIENT_FUNDS"
}
```
