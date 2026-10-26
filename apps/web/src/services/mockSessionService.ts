/**
 * ============================================================================
 * ISOLATED DEVELOPMENT MOCK SERVICE
 * ============================================================================
 * NOTE: This file is STRICTLY for offline UI testing and component styling.
 * It is completely segregated from production runtime services.
 * Production routes use real APIs via `apiClient.ts` and genuine browser GPS.
 * ============================================================================
 */

import {
  CreateSessionOptions,
  SessionCreatedResult,
  SessionPublicMetadata,
} from '@/types/session.types';

// In-memory mock store for isolated frontend prototyping
const mockSessions = new Map<string, SessionPublicMetadata>();

export class MockSessionService {
  async createSession(options: CreateSessionOptions): Promise<SessionCreatedResult> {
    const sessionId = `mock_${Math.random().toString(36).substring(2, 10)}`;
    const senderToken = `st_mock_${Math.random().toString(36).substring(2, 16)}`;
    const viewerToken = `vt_mock_${Math.random().toString(36).substring(2, 16)}`;
    const expiresAt = new Date(Date.now() + options.durationMinutes * 60 * 1000).toISOString();

    const newSession: SessionPublicMetadata = {
      sessionId,
      status: 'active',
      title: options.title || 'Demo Location Stream',
      durationMinutes: options.durationMinutes,
      expiresAt,
      requirePasscode: Boolean(options.passcode),
      viewerCount: 1,
      lastLocation: {
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 15.0,
        heading: 90,
        speed: 1.5,
        altitude: 10,
        timestamp: Date.now(),
      },
    };

    mockSessions.set(sessionId, newSession);

    const shareUrl = `${window.location.origin}/v/${sessionId}#key=${viewerToken}`;

    return {
      sessionId,
      senderToken,
      viewerToken,
      shareUrl,
      durationMinutes: options.durationMinutes,
      expiresAt,
      requirePasscode: Boolean(options.passcode),
    };
  }

  async getSessionMetadata(sessionId: string): Promise<SessionPublicMetadata> {
    // If not found in memory, generate a default sample mock session for preview
    if (!mockSessions.has(sessionId)) {
      mockSessions.set(sessionId, {
        sessionId,
        status: 'active',
        title: 'Sample Walking Session',
        durationMinutes: 30,
        expiresAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
        requirePasscode: false,
        viewerCount: 2,
        lastLocation: {
          latitude: 40.712776,
          longitude: -74.005974,
          accuracy: 12.0,
          heading: 180,
          speed: 1.3,
          altitude: 8.5,
          timestamp: Date.now(),
        },
      });
    }

    return mockSessions.get(sessionId)!;
  }

  async stopSession(sessionId: string): Promise<void> {
    const session = mockSessions.get(sessionId);
    if (session) {
      session.status = 'revoked';
      session.lastLocation = null;
    }
  }

  async pauseSession(sessionId: string): Promise<void> {
    const session = mockSessions.get(sessionId);
    if (session) {
      session.status = 'paused';
    }
  }

  async resumeSession(sessionId: string): Promise<void> {
    const session = mockSessions.get(sessionId);
    if (session) {
      session.status = 'active';
    }
  }
}

export const mockSessionService = new MockSessionService();

