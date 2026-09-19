import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ApiError } from '../utils/apiError';

export const validate = (schema: z.ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return next(new ApiError(400, errorMessage));
      }
      return next(error);
    }
  };
};
