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

- [x] User can create an account.
- [x] Karma blacklist is checked before onboarding.
- [x] Blacklisted users are rejected before user or wallet persistence.
- [x] User gets exactly one wallet after successful onboarding.
- [x] User can fund wallet.
- [x] User can transfer funds to another wallet.
- [x] User can withdraw funds.
- [x] User can view wallet transaction history.
- [x] Faux authentication is implemented with `x-user-id`.
- [x] User cannot operate on another user's wallet.

## Financial Correctness Requirements

- [x] Money is stored in minor units.
- [x] Floating-point arithmetic is avoided for wallet balances.
- [x] Wallet balance cannot become negative.
- [x] Every balance change creates a durable transaction record.
- [x] Transaction references are unique.
- [x] Funding operation is atomic.
- [x] Withdrawal operation is atomic.
- [x] Transfer operation is atomic.
- [x] Failed transfer does not debit sender.
- [x] Failed transfer does not credit recipient.
- [x] Wallet rows are locked during mutations.
- [x] Transfer locks are acquired in deterministic order.

## Database Requirements

- [x] `users` table exists.
- [x] `wallets` table exists.
- [x] `transactions` table exists.
- [x] `blacklist_checks` table exists.
- [x] `users.email` is unique.
- [x] `users.phone` is unique.
- [x] `wallets.user_id` is unique.
- [x] `wallets.balance_minor` is non-negative.
- [x] `transactions.reference` is unique.
- [x] `transactions.related_transaction_id` supports transfer linking.

## API Requirements

- [x] `GET /health`.
- [x] `POST /api/v1/users`.
- [ ] `GET /api/v1/wallets/:walletId`.
- [x] `POST /api/v1/wallets/:walletId/fund`.
- [x] `POST /api/v1/wallets/:walletId/withdraw`.
- [x] `POST /api/v1/wallets/:walletId/transfers`.
- [x] `GET /api/v1/wallets/:walletId/transactions`.
- [x] Consistent success responses.
- [x] Consistent error responses.
- [x] Validation errors return `400`.
- [x] Missing faux auth returns `401`.
- [x] Cross-wallet access returns `403`.
- [x] Missing resources return `404`.

## Testing Requirements

- [x] User onboarding success test.
- [x] Wallet creation after onboarding test.
- [x] Blacklisted user rejection test.
- [x] Duplicate email rejection test.
- [x] Duplicate phone rejection test.
- [x] Funding success test.
- [x] Funding invalid amount tests.
- [x] Withdrawal success test.
- [x] Withdrawal insufficient funds test.
- [x] Withdrawal invalid amount tests.
- [x] Transfer success test.
- [x] Transfer transaction record test.
- [x] Transfer insufficient funds test.
- [x] Transfer missing recipient test.
- [x] Transfer same-wallet rejection test.
- [x] Unauthorized wallet access tests.
- [x] External Adjutor API mocked in tests.
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
