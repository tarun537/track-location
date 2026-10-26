import { Router } from 'express';
import { SessionController } from '../controllers/session.controller.js';
import {
  requireSenderAuth,
  optionalViewerAuth,
} from '../middleware/auth.middleware.js';
import {
  validateBody,
  validateParams,
} from '../middleware/validate.middleware.js';
import {
  CreateSessionSchema,
  VerifyPasscodeSchema,
  ExtendSessionSchema,
  SessionIdParamSchema,
} from '../schemas/session.schema.js';
import {
  createSessionLimiter,
  verifyPasscodeLimiter,
} from '../middleware/rateLimiter.middleware.js';

export const sessionRouter = Router();

// 1. Create Session
sessionRouter.post(
  '/',
  createSessionLimiter,
  validateBody(CreateSessionSchema),
  SessionController.create
);

// 2. Get Public Session Metadata (Recipient View)
sessionRouter.get(
  '/:sessionId',
  validateParams(SessionIdParamSchema),
  optionalViewerAuth,
  SessionController.getById
);

// 3. Authorize / Verify Passcode (supports both /authorize and /verify-passcode paths)
sessionRouter.post(
  '/:sessionId/authorize',
  verifyPasscodeLimiter,
  validateParams(SessionIdParamSchema),
  validateBody(VerifyPasscodeSchema),
  SessionController.authorize
);

sessionRouter.post(
  '/:sessionId/verify-passcode',
  verifyPasscodeLimiter,
  validateParams(SessionIdParamSchema),
  validateBody(VerifyPasscodeSchema),
  SessionController.authorize
);

// 4. Revoke / Stop Session (Kill Switch) (supports both /revoke and /stop)
sessionRouter.post(
  '/:sessionId/revoke',
  validateParams(SessionIdParamSchema),
  requireSenderAuth,
  SessionController.revoke
);

sessionRouter.post(
  '/:sessionId/stop',
  validateParams(SessionIdParamSchema),
  requireSenderAuth,
  SessionController.revoke
);

// 5. Pause Broadcast
sessionRouter.post(
  '/:sessionId/pause',
  validateParams(SessionIdParamSchema),
  requireSenderAuth,
  SessionController.pause
);

// 6. Resume Broadcast
sessionRouter.post(
  '/:sessionId/resume',
  validateParams(SessionIdParamSchema),
  requireSenderAuth,
  SessionController.resume
);

// 7. Extend Session
sessionRouter.patch(
  '/:sessionId/extend',
  validateParams(SessionIdParamSchema),
  requireSenderAuth,
  validateBody(ExtendSessionSchema),
  SessionController.extend
);

