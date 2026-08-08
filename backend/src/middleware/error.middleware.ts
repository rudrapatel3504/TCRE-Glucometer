import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[Error]', err.stack || err.message || err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
}
