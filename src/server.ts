import { app } from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
  console.info(`lendsqr-wallet-service listening on port ${env.PORT}`);
});

const shutdown = (signal: NodeJS.Signals): void => {
  console.info(`${signal} received. Closing HTTP server.`);

  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
