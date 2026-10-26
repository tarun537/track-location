import { ApiResponse } from '@/types/api.types';
import {
  CreateSessionOptions,
  SessionCreatedResult,
  SessionPublicMetadata,
} from '@/types/session.types';

function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost')) {
    return import.meta.env.VITE_API_URL;
  }
  if (
    typeof window !== 'undefined' &&
    window.location.hostname &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return `http://${window.location.hostname}:5000/api/v1`;
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
}

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      let errorMessage =
        (!data.success && data.error?.message) ||
        `HTTP Error ${response.status}: ${response.statusText}`;

      // Surface validation details if present
      if (
        !data.success &&
        data.error?.details &&
        Array.isArray(data.error.details) &&
        data.error.details.length > 0
      ) {
        const detailTexts = data.error.details
          .map((d: { message?: string }) => d.message)
          .filter(Boolean);
        if (detailTexts.length > 0) {
          errorMessage = detailTexts.join('. ');
        }
      }

      const error = new Error(errorMessage);
      (error as unknown as { code?: string; statusCode?: number }).statusCode = response.status;
      (error as unknown as { code?: string; statusCode?: number }).code =
        (!data.success && data.error?.code) || undefined;
      throw error;
    }

    return data.data;
  }

  /**
   * Creates a new ephemeral sharing session
   */
  async createSession(options: CreateSessionOptions): Promise<SessionCreatedResult> {
    return this.request<SessionCreatedResult>('/sessions', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  /**
   * Fetches public session metadata and latest coordinate for viewers
   */
  async getSessionMetadata(
    sessionId: string,
    viewerToken?: string | null
  ): Promise<SessionPublicMetadata> {
    const headers: Record<string, string> = {};
    if (viewerToken) {
      headers['X-Session-Viewer-Key'] = viewerToken;
    }
    return this.request<SessionPublicMetadata>(`/sessions/${sessionId}`, {
      method: 'GET',
      headers,
    });
  }

  /**
   * Verifies session passcode for protected sessions
   */
  async verifyPasscode(
    sessionId: string,
    passcode: string
  ): Promise<{ verified: boolean; viewerToken: string }> {
    return this.request<{ verified: boolean; viewerToken: string }>(
      `/sessions/${sessionId}/verify-passcode`,
      {
        method: 'POST',
        body: JSON.stringify({ passcode }),
      }
    );
  }

  /**
   * Stops/revokes an active session immediately (Kill Switch)
   */
  async stopSession(sessionId: string, senderToken: string): Promise<void> {
    await this.request(`/sessions/${sessionId}/stop`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${senderToken}`,
      },
    });
  }

  /**
   * Pauses location broadcast
   */
  async pauseSession(sessionId: string, senderToken: string): Promise<void> {
    await this.request(`/sessions/${sessionId}/pause`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${senderToken}`,
      },
    });
  }

  /**
   * Resumes location broadcast
   */
  async resumeSession(sessionId: string, senderToken: string): Promise<void> {
    await this.request(`/sessions/${sessionId}/resume`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${senderToken}`,
      },
    });
  }

  /**
   * Extends session expiration
   */
  async extendSession(
    sessionId: string,
    senderToken: string,
    additionalMinutes: number
  ): Promise<{ durationMinutes: number; expiresAt: string }> {
    return this.request<{ durationMinutes: number; expiresAt: string }>(
      `/sessions/${sessionId}/extend`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${senderToken}`,
        },
        body: JSON.stringify({ additionalMinutes }),
      }
    );
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

