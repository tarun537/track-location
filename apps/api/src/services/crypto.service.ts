import crypto from 'node:crypto';
import { env } from '../config/environment.js';

export class CryptoService {
  /**
   * Generates a cryptographically random, unpredictable session identifier (16 chars base64url).
   */
  static generateSessionId(): string {
    return crypto.randomBytes(12).toString('base64url');
  }

  /**
   * Generates a high-entropy 256-bit sender management secret token.
   */
  static generateSenderToken(): string {
    return `st_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Generates a 128-bit viewer capability access token.
   */
  static generateViewerToken(): string {
    return `vt_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Hashes a secret token using SHA-256 with optional server-side pepper salt.
   * This is irreversible and stored in MongoDB instead of raw tokens.
   */
  static hashToken(rawToken: string): string {
    return crypto
      .createHash('sha256')
      .update(`${rawToken}:${env.TOKEN_SALT}`)
      .digest('hex');
  }

  /**
   * Hashes a numeric passcode/PIN using SHA-256 with pepper salt.
   */
  static hashPasscode(passcode: string): string {
    return crypto
      .createHash('sha256')
      .update(`pin:${passcode}:${env.TOKEN_SALT}`)
      .digest('hex');
  }

  /**
   * Timing-safe token verification to prevent timing attack side-channels.
   */
  static verifyToken(rawToken: string, expectedHash: string): boolean {
    const computedHash = this.hashToken(rawToken);
    const computedBuffer = Buffer.from(computedHash, 'hex');
    const expectedBuffer = Buffer.from(expectedHash, 'hex');

    if (computedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuffer, expectedBuffer);
  }

  /**
   * Timing-safe passcode verification.
   */
  static verifyPasscode(rawPasscode: string, expectedHash: string): boolean {
    const computedHash = this.hashPasscode(rawPasscode);
    const computedBuffer = Buffer.from(computedHash, 'hex');
    const expectedBuffer = Buffer.from(expectedHash, 'hex');

    if (computedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuffer, expectedBuffer);
  }
}
