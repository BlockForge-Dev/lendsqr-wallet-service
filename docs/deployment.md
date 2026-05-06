# Deployment Guide

This project is prepared for deployment on Render using Docker, with MySQL hosted on Aiven or another managed MySQL provider.

Target public service name:

```text
obinna-victor-lendsqr-be-test
```

Expected Render URL:

```text
https://obinna-victor-lendsqr-be-test.onrender.com
```

## Platform Choice

- API hosting: Render web service
- Runtime: Docker
- Database: Aiven MySQL
- Migration strategy: run compiled Knex migrations during container startup
- Health check path: `/health`

Render is a good fit for this assessment because it can deploy directly from GitHub and expose a public HTTPS URL quickly. Aiven is used for MySQL because the assessment requires MySQL rather than Postgres.

## Required Environment Variables

Set these in the Render service dashboard.

```text
NODE_ENV=production
PORT=3000
DATABASE_HOST=<aiven-mysql-host>
DATABASE_PORT=<aiven-mysql-port>
DATABASE_USER=<aiven-mysql-user>
DATABASE_PASSWORD=<aiven-mysql-password>
DATABASE_NAME=lendsqr_wallet_service
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true
DATABASE_SSL_CA=<aiven-ca-certificate-if-required>
ADJUTOR_BASE_URL=https://adjutor.lendsqr.com/v2
ADJUTOR_API_KEY=<adjutor-api-key>
```

Do not commit database passwords, Adjutor keys, or CA certificates.

## Deployment Steps

1. Push the repository to GitHub.
2. Create a new Render Blueprint or Docker web service from the repository.
3. Use `render.yaml` if creating the service as a Blueprint.
4. Add the required environment variables in Render.
5. Deploy the service.
6. Confirm startup logs show the production migration command completing.
7. Smoke-test the deployed health endpoint.

## Smoke Tests

Health check:

```bash
curl https://obinna-victor-lendsqr-be-test.onrender.com/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "lendsqr-wallet-service"
}
```

After health passes, test the core wallet flow:

- `POST /api/v1/users`
- `GET /api/v1/wallets/:walletId`
- `POST /api/v1/wallets/:walletId/fund`
- `POST /api/v1/wallets/:walletId/transfers`
- `POST /api/v1/wallets/:walletId/withdraw`
- `GET /api/v1/wallets/:walletId/transactions`

## Notes

- The Docker container runs `npm run migrate:latest:prod` before `npm start`.
- Production migration scripts use `dist/knexfile.js` and compiled migration files.
- MySQL SSL can be enabled with `DATABASE_SSL=true`.
- If Aiven requires its CA certificate, put the certificate body into `DATABASE_SSL_CA` with newline escapes.
