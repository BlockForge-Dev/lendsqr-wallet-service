# Lendsqr Wallet Service

This project implements a wallet MVP for Demo Credit, a lending application. The system is designed around financial correctness, auditability, and safe wallet mutations. Although this is an MVP, wallet operations are treated as financial state transitions rather than ordinary CRUD updates.

## Status

Current milestone: Milestone 8 - Wallet-to-Wallet Transfer implemented.

Next milestone: Milestone 9 - Transaction History.

## Problem Statement

Demo Credit needs a backend wallet service that allows eligible users to receive, hold, move, and withdraw funds. The service must prevent blacklisted users from onboarding through the Adjutor Karma blacklist check and must keep a durable audit trail for every wallet balance change.

## Core Product Goals

- Allow user onboarding after blacklist verification.
- Automatically create a wallet for every onboarded user.
- Allow wallet funding, withdrawal, and wallet-to-wallet transfer.
- Preserve transaction history for every balance-changing operation.
- Enforce wallet ownership through faux authentication.
- Keep wallet mutations atomic and recoverable.

## Assessment Requirement Mapping

| Requirement                     | Planned implementation                        | Status      |
| ------------------------------- | --------------------------------------------- | ----------- |
| Node.js backend                 | Express API on Node.js LTS                    | Implemented |
| TypeScript                      | Strict TypeScript project setup               | Implemented |
| KnexJS ORM/query builder        | Knex migrations and repositories              | Implemented |
| MySQL persistence               | MySQL database with transaction support       | Implemented |
| User account creation           | `POST /api/v1/users`                          | Implemented |
| Wallet creation                 | One wallet created during onboarding          | Implemented |
| Wallet funding                  | `POST /api/v1/wallets/:walletId/fund`         | Implemented |
| Wallet withdrawal               | `POST /api/v1/wallets/:walletId/withdraw`     | Implemented |
| Wallet transfer                 | `POST /api/v1/wallets/:walletId/transfers`    | Implemented |
| Karma blacklist check           | Adjutor client isolated behind service        | Implemented |
| Faux authentication             | `x-user-id` request header middleware         | Implemented |
| Unit/integration tests          | Jest and Supertest coverage                   | In progress |
| Positive and negative scenarios | Success, validation, auth, and rollback tests | In progress |
| Public deployment               | Cloud-hosted API URL                          | Planned     |
| Public documentation page       | Google Doc or Notion page                     | Planned     |
| Loom review video               | Under 3 minutes with requirement mapping      | Planned     |

## Architecture Overview

The service will use a simple layered architecture:

- HTTP layer: Express routes, controllers, request validation, faux auth.
- Application layer: Services and use cases for business rules and transaction orchestration.
- Persistence layer: Repositories using Knex and explicit database transactions.
- External integration layer: Adjutor Karma API client and blacklist service.

## Shared Application Infrastructure

The API includes shared middleware and helpers for:

- Consistent operational errors through `AppError`.
- Consistent JSON error responses through the global error handler.
- Zod-backed request validation through `validateRequest`.
- Faux authentication through the `x-user-id` request header.
- Not-found route handling.
- Money validation in minor units.
- Shared success response helpers for feature endpoints.

Standard error shape:

```json
{
  "success": false,
  "message": "Insufficient wallet balance",
  "errorCode": "INSUFFICIENT_FUNDS"
}
```

## User Onboarding

`POST /api/v1/users` creates a user and a zero-balance NGN wallet after validation.

Onboarding flow:

- Normalize and validate the request body.
- Reject duplicate email or phone before calling Adjutor.
- Check Karma using email, phone, and BVN when BVN is provided.
- Reject blacklisted identities before user or wallet persistence.
- Create the user and wallet inside one database transaction.
- Attach successful blacklist check records to the created user.

Successful response uses the shared success envelope and returns the created user and wallet.

## Wallet Funding

`POST /api/v1/wallets/:walletId/fund` simulates wallet funding because no external payment provider is required for the assessment.

Funding flow:

- Require faux auth through `x-user-id`.
- Validate `walletId`, positive integer `amount`, and optional description.
- Open a database transaction.
- Lock the wallet row with `FOR UPDATE`.
- Confirm the authenticated user owns the wallet.
- Increase `balance_minor` using minor-unit integer arithmetic.
- Create a `FUND` transaction record with before and after balances.
- Commit the balance update and transaction record atomically.

Funding returns the updated wallet and the created transaction record.

## Wallet Withdrawal

`POST /api/v1/wallets/:walletId/withdraw` simulates withdrawal because no bank payout provider is required for the assessment.

Withdrawal flow:

- Require faux auth through `x-user-id`.
- Validate `walletId`, positive integer `amount`, and optional description.
- Open a database transaction.
- Lock the wallet row with `FOR UPDATE`.
- Confirm the authenticated user owns the wallet.
- Check that the wallet has sufficient funds.
- Decrease `balance_minor` using minor-unit integer arithmetic.
- Create a `WITHDRAW` transaction record with before and after balances.
- Commit the balance update and transaction record atomically.

Insufficient funds are rejected before any balance update or transaction record is created.

## Wallet Transfer

