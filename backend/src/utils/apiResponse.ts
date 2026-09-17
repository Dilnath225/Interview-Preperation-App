import { Response } from 'express';

export interface StandardResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: Record<string, any>;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  data?: T,
  message?: string,
  meta?: Record<string, any>
) => {
  const payload: StandardResponse<T> = {
    success: statusCode >= 200 && statusCode < 300,
    ...(message && { message }),
    ...(data !== undefined && { data }),
    ...(meta && { meta }),
  };

  return res.status(statusCode).json(payload);
};
