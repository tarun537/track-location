import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { Session } from '../src/models/session.model.js';

let mongoServer: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Session.deleteMany({});
});

describe('1. Health Check Endpoint', () => {
  it('GET /api/health should return 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.database).toBe('connected');
  });
});

describe('2. Session Creation & Validation', () => {
  it('POST /api/sessions should create a session with valid inputs', async () => {
    const res = await request(app).post('/api/sessions').send({
      durationMinutes: 30,
      title: 'Walking from Central Station',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sessionId).toBeDefined();
    expect(res.body.data.senderToken).toMatch(/^st_/);
    expect(res.body.data.viewerToken).toMatch(/^vt_/);
    expect(res.body.data.shareUrl).toContain(res.body.data.sessionId);
    expect(res.body.data.shareUrl).toContain(`#key=${res.body.data.viewerToken}`);
    expect(res.body.data.durationMinutes).toBe(30);

    // Verify database stores ONLY hashed tokens, never raw secrets!
    const dbSession = await Session.findOne({ sessionId: res.body.data.sessionId });
    expect(dbSession).toBeDefined();
    expect(dbSession?.senderTokenHash).toBeDefined();
    expect((dbSession as unknown as { senderToken?: string })?.senderToken).toBeUndefined();
    expect(dbSession?.senderTokenHash).not.toEqual(res.body.data.senderToken);
  });

  it('POST /api/sessions should reject invalid duration (< 5 min)', async () => {
    const res = await request(app).post('/api/sessions').send({
      durationMinutes: 2,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BAD_REQUEST_PAYLOAD');
  });

  it('POST /api/sessions should reject invalid passcode format', async () => {
    const res = await request(app).post('/api/sessions').send({
      durationMinutes: 30,
      passcode: 'abc', // Non-numeric
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BAD_REQUEST_PAYLOAD');
  });
});

describe('3. Public Metadata Retrieval & Passcode Authorization', () => {
  it('GET /api/sessions/:sessionId returns session metadata for public session', async () => {
    const createRes = await request(app).post('/api/sessions').send({
      durationMinutes: 45,
      title: 'City Run',
    });

    const sessionId = createRes.body.data.sessionId;

    const res = await request(app).get(`/api/sessions/${sessionId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sessionId).toBe(sessionId);
    expect(res.body.data.title).toBe('City Run');
    expect(res.body.data.isUnlocked).toBe(true);
  });

  it('GET /api/sessions/:sessionId with passcode returns locked status and omits coordinates', async () => {
    const createRes = await request(app).post('/api/sessions').send({
      durationMinutes: 30,
      passcode: '1234',
    });

    const sessionId = createRes.body.data.sessionId;

    // Attach a coordinate to the session document in DB to test omission
    await Session.updateOne(
      { sessionId },
      {
        lastLocation: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
          timestamp: new Date(),
        },
      }
    );

    // Request without passcode
    const res = await request(app).get(`/api/sessions/${sessionId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.requirePasscode).toBe(true);
    expect(res.body.data.isUnlocked).toBe(false);
    expect(res.body.data.lastLocation).toBeNull(); // Omitted!
  });

  it('POST /api/sessions/:sessionId/authorize verifies correct PIN', async () => {
    const createRes = await request(app).post('/api/sessions').send({
      durationMinutes: 30,
      passcode: '9876',
    });

    const sessionId = createRes.body.data.sessionId;

    // Wrong PIN
    const wrongRes = await request(app)
      .post(`/api/sessions/${sessionId}/authorize`)
      .send({ passcode: '0000' });
    expect(wrongRes.status).toBe(401);
    expect(wrongRes.body.error.code).toBe('UNAUTHORIZED_TOKEN');

    // Correct PIN
    const correctRes = await request(app)
      .post(`/api/sessions/${sessionId}/authorize`)
      .send({ passcode: '9876' });
    expect(correctRes.status).toBe(200);
    expect(correctRes.body.data.verified).toBe(true);
  });
});

describe('4. Sender Authorization & Lifecycle Mutations', () => {
  it('rejects mutations without valid Bearer token', async () => {
    const createRes = await request(app).post('/api/sessions').send({ durationMinutes: 30 });
    const sessionId = createRes.body.data.sessionId;

    // No auth header
    const noAuth = await request(app).post(`/api/sessions/${sessionId}/pause`);
    expect(noAuth.status).toBe(401);
    expect(noAuth.body.error.code).toBe('UNAUTHORIZED_TOKEN');

    // Invalid token
    const wrongAuth = await request(app)
      .post(`/api/sessions/${sessionId}/pause`)
      .set('Authorization', 'Bearer st_invalid_token_12345');
    expect(wrongAuth.status).toBe(401);
  });

  it('pauses and resumes session with valid senderToken', async () => {
    const createRes = await request(app).post('/api/sessions').send({ durationMinutes: 30 });
    const { sessionId, senderToken } = createRes.body.data;

    // Pause
    const pauseRes = await request(app)
      .post(`/api/sessions/${sessionId}/pause`)
      .set('Authorization', `Bearer ${senderToken}`);
    expect(pauseRes.status).toBe(200);
    expect(pauseRes.body.data.status).toBe('paused');

    // Resume
    const resumeRes = await request(app)
      .post(`/api/sessions/${sessionId}/resume`)
      .set('Authorization', `Bearer ${senderToken}`);
    expect(resumeRes.status).toBe(200);
    expect(resumeRes.body.data.status).toBe('active');
  });

  it('extends session duration with valid senderToken', async () => {
    const createRes = await request(app).post('/api/sessions').send({ durationMinutes: 30 });
    const { sessionId, senderToken } = createRes.body.data;

    const extendRes = await request(app)
      .patch(`/api/sessions/${sessionId}/extend`)
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ additionalMinutes: 15 });

    expect(extendRes.status).toBe(200);
    expect(extendRes.body.data.durationMinutes).toBe(45);
  });
});

describe('5. Instant Revocation (Kill Switch) & Zero-Retention Purge', () => {
  it('POST /api/sessions/:sessionId/revoke halts session and immediately purges location', async () => {
    const createRes = await request(app).post('/api/sessions').send({ durationMinutes: 30 });
    const { sessionId, senderToken } = createRes.body.data;

    // Set a coordinate in DB
    await Session.updateOne(
      { sessionId },
      {
        lastLocation: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
          timestamp: new Date(),
        },
      }
    );

    // Call Revoke (Kill switch)
    const revokeRes = await request(app)
      .post(`/api/sessions/${sessionId}/revoke`)
      .set('Authorization', `Bearer ${senderToken}`);

    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.data.status).toBe('revoked');

    // Verify database has NULL location immediately (Zero-Retention guarantee)
    const dbSession = await Session.findOne({ sessionId });
    expect(dbSession?.status).toBe('revoked');
    expect(dbSession?.lastLocation).toBeNull();

    // Subsequent retrieval returns 410 Gone / SESSION_REVOKED
    const getRes = await request(app).get(`/api/sessions/${sessionId}`);
    expect(getRes.status).toBe(410);
    expect(getRes.body.error.code).toBe('SESSION_REVOKED');
  });
});

describe('6. Server-Enforced Expiration', () => {
  it('enforces expiration dynamically when expiresAt has passed', async () => {
    const createRes = await request(app).post('/api/sessions').send({ durationMinutes: 30 });
    const sessionId = createRes.body.data.sessionId;

    // Manually force expiresAt to a past timestamp
    await Session.updateOne(
      { sessionId },
      { expiresAt: new Date(Date.now() - 1000) }
    );

    const res = await request(app).get(`/api/sessions/${sessionId}`);
    expect(res.status).toBe(410);
    expect(res.body.error.code).toBe('SESSION_EXPIRED');
  });
});
