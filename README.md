# Lendsqr Wallet Service

This project implements a wallet MVP for Demo Credit, a lending application. The system is designed around financial correctness, auditability, and safe wallet mutations. Although this is an MVP, wallet operations are treated as financial state transitions rather than ordinary CRUD updates.

## Status

Current milestone: Milestone 0 - Assessment Deconstruction.

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

| Requirement | Planned implementation | Status |
| --- | --- | --- |
| Node.js backend | Express API on Node.js LTS | Planned |
| TypeScript | Strict TypeScript project setup | Planned |
| KnexJS ORM/query builder | Knex migrations and repositories | Planned |
| MySQL persistence | MySQL database with transaction support | Planned |
| User account creation | `POST /api/v1/users` | Planned |
| Wallet creation | One wallet created during onboarding | Planned |
| Wallet funding | `POST /api/v1/wallets/:walletId/fund` | Planned |
| Wallet withdrawal | `POST /api/v1/wallets/:walletId/withdraw` | Planned |
| Wallet transfer | `POST /api/v1/wallets/:walletId/transfers` | Planned |
| Karma blacklist check | Adjutor client isolated behind service | Planned |
| Faux authentication | `x-user-id` request header middleware | Planned |
| Unit/integration tests | Jest and Supertest coverage | Planned |
| Positive and negative scenarios | Success, validation, auth, and rollback tests | Planned |
| Public deployment | Cloud-hosted API URL | Planned |
| Public documentation page | Google Doc or Notion page | Planned |
| Loom review video | Under 3 minutes with requirement mapping | Planned |

## Architecture Overview

The service will use a simple layered architecture:

- HTTP layer: Express routes, controllers, request validation, faux auth.
- Application layer: Services and use cases for business rules and transaction orchestration.
- Persistence layer: Repositories using Knex and explicit database transactions.
- External integration layer: Adjutor Karma API client and blacklist service.

## Database Design

Planned tables:

- `users`: onboarded customers.
- `wallets`: current wallet balances in minor units.
- `transactions`: immutable wallet movement records.
- `blacklist_checks`: audit evidence for Karma onboarding checks.

The database will enforce key invariants such as unique user identity fields, one wallet per user, non-negative wallet balances, and unique transaction references.

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

User onboarding will call Adjutor Karma before any user or wallet record is created. The integration will be isolated behind a client/service boundary so it can be mocked during tests.

The MVP will fail closed if blacklist verification cannot be completed. This is safer for a lending product because users with unknown blacklist status should not be onboarded.

## Wallet Consistency Rules

- A wallet balance must never change without a transaction record.
- Amounts are stored in minor units to avoid floating-point money errors.
- Funding, withdrawal, and transfer operations must run inside database transactions.
- Transfers must debit and credit wallets atomically.
- Wallet rows will be locked during balance mutation.
- Wallet balances must never become negative.

## Local Setup

Setup instructions will be completed as the implementation milestones are delivered.

Expected commands:

```bash
npm install
npm run dev
npm run build
npm test
```

## Environment Variables

The `.env.example` file will be added during project initialization.

Planned variables:

```bash
NODE_ENV=development
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=lendsqr_wallet_service
ADJUTOR_BASE_URL=
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
