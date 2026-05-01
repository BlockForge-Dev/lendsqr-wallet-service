# Lendsqr Wallet Service TODO

This file tracks the assessment roadmap from planning through submission.

## Milestone 0: Assessment Deconstruction

- [x] Extract required tech stack.
- [x] Extract required product features.
- [x] Extract required submission artifacts.
- [x] Extract major failure risks.
- [x] Create acceptance checklist.
- [x] Create README skeleton.
- [x] Initialize git repository.
- [x] Make first commit.

## Milestone 1: Project Initialization

- [x] Initialize npm project.
- [x] Install TypeScript, Express, Knex, MySQL driver, dotenv, Jest, and Supertest.
- [x] Configure `tsconfig.json`.
- [x] Configure test runner.
- [x] Add `src/app.ts` and `src/server.ts`.
- [x] Add health endpoint.
- [x] Add `.env.example`.
- [x] Verify `npm run dev`, `npm run build`, and `npm test`.

## Milestone 2: Database and Knex Setup

- [ ] Configure `knexfile.ts`.
- [ ] Add database connection module.
- [ ] Add users migration.
- [ ] Add wallets migration.
- [ ] Add transactions migration.
- [ ] Add blacklist checks migration.
- [ ] Add migration scripts.
- [ ] Verify migration and rollback commands.

## Milestone 3: Shared Application Infrastructure

- [ ] Add `AppError`.
- [ ] Add error-handling middleware.
- [ ] Add request validation middleware.
- [ ] Add faux auth middleware.
- [ ] Add response helpers.
- [ ] Add money validation helpers.

## Milestone 4: Adjutor Karma Blacklist Integration

- [ ] Add Adjutor client.
- [ ] Add blacklist service.
- [ ] Add Adjutor environment variables.
- [ ] Save blacklist check evidence.
- [ ] Mock Adjutor in tests.
- [ ] Document fail-closed onboarding behavior.

## Milestone 5: User Onboarding

- [ ] Add user validation schema.
- [ ] Add user repository.
- [ ] Add user service.
- [ ] Add user controller and route.
- [ ] Reject duplicate email.
- [ ] Reject duplicate phone.
- [ ] Check Karma before persistence.
- [ ] Create user and wallet in one database transaction.
- [ ] Add onboarding tests.

## Milestone 6: Wallet Funding

- [ ] Add fund validation.
- [ ] Enforce faux auth.
- [ ] Enforce wallet ownership.
- [ ] Validate positive amount.
- [ ] Lock wallet row during mutation.
- [ ] Update balance atomically.
- [ ] Create `FUND` transaction record.
- [ ] Add funding tests.

## Milestone 7: Wallet Withdrawal

- [ ] Add withdraw validation.
- [ ] Enforce faux auth.
- [ ] Enforce wallet ownership.
- [ ] Validate positive amount.
- [ ] Check sufficient funds.
- [ ] Lock wallet row during mutation.
- [ ] Create `WITHDRAW` transaction record.
- [ ] Add withdrawal tests.

## Milestone 8: Wallet-to-Wallet Transfer

- [ ] Add transfer validation.
- [ ] Enforce sender wallet ownership.
- [ ] Validate recipient wallet.
- [ ] Reject invalid amount.
- [ ] Reject same-wallet transfer.
- [ ] Lock wallets in deterministic order.
- [ ] Debit sender and credit recipient atomically.
- [ ] Create linked `TRANSFER_OUT` and `TRANSFER_IN` records.
- [ ] Add transfer tests.

## Milestone 9: Transaction History

- [ ] Add transaction repository.
- [ ] Add wallet transaction history endpoint.
- [ ] Enforce wallet ownership.
- [ ] Return newest transactions first.
- [ ] Add pagination.
- [ ] Add history tests.

## Milestone 10: Test Coverage and Negative Scenarios

- [ ] Cover successful flows.
- [ ] Cover validation failures.
- [ ] Cover authorization failures.
- [ ] Cover blacklist behavior.
- [ ] Cover insufficient funds.
- [ ] Cover transfer rollback behavior.
- [ ] Ensure tests do not depend on the real Adjutor API.

## Milestone 11: README and Documentation

- [ ] Complete README design document.
- [ ] Add E-R diagram image.
- [ ] Add API examples.
- [ ] Add local setup instructions.
- [ ] Add environment variable documentation.
- [ ] Add testing instructions.
- [ ] Add deployment URL.
- [ ] Add tradeoffs and future improvements.

## Milestone 12: Deployment

- [ ] Choose cloud platform.
- [ ] Provision MySQL.
- [ ] Configure production environment variables.
- [ ] Run production migrations.
- [ ] Deploy API.
- [ ] Smoke-test health endpoint and core flows.

## Milestone 13: Public Submission Document

- [ ] Create public Google Doc or Notion page.
- [ ] Add work review.
- [ ] Add architecture choices.
- [ ] Add deployed API URL.
- [ ] Add GitHub repo URL.
- [ ] Add Loom URL.
- [ ] Add known limitations.

## Milestone 14: Loom Video

- [ ] Record under 3 minutes.
- [ ] Show face.
- [ ] Review requirements.
- [ ] Demo implementation and docs.
- [ ] Mention tests and atomic wallet behavior.

## Milestone 15: Final Submission

- [ ] Submit Google Form.
- [ ] Submit GitHub repo URL.
- [ ] Submit deployed API URL.
- [ ] Submit documentation URL.
- [ ] Submit Loom URL.
- [ ] Email `careers@lendsqr.com`.
