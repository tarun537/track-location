import { Request, Response, NextFunction } from 'express';
import { Session, ISessionDocument } from '../models/session.model.js';
import { CryptoService } from '../services/crypto.service.js';
import { AppError } from '../utils/errors.js';

export interface AuthenticatedRequest extends Request {
  sessionDoc?: ISessionDocument;
  viewerToken?: string | null;
}

/**
 * Middleware: Enforces sender authentication via Bearer token
 */
export async function requireSenderAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new AppError(
        'UNAUTHORIZED_TOKEN',
        'Authorization header with Bearer token is required.',
        401
      )
    );
  }

  const rawToken = authHeader.split(' ')[1];
  if (!rawToken) {
    return next(new AppError('UNAUTHORIZED_TOKEN', 'Malformed Bearer token.', 401));
  }

  const sessionId = req.params.sessionId;
  if (!sessionId) {
    return next(new AppError('BAD_REQUEST_PAYLOAD', 'Session ID is required in URL.', 400));
  }

  try {
    const senderTokenHash = CryptoService.hashToken(rawToken);

    const session = await Session.findOne({
      sessionId,
      senderTokenHash,
    });

    if (!session) {
      return next(
        new AppError('UNAUTHORIZED_TOKEN', 'Invalid sender authorization token.', 401)
      );
    }

    // Server-enforced expiry and revocation check
    if (session.isExpired()) {
      return next(
        new AppError('SESSION_EXPIRED', 'This session has expired or been revoked.', 410)
      );
    }

    req.sessionDoc = session;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware: Extracts recipient capability token if provided
 */
export function optionalViewerAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const viewerKey =
    (req.headers['x-session-viewer-key'] as string) ||
    (req.query.key as string) ||
    null;

  req.viewerToken = viewerKey;
  next();
}

