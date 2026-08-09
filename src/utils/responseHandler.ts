// src/utils/responseHandler.ts
import { Response } from 'express';

// بنعرف الـ Types بتاعة الداتا اللي الفانكشن دي هتقبلها
interface SuccessResponseArgs {
  res: Response;
  data?: any;
  message?: string;
  statusCode?: number;
  results?: number;
  meta?: any;
}

export const successResponse = ({
  res,
  data = {},
  message = 'Operation successful',
  statusCode = 200,
  results,
  meta,
}: SuccessResponseArgs) => {
  return res.status(statusCode).json({
    success: true,
    message,
    results,
    meta,
    data,
  });
};