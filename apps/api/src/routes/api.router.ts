import { Router } from 'express';
import { getHealthCheck } from '../controllers/health.controller.js';
import { sessionRouter } from './session.router.js';

export const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', getHealthCheck);

// Sessions CRUD endpoints
apiRouter.use('/sessions', sessionRouter);
