import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/environment.js';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';
  const details = isAppError ? err.details : null;

  // Mask internal error details in production to avoid leaking server state
  const message =
    isAppError || env.NODE_ENV !== 'production'
      ? err.message
      : 'An unexpected internal server error occurred.';

  // Log error with request context (redacting sensitive coordinates and tokens)
  logger.error(
    {
      err: {
        message: err.message,
        stack: env.NODE_ENV !== 'production' ? err.stack : undefined,
        code,
      },
      req: {
        method: req.method,
        url: req.originalUrl,
      },
    },
    'Request error handled'
  );

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      statusCode,
      details,
      timestamp: new Date().toISOString(),
    },
  });
}
