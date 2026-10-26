import { ILocationSnapshot } from './location.types';

export type SessionStatus =
  | 'created'
  | 'active'
  | 'disconnected_stale'
  | 'paused'
  | 'revoked'
  | 'expired';

export interface CreateSessionOptions {
  durationMinutes: number;
  title?: string;
  passcode?: string;
}

export interface SessionCreatedResult {
  sessionId: string;
  senderToken: string;
  viewerToken?: string;
  shareUrl: string;
  durationMinutes: number;
  expiresAt: string;
  requirePasscode: boolean;
}

export interface SessionPublicMetadata {
  sessionId: string;
  status: SessionStatus;
  title?: string | null;
  durationMinutes: number;
  expiresAt: string;
  requirePasscode: boolean;
  isUnlocked?: boolean;
  viewerCount: number;
  lastLocation?: ILocationSnapshot | null;
}

