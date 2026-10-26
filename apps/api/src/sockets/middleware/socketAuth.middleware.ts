import { Socket } from 'socket.io';
import { Session, ISessionDocument } from '../../models/session.model.js';
import { CryptoService } from '../../services/crypto.service.js';
import { logger } from '../../utils/logger.js';

export interface AuthenticatedSocketData {
  role: 'sender' | 'viewer';
  sessionId: string;
  sessionDoc: ISessionDocument;
}

export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> {
  const auth = socket.handshake.auth;

  if (!auth || typeof auth !== 'object') {
    return next(new Error('AUTHENTICATION_ERROR: Missing auth payload'));
  }

  const { role, sessionId, token } = auth;

  if (!sessionId || typeof sessionId !== 'string') {
    return next(new Error('AUTHENTICATION_ERROR: sessionId is required'));
  }

  if (role !== 'sender' && role !== 'viewer') {
    return next(new Error('AUTHENTICATION_ERROR: Invalid role. Must be sender or viewer'));
  }

  try {
    const session = await Session.findOne({ sessionId });

    if (!session) {
      return next(new Error('SESSION_NOT_FOUND: Sharing session not found'));
    }

    // Server-enforced revocation check
    if (session.status === 'revoked') {
      return next(new Error('SESSION_REVOKED: Sharing session has been stopped by the sender'));
    }

    // Server-enforced expiry check
    if (session.isExpired()) {
      return next(new Error('SESSION_EXPIRED: Sharing session has ended or expired'));
    }

    // Role-specific verification
    if (role === 'sender') {
      if (!token || typeof token !== 'string') {
        return next(new Error('UNAUTHORIZED_TOKEN: Sender token is required'));
      }

      const isValidSender = CryptoService.verifyToken(token, session.senderTokenHash);
      if (!isValidSender) {
        logger.warn({ sessionId }, 'Unauthorized sender socket connection attempt');
        return next(new Error('UNAUTHORIZED_TOKEN: Invalid sender token'));
      }
    } else {
      // Role: viewer
      // Session ID alone does NOT authorize access to WebSocket broadcasts!
      // Viewer MUST supply a valid capability token matching viewerTokenHash
      if (!token || typeof token !== 'string') {
        return next(new Error('UNAUTHORIZED_TOKEN: Viewer capability token is required'));
      }

      if (session.viewerTokenHash) {
        const isValidViewer = CryptoService.verifyToken(token, session.viewerTokenHash);
        if (!isValidViewer) {
          return next(new Error('UNAUTHORIZED_TOKEN: Invalid viewer capability token'));
        }
      }
    }

    // Attach validated session data to socket
    socket.data = {
      role,
      sessionId,
      sessionDoc: session,
    } as AuthenticatedSocketData;

    next();
  } catch (error) {
    logger.error({ error, sessionId }, 'Socket authentication error');
    next(new Error('INTERNAL_SERVER_ERROR: Authentication check failed'));
  }
}
