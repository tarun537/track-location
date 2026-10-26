import { Response, NextFunction } from 'express';
import { SessionService } from '../services/session.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class SessionController {
  /**
   * POST /api/sessions
   */
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SessionService.createSession(req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sessions/:sessionId
   */
  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.params.sessionId as string;
      const viewerToken = req.viewerToken;
      const sessionData = await SessionService.getSessionById(sessionId, viewerToken);

      res.status(200).json({
        success: true,
        data: sessionData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/sessions/:sessionId/authorize OR verify-passcode
   */
  static async authorize(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.params.sessionId as string;
      const { passcode } = req.body;
      const result = await SessionService.verifyPasscode(sessionId, passcode);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/sessions/:sessionId/revoke OR stop (Kill Switch)
   */
  static async revoke(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = req.sessionDoc!;
      await SessionService.revokeSession(session);

      res.status(200).json({
        success: true,
        data: {
          sessionId: session.sessionId,
          status: 'revoked',
          revokedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/sessions/:sessionId/pause
   */
  static async pause(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = req.sessionDoc!;
      await SessionService.pauseSession(session);

      res.status(200).json({
        success: true,
        data: {
          sessionId: session.sessionId,
          status: 'paused',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/sessions/:sessionId/resume
   */
  static async resume(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = req.sessionDoc!;
      await SessionService.resumeSession(session);

      res.status(200).json({
        success: true,
        data: {
          sessionId: session.sessionId,
          status: 'active',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/sessions/:sessionId/extend
   */
  static async extend(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = req.sessionDoc!;
      const { additionalMinutes } = req.body;
      const result = await SessionService.extendSession(session, additionalMinutes);

      res.status(200).json({
        success: true,
        data: {
          sessionId: session.sessionId,
          ...result,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
