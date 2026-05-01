import express, { type Request, type Response } from 'express';

const app = express();

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'ok',
    service: 'lendsqr-wallet-service',
  });
});

export { app };
