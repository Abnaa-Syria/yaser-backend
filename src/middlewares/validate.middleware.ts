// src/middlewares/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodObject } from 'zod';
import { catchAsync } from '../utils/catchAsync.js';

export const validate = (schema: ZodObject) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // Assign back parsed/transformed values safely
    if (result.body) Object.assign(req.body, result.body);
    if (result.query) Object.assign(req.query, result.query);
    if (result.params) Object.assign(req.params, result.params);

    
    next();

  });
};