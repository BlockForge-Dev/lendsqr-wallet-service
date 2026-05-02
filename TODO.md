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

- [x] Configure `knexfile.ts`.
- [x] Add database connection module.
- [x] Add users migration.
- [x] Add wallets migration.
- [x] Add transactions migration.
- [x] Add blacklist checks migration.
- [x] Add migration scripts.
- [ ] Verify migration and rollback commands against a running MySQL database.

Note: Knex CLI loading was verified, but local migration execution is pending because no MySQL service is listening on `localhost:3306` in the current environment.

## Milestone 3: Shared Application Infrastructure

- [x] Add `AppError`.
- [x] Add error-handling middleware.
- [x] Add request validation middleware.
- [x] Add faux auth middleware.
- [x] Add response helpers.
- [x] Add money validation helpers.

## Milestone 4: Adjutor Karma Blacklist Integration

- [x] Add Adjutor client.
- [x] Add blacklist service.
- [x] Add Adjutor environment variables.
- [x] Save blacklist check evidence.
- [x] Mock Adjutor in tests.
- [x] Document fail-closed onboarding behavior.

## Milestone 5: User Onboarding

- [x] Add user validation schema.
- [x] Add user repository.
- [x] Add user service.
- [x] Add user controller and route.
- [x] Reject duplicate email.
- [x] Reject duplicate phone.
- [x] Check Karma before persistence.
- [x] Create user and wallet in one database transaction.
- [x] Add onboarding tests.

## Milestone 6: Wallet Funding

- [x] Add fund validation.
- [x] Enforce faux auth.
- [x] Enforce wallet ownership.
- [x] Validate positive amount.
- [x] Lock wallet row during mutation.
- [x] Update balance atomically.
- [x] Create `FUND` transaction record.
- [x] Add funding tests.

## Milestone 7: Wallet Withdrawal

- [x] Add withdraw validation.
- [x] Enforce faux auth.
- [x] Enforce wallet ownership.
- [x] Validate positive amount.
- [x] Check sufficient funds.
- [x] Lock wallet row during mutation.
- [x] Create `WITHDRAW` transaction record.
- [x] Add withdrawal tests.

## Milestone 8: Wallet-to-Wallet Transfer

- [x] Add transfer validation.
- [x] Enforce sender wallet ownership.
- [x] Validate recipient wallet.
- [x] Reject invalid amount.
- [x] Reject same-wallet transfer.
- [x] Lock wallets in deterministic order.
- [x] Debit sender and credit recipient atomically.
- [x] Create linked `TRANSFER_OUT` and `TRANSFER_IN` records.
- [x] Add transfer tests.

## Milestone 9: Transaction History

- [x] Add transaction repository.
- [x] Add wallet transaction history endpoint.
- [x] Enforce wallet ownership.
- [x] Return newest transactions first.
- [x] Add pagination.
- [x] Add history tests.

## Milestone 10: Test Coverage and Negative Scenarios

- [x] Cover successful flows.
- [x] Cover validation failures.
- [x] Cover authorization failures.
- [x] Cover blacklist behavior.
- [x] Cover insufficient funds.
- [x] Cover transfer rollback behavior.
- [x] Ensure tests do not depend on the real Adjutor API.

Note: Milestone 10 also closed the remaining wallet detail endpoint requirement with owner-only access tests.

## Milestone 11: README and Documentation

- [x] Complete README design document.
- [x] Add E-R diagram image.
- [x] Add API examples.
- [x] Add local setup instructions.
- [x] Add environment variable documentation.
- [x] Add testing instructions.
- [ ] Add deployment URL.
- [x] Add tradeoffs and future improvements.

Note: the README now includes the deployment section and target URL format. The actual public URL is pending Milestone 12 deployment.

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
