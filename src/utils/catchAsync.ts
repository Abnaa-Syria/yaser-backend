// src/utils/catchAsync.ts
import { Request, Response, NextFunction } from 'express';

// نوع الفانكشن اللي بتستقبلها (اللي هي الـ Controller)
type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const catchAsync = (fn: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};