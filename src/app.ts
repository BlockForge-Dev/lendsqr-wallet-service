import express, { type Request, type Response } from 'express';

import { errorHandler } from './middlewares/error-handler';
import { notFound } from './middlewares/not-found';
import { createUserRouter } from './modules/users/user.routes';

const app = express();

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'ok',
    service: 'lendsqr-wallet-service',
  });
});

app.use('/api/v1/users', createUserRouter());

app.use(notFound);
app.use(errorHandler);

export { app };
