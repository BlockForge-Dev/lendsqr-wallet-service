# Assessment Checklist

This checklist converts the Lendsqr Backend Engineer Assessment into acceptance criteria for the implementation and final submission.

## Required Technology

- [x] Node.js used.
- [x] TypeScript used.
- [x] KnexJS used.
- [x] MySQL used.
- [x] Express or equivalent HTTP framework used.
- [x] Environment variables documented.
- [x] Knex migrations included.

## Product Requirements

- [ ] User can create an account.
- [ ] Karma blacklist is checked before onboarding.
- [ ] Blacklisted users are rejected before user or wallet persistence.
- [ ] User gets exactly one wallet after successful onboarding.
- [ ] User can fund wallet.
- [ ] User can transfer funds to another wallet.
- [ ] User can withdraw funds.
- [ ] User can view wallet transaction history.
- [ ] Faux authentication is implemented with `x-user-id`.
- [ ] User cannot operate on another user's wallet.

## Financial Correctness Requirements

- [ ] Money is stored in minor units.
- [ ] Floating-point arithmetic is avoided for wallet balances.
- [ ] Wallet balance cannot become negative.
- [ ] Every balance change creates a durable transaction record.
- [ ] Transaction references are unique.
- [ ] Funding operation is atomic.
- [ ] Withdrawal operation is atomic.
- [ ] Transfer operation is atomic.
- [ ] Failed transfer does not debit sender.
- [ ] Failed transfer does not credit recipient.
- [ ] Wallet rows are locked during mutations.
- [ ] Transfer locks are acquired in deterministic order.

## Database Requirements

- [ ] `users` table exists.
- [ ] `wallets` table exists.
- [ ] `transactions` table exists.
- [ ] `blacklist_checks` table exists.
- [ ] `users.email` is unique.
- [ ] `users.phone` is unique.
- [ ] `wallets.user_id` is unique.
- [ ] `wallets.balance_minor` is non-negative.
- [ ] `transactions.reference` is unique.
- [ ] `transactions.related_transaction_id` supports transfer linking.

## API Requirements

- [x] `GET /health`.
- [ ] `POST /api/v1/users`.
- [ ] `GET /api/v1/wallets/:walletId`.
- [ ] `POST /api/v1/wallets/:walletId/fund`.
- [ ] `POST /api/v1/wallets/:walletId/withdraw`.
- [ ] `POST /api/v1/wallets/:walletId/transfers`.
- [ ] `GET /api/v1/wallets/:walletId/transactions`.
- [ ] Consistent success responses.
- [ ] Consistent error responses.
- [ ] Validation errors return `400`.
- [ ] Missing faux auth returns `401`.
- [ ] Cross-wallet access returns `403`.
- [ ] Missing resources return `404`.

## Testing Requirements

- [ ] User onboarding success test.
- [ ] Wallet creation after onboarding test.
- [ ] Blacklisted user rejection test.
- [ ] Duplicate email rejection test.
- [ ] Duplicate phone rejection test.
- [ ] Funding success test.
- [ ] Funding invalid amount tests.
- [ ] Withdrawal success test.
- [ ] Withdrawal insufficient funds test.
- [ ] Withdrawal invalid amount tests.
- [ ] Transfer success test.
- [ ] Transfer transaction record test.
- [ ] Transfer insufficient funds test.
- [ ] Transfer missing recipient test.
- [ ] Transfer same-wallet rejection test.
- [ ] Unauthorized wallet access tests.
- [ ] External Adjutor API mocked in tests.
- [ ] Test database setup documented.

## Documentation Requirements

- [ ] README exists.
- [ ] README includes problem statement.
- [ ] README maps assessment requirements to implementation.
- [ ] README explains architecture layers.
- [ ] README explains database design.
- [ ] README includes E-R diagram.
- [ ] README documents API endpoints.
- [ ] README documents faux auth.
- [ ] README documents Karma integration.
- [ ] README documents wallet consistency and transaction scoping.
- [ ] README documents local setup.
- [ ] README documents environment variables.
- [ ] README documents migrations.
- [ ] README documents tests.
- [ ] README includes deployment URL.
- [ ] README includes tradeoffs.
- [ ] README includes future improvements.

## Submission Requirements

- [ ] Public GitHub repository is available.
- [ ] Git commit history is clean and intentional.
- [ ] API is deployed publicly.
- [ ] Deployment URL follows the requested naming format as closely as the platform allows.
- [ ] Public documentation page exists.
- [ ] Loom video is recorded.
- [ ] Loom video is under 3 minutes.
- [ ] Face is visible in Loom video.
- [ ] Google Form is submitted.
- [ ] Email is sent to `careers@lendsqr.com` after submission.

## Explicit MVP Assumptions

- [x] The MVP uses faux authentication through an `x-user-id` header.
- [x] Each onboarded user receives exactly one wallet.
- [x] Wallet currency defaults to NGN.
- [x] Amounts are stored in minor units.
- [x] Funding is simulated because no payment provider is required.
- [x] Withdrawal is simulated because no bank payout provider is required.
- [x] Transfers are internal wallet-to-wallet transfers.
- [x] Karma checks are done before user and wallet creation.
- [x] Adjutor API calls are isolated behind a client/service boundary.
- [x] Onboarding fails closed if Adjutor blacklist verification cannot be completed.

## Core Invariants

- [ ] A blacklisted user must never be onboarded.
- [ ] A user must not be created without a wallet.
- [ ] A wallet balance must never be negative.
- [ ] Every balance change must create a transaction record.
- [ ] Transfers must be atomic.
- [ ] A failed transfer must not debit the sender.
- [ ] A failed transfer must not credit the recipient.
- [ ] A user must not operate on another user's wallet.
- [ ] Amounts must be positive.
- [ ] Money values must not use floating-point arithmetic.
- [ ] Transaction references must be unique.
- [ ] Database transactions must be used for wallet mutations.