`POST /api/v1/wallets/:walletId/transfers` moves funds from the authenticated sender wallet to another wallet.

Transfer flow:

- Require faux auth through `x-user-id`.
- Validate sender wallet ID, recipient wallet ID, positive integer `amount`, and optional description.
- Reject same-wallet transfers.
- Open a database transaction.
- Lock sender and recipient wallet rows in deterministic wallet ID order to reduce deadlock risk.
- Confirm the authenticated user owns the sender wallet.
- Confirm the recipient wallet exists.
- Check that the sender has sufficient funds.
- Debit the sender and credit the recipient inside the same transaction.
- Create linked `TRANSFER_OUT` and `TRANSFER_IN` transaction records with before and after balances.

If any part of the transfer fails, the database transaction rolls back so the sender is not debited and the recipient is not credited.

## Database Design

Planned tables:

- `users`: onboarded customers.
- `wallets`: current wallet balances in minor units.
- `transactions`: immutable wallet movement records.
- `blacklist_checks`: audit evidence for Karma onboarding checks. The `user_id` column is nullable so rejected or failed onboarding checks can still be recorded before a user exists.

The database will enforce key invariants such as unique user identity fields, one wallet per user, non-negative wallet balances, and unique transaction references.

## Running Migrations

Create the local databases first:

```sql
CREATE DATABASE lendsqr_wallet_service;
CREATE DATABASE lendsqr_wallet_service_test;
```

Then configure `.env` and run:

```bash
npm run migrate:latest
npm run migrate:status
npm run migrate:rollback
```

The Knex CLI uses `knexfile.ts` and the migrations in `src/database/migrations`.

## E-R Diagram

The E-R diagram will be added in `docs/er-diagram.png` during the documentation milestone.

Planned relationships:

- `users` 1 to 1 `wallets`
- `wallets` 1 to many `transactions`
- `transactions` optional self-reference through `related_transaction_id`
- `users` 1 to many `blacklist_checks`

## API Overview

Planned endpoints:

- `GET /health`
- `POST /api/v1/users`
- `GET /api/v1/wallets/:walletId`
- `POST /api/v1/wallets/:walletId/fund`
- `POST /api/v1/wallets/:walletId/withdraw`
- `POST /api/v1/wallets/:walletId/transfers`
- `GET /api/v1/wallets/:walletId/transactions`

## Authentication Approach

Full authentication is out of scope for the assessment. The MVP will use faux authentication through an `x-user-id` request header. Wallet endpoints will only allow users to operate on wallets they own.

## Karma Blacklist Integration

The Adjutor Karma integration is isolated behind a client/service boundary so it can be mocked during tests. User onboarding will call this service before any user or wallet record is created.

Implementation details:

- `AdjutorClient` calls `GET /verification/karma/:identity`.
- Adjutor authentication uses `Authorization: Bearer <ADJUTOR_API_KEY>`.
- `BlacklistService` persists successful lookup evidence in `blacklist_checks`.
- A Karma response with data is treated as blacklisted.
- A provider `404` is treated as a completed lookup with no blacklist match.
- Missing API key, network failure, and non-404 provider errors fail closed with `BLACKLIST_PROVIDER_UNAVAILABLE`.

The MVP will fail closed if blacklist verification cannot be completed. This is safer for a lending product because users with unknown blacklist status should not be onboarded.

## Wallet Consistency Rules

- A wallet balance must never change without a transaction record.
- Amounts are stored in minor units to avoid floating-point money errors.
- Funding, withdrawal, and transfer operations must run inside database transactions.
- Transfers must debit and credit wallets atomically.
- Wallet rows will be locked during balance mutation.
- Wallet balances must never become negative.

## Local Setup

Install dependencies and run the API locally:

```bash
npm install
npm run dev
```

Run build, tests, linting, and formatting checks:

```bash
npm run build
npm test
npm run lint
npm run format:check
```

The development server listens on `PORT` from the environment and defaults to `3000`.

## Environment Variables

Copy `.env.example` to `.env` for local development and fill in environment-specific values.

Planned variables:

```bash
NODE_ENV=development
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=lendsqr_wallet_service
ADJUTOR_BASE_URL=https://adjutor.lendsqr.com/v2
ADJUTOR_API_KEY=
```

## Testing Strategy

Tests will cover:

- User onboarding.
- Karma blacklist handling.
- Wallet funding.
- Wallet withdrawal.
- Wallet transfers.
- Authorization boundaries.
- Validation failures.
- Transaction record creation.
- Atomic rollback behavior.

## Deployment

Deployment details will be added after the API is implemented and hosted publicly.

Target format:

```text
https://obinna-victor-lendsqr-be-test.<cloud-platform-domain>
```

## Tradeoffs and Assumptions

- The MVP uses faux authentication through `x-user-id`.
- Each onboarded user receives exactly one wallet.
- Wallet currency defaults to NGN.
- Funding and withdrawal are simulated because no external payment provider or bank payout provider is required.
- Transfers are internal wallet-to-wallet transfers.
- Adjutor calls are mocked in tests.

## Roadmap

See [TODO.md](TODO.md) and [docs/assessment-checklist.md](docs/assessment-checklist.md).
