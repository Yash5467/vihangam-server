import { CustomRequest } from '@/types/types.js';
import { ApiError } from '@/utils/responseHandler.js';
import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

export const validateRequestMiddleware =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    const dataToValidate =
      req.method === 'GET' || req.method === 'DELETE' ? req.query : req.body;
    const result = schema.safeParse(dataToValidate);
    if (!result.success) {
      return res
        .status(400)
        .json(new ApiError(400, result.error.issues[0].message));
    }

    (req as CustomRequest).validatedBody = result.data;
    next();
  };