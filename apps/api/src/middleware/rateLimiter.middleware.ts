import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/errors.js';
import { env } from '../config/environment.js';

const isTest = env.NODE_ENV === 'test';

export const createSessionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  skip: () => isTest, // Disable rate limiting in test suite
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      new AppError(
        'RATE_LIMIT_EXCEEDED',
        'Too many session creation requests. Please wait a minute before creating another session.',
        429
      )
    );
  },
});

export const verifyPasscodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skip: () => isTest,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      new AppError(
        'RATE_LIMIT_EXCEEDED',
        'Too many passcode verification attempts. Please wait 15 minutes.',
        429
      )
    );
  },
});

export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  skip: () => isTest,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      new AppError('RATE_LIMIT_EXCEEDED', 'Too many requests. Please slow down.', 429)
    );
  },
});

