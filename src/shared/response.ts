import type { Response } from 'express';

type SuccessPayload<T> = {
  success: true;
  message: string;
  data?: T;
};

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
): Response<SuccessPayload<T>> => {
  const payload: SuccessPayload<T> = {
    success: true,
    message,
  };

  if (data !== undefined) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
};
