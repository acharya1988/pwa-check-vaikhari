import { NextFunction, Request, Response } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('[BACKEND] Error:', err?.message || err);
  const status = err?.status || 500;
  return res.status(status).json({ success: false, message: 'server-error', error: err?.message || String(err) });
}

