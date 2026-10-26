import { Session, ISessionDocument, ILocationSnapshot } from '../models/session.model.js';
import { CryptoService } from './crypto.service.js';
import { AppError } from '../utils/errors.js';
import { CreateSessionInput } from '../schemas/session.schema.js';
import { env } from '../config/environment.js';

export interface CreateSessionResult {
  sessionId: string;
  senderToken: string;
  viewerToken: string;
  shareUrl: string;
  durationMinutes: number;
  expiresAt: string;
  requirePasscode: boolean;
}

export interface SessionPublicData {
  sessionId: string;
  status: string;
  title?: string | null;
  durationMinutes: number;
  expiresAt: string;
  requirePasscode: boolean;
  isUnlocked: boolean;
  viewerCount: number;
  lastLocation?: ILocationSnapshot | null;
}

export class SessionService {
  /**
   * Creates a new ephemeral location-sharing session
   */
  static async createSession(input: CreateSessionInput): Promise<CreateSessionResult> {
    const sessionId = CryptoService.generateSessionId();
    const senderToken = CryptoService.generateSenderToken();
    const viewerToken = input.passcode
      ? CryptoService.deriveViewerTokenFromPasscode(sessionId, input.passcode)
      : CryptoService.generateViewerToken();

    const senderTokenHash = CryptoService.hashToken(senderToken);
    const viewerTokenHash = CryptoService.hashToken(viewerToken);

    const durationMinutes = input.durationMinutes ?? 30;
    // 0 minutes designates an indefinite session (until stopped manually); expire after 365 days in MongoDB
    const expiresAt =
      durationMinutes === 0
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + durationMinutes * 60 * 1000);

    const passcodeHash = input.passcode ? CryptoService.hashPasscode(input.passcode) : null;

    const session = new Session({
      sessionId,
      senderTokenHash,
      viewerTokenHash,
      status: 'created',
      title: input.title || null,
      durationMinutes,
      expiresAt,
      settings: {
        requirePasscode: Boolean(input.passcode),
        passcodeHash,
        senderBatteryLow: false,
      },
    });

    await session.save();

    // Construct capability URL with hash fragment (#key=...)
    // If passcode is required, omit key from URL so recipient is prompted for PIN
    const shareUrl = input.passcode
      ? `${env.CLIENT_ORIGIN}/v/${sessionId}`
      : `${env.CLIENT_ORIGIN}/v/${sessionId}#key=${viewerToken}`;

    return {
      sessionId,
      senderToken,
      viewerToken,
      shareUrl,
      durationMinutes,
      expiresAt: expiresAt.toISOString(),
      requirePasscode: Boolean(input.passcode),
    };
  }

  /**
   * Retrieves public session metadata and current coordinate snapshot if authorized
   */
  static async getSessionById(
    sessionId: string,
    viewerToken?: string | null
  ): Promise<SessionPublicData> {
    const session = await Session.findOne({ sessionId });

    if (!session) {
      throw new AppError('SESSION_NOT_FOUND', 'Location sharing session not found.', 404);
    }

    // Check if session has been explicitly revoked
    if (session.status === 'revoked') {
      throw new AppError(
        'SESSION_REVOKED',
        'This location sharing session has been stopped by the sender.',
        410
      );
    }

    // Enforce hard server-side wall-clock expiration check
    if (session.isExpired()) {
      if (session.status !== 'expired') {
        session.status = 'expired';
        session.lastLocation = null;
        await session.save();
      }
      throw new AppError(
        'SESSION_EXPIRED',
        'This location sharing session has expired.',
        410
      );
    }

    // Authorization check:
    // Possession of sessionId alone does NOT authorize access to coordinates!
    // A valid capability token matching viewerTokenHash is strictly required.
    let isUnlocked = false;

    if (viewerToken && session.viewerTokenHash) {
      const isMatch = CryptoService.verifyToken(viewerToken, session.viewerTokenHash);
      if (isMatch) {
        isUnlocked = true;
      }
    }

    return {
      sessionId: session.sessionId,
      status: session.status,
      title: session.title,
      durationMinutes: session.durationMinutes,
      expiresAt: session.expiresAt.toISOString(),
      requirePasscode: session.settings.requirePasscode,
      isUnlocked,
      viewerCount: session.stats.viewerCount,
      // Omit coordinate snapshot if passcode is locked or viewerToken is missing/unauthorized
      lastLocation: isUnlocked ? session.lastLocation : null,
    };
  }

  /**
   * Verifies viewer numeric passcode
   */
  static async verifyPasscode(
    sessionId: string,
    passcode: string
  ): Promise<{ verified: boolean; viewerToken?: string }> {
    const session = await Session.findOne({ sessionId });

    if (!session) {
      throw new AppError('SESSION_NOT_FOUND', 'Session not found.', 404);
    }

    if (session.isExpired()) {
      throw new AppError('SESSION_EXPIRED', 'Session has expired or was revoked.', 410);
    }

    if (!session.settings.requirePasscode || !session.settings.passcodeHash) {
      return { verified: true };
    }

    const isValid = CryptoService.verifyPasscode(passcode, session.settings.passcodeHash);

    if (!isValid) {
      throw new AppError('UNAUTHORIZED_TOKEN', 'Incorrect passcode PIN.', 401);
    }

    const viewerToken = CryptoService.deriveViewerTokenFromPasscode(sessionId, passcode);
    return { verified: true, viewerToken };
  }

  /**
   * Stops/revokes a session (Kill Switch):
   * Immediately purges latest location from database!
   */
  static async revokeSession(session: ISessionDocument): Promise<void> {
    session.status = 'revoked';
    session.lastLocation = null; // Strict Zero-Retention guarantee
    await Session.updateOne(
      { _id: session._id },
      {
        $set: { status: 'revoked' },
        $unset: { lastLocation: 1 },
      }
    );
  }

  /**
   * Pauses location broadcast
   */
  static async pauseSession(session: ISessionDocument): Promise<void> {
    if (session.status === 'revoked' || session.isExpired()) {
      throw new AppError('SESSION_EXPIRED', 'Cannot pause an expired or revoked session.', 410);
    }
    session.status = 'paused';
    await session.save();
  }

  /**
   * Resumes location broadcast
   */
  static async resumeSession(session: ISessionDocument): Promise<void> {
    if (session.status === 'revoked' || session.isExpired()) {
      throw new AppError('SESSION_EXPIRED', 'Cannot resume an expired or revoked session.', 410);
    }
    session.status = 'active';
    await session.save();
  }

  /**
   * Extends session expiration
   */
  static async extendSession(
    session: ISessionDocument,
    additionalMinutes: number
  ): Promise<{ durationMinutes: number; expiresAt: string }> {
    if (session.status === 'revoked' || session.isExpired()) {
      throw new AppError('SESSION_EXPIRED', 'Cannot extend an expired or revoked session.', 410);
    }

    const newDuration = session.durationMinutes + additionalMinutes;
    if (newDuration > 480) {
      throw new AppError(
        'BAD_REQUEST_PAYLOAD',
        'Total session duration cannot exceed 480 minutes (8 hours).',
        400
      );
    }

    const newExpiresAt = new Date(session.expiresAt.getTime() + additionalMinutes * 60 * 1000);

    session.durationMinutes = newDuration;
    session.expiresAt = newExpiresAt;
    await session.save();

    return {
      durationMinutes: newDuration,
      expiresAt: newExpiresAt.toISOString(),
    };
  }
}

