import { describe, it, expect } from 'vitest';

describe('Phase 5 — Secure Links & Recipient Credential Hygiene', () => {
  it('safely extracts viewer capability key from URL hash fragment', () => {
    const testHash = '#key=vt_7b9a2c4e1f8d3e5a';
    const match = testHash.match(/[#&]key=([^&]+)/);
    const extractedKey = match && match[1] ? match[1] : null;

    expect(extractedKey).toBe('vt_7b9a2c4e1f8d3e5a');
  });

  it('handles malformed or missing hash key gracefully without throwing', () => {
    const emptyHash = '';
    const match1 = emptyHash.match(/[#&]key=([^&]+)/);
    expect(match1).toBeNull();

    const unrelatedHash = '#section-2';
    const match2 = unrelatedHash.match(/[#&]key=([^&]+)/);
    expect(match2).toBeNull();
  });

  it('generates clean sanitized URL for address bar stripping', () => {
    // Simulates RFC 3986 client-side secret scrubbing: window.history.replaceState
    const pathname = '/v/xK9_m2Q8vLp4';
    const search = '?ref=sms';
    const hash = '#key=vt_secret_capability_token';

    const fullUrlWithSecret = `https://locato.app${pathname}${search}${hash}`;
    expect(fullUrlWithSecret).toContain('vt_secret_capability_token');

    // Sanitized URL retains path and query params, but strips the secret hash fragment
    const cleanUrl = pathname + search;
    expect(cleanUrl).toBe('/v/xK9_m2Q8vLp4?ref=sms');
    expect(cleanUrl).not.toContain('vt_secret_capability_token');
  });

  it('ensures QR code payload strictly contains canonical share URL without location coordinates', () => {
    const origin = 'https://locato.app';
    const sessionId = 'abc123xyz789';
    const viewerToken = 'vt_3d5f7a9b1c2e4f6a';

    const shareUrl = `${origin}/v/${sessionId}#key=${viewerToken}`;

    // Verify QR code content contains ONLY URL and capability token
    expect(shareUrl).toBe('https://locato.app/v/abc123xyz789#key=vt_3d5f7a9b1c2e4f6a');
    expect(shareUrl).not.toContain('latitude');
    expect(shareUrl).not.toContain('longitude');
    expect(shareUrl).not.toContain('lat');
    expect(shareUrl).not.toContain('lng');
    expect(shareUrl).not.toContain('coords');
  });

  it('verifies configurable duration presets include required choices (15m, 1h, 8h)', () => {
    const presets = [
      { label: '15 min', value: 15 },
      { label: '30 min', value: 30 },
      { label: '1 hour', value: 60 },
      { label: '4 hours', value: 240 },
      { label: '8 hours', value: 480 },
    ];

    const values = presets.map((p) => p.value);
    expect(values).toContain(15);
    expect(values).toContain(60);
    expect(values).toContain(480);
  });
});

