import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/environment.js';
import { apiRouter } from './routes/api.router.js';
import { errorHandler } from './middleware/error.middleware.js';
import { generalApiLimiter } from './middleware/rateLimiter.middleware.js';
import { AppError } from './utils/errors.js';

export function createApp(): Express {
  const app = express();

  // 1. Trust proxy for reverse proxies (Render, Vercel Edge, Cloudflare)
  app.set('trust proxy', 1);

  // 2. Helmet Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https://*.tile.openstreetmap.org'],
          connectSrc: ["'self'", env.CLIENT_ORIGIN],
          upgradeInsecureRequests: [],
        },
      },
      referrerPolicy: { policy: 'no-referrer' }, // Strict no-referrer prevents URL token leaks
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
      xContentTypeOptions: true,
    })
  );

  // 3. Permissions Policy Header
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(self), microphone=(), camera=(), payment=(), usb=()'
    );
    next();
  });

  // 4. Strict CORS
  app.use(
    cors({
      origin: [env.CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Viewer-Key'],
      credentials: true,
    })
  );

  // 5. Body Parsing with bounded payload size
  app.use(express.json({ limit: '50kb' }));
  app.use(express.urlencoded({ extended: true, limit: '50kb' }));

  // 6. General API Rate Limiter
  app.use('/api', generalApiLimiter);

  // 7. Mount Routers (Supports both /api and /api/v1 paths)
  app.use('/api', apiRouter);
  app.use('/api/v1', apiRouter);

  // Root healthcheck fallback
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'locato-api' });
  });

  // 8. 404 Route Handler
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError('ROUTE_NOT_FOUND', 'Requested API endpoint does not exist.', 404));
  });

  // 9. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
