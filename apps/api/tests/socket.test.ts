import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import http from 'node:http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../src/app.js';
import { setupSocketServer } from '../src/sockets/socketServer.js';
import { SessionService } from '../src/services/session.service.js';
import { Session } from '../src/models/session.model.js';

let mongoServer: MongoMemoryServer;
let httpServer: http.Server;
let port: number;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const app = createApp();
  httpServer = http.createServer(app);
  setupSocketServer(httpServer);

  await new Promise<void>((resolve) => {
    httpServer.listen(0, () => {
      const addr = httpServer.address();
      if (addr && typeof addr === 'object') {
        port = addr.port;
      }
      resolve();
    });
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
});

beforeEach(async () => {
  await Session.deleteMany({});
});

describe('Real-Time Socket.IO Location Streaming & Authorization', () => {
  it('authenticates sender and viewer connections and streams live GPS coordinates', async () => {
    // 1. Create a session
    const session = await SessionService.createSession({ durationMinutes: 30 });
    const { sessionId, senderToken, viewerToken } = session;

    // 2. Connect Sender Socket
    const senderSocket: ClientSocket = Client(`http://localhost:${port}`, {
      auth: {
        role: 'sender',
        sessionId,
        token: senderToken,
      },
      transports: ['websocket'],
    });

    // 3. Connect Viewer Socket
    const viewerSocket: ClientSocket = Client(`http://localhost:${port}`, {
      auth: {
        role: 'viewer',
        sessionId,
        token: viewerToken,
      },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise<void>((resolve) => senderSocket.on('connect', resolve)),
      new Promise<void>((resolve) => viewerSocket.on('connect', resolve)),
    ]);

    expect(senderSocket.connected).toBe(true);
    expect(viewerSocket.connected).toBe(true);

    // 4. Test Coordinate Transmission & Reception
    const testCoords = {
      latitude: 40.712776,
      longitude: -74.005974,
      accuracy: 12.5,
      speed: 1.4,
      heading: 185,
      altitude: 10,
      timestamp: Date.now(),
    };

    const broadcastPromise = new Promise<{ latitude: number; longitude: number; accuracy: number }>((resolve) => {
      viewerSocket.on('session:location_broadcast', (data) => {
        resolve(data);
      });
    });

    // Sender emits coordinate fix
    senderSocket.emit('sender:location_update', testCoords);

    // Viewer receives live broadcast!
    const received = await broadcastPromise;
    expect(received.latitude).toBe(40.712776);
    expect(received.longitude).toBe(-74.005974);
    expect(received.accuracy).toBe(12.5);

    // Verify database was updated with the latest snapshot
    const dbSession = await Session.findOne({ sessionId });
    expect(dbSession?.lastLocation?.latitude).toBe(40.712776);
    expect(dbSession?.stats.totalUpdates).toBe(1);

    senderSocket.disconnect();
    viewerSocket.disconnect();
  });

  it('rejects sender handshake with invalid credentials', async () => {
    const session = await SessionService.createSession({ durationMinutes: 30 });

    const badSenderSocket: ClientSocket = Client(`http://localhost:${port}`, {
      auth: {
        role: 'sender',
        sessionId: session.sessionId,
        token: 'st_forged_fake_token',
      },
      transports: ['websocket'],
    });

    const errorPromise = new Promise<Error>((resolve) => {
      badSenderSocket.on('connect_error', (err) => resolve(err));
    });

    const err = await errorPromise;
    expect(err.message).toContain('UNAUTHORIZED_TOKEN');
    badSenderSocket.disconnect();
  });

  it('strictly blocks viewers from emitting location updates', async () => {
    const session = await SessionService.createSession({ durationMinutes: 30 });
    const { sessionId, viewerToken } = session;

    const viewerSocket: ClientSocket = Client(`http://localhost:${port}`, {
      auth: {
        role: 'viewer',
        sessionId,
        token: viewerToken,
      },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => viewerSocket.on('connect', resolve));

    const errorPromise = new Promise<{ code: string }>((resolve) => {
      viewerSocket.on('session:error', resolve);
    });

    // Malicious viewer attempts to emit coordinate update
    viewerSocket.emit('sender:location_update', {
      latitude: 50.0,
      longitude: 10.0,
      accuracy: 5,
    });

    const errData = await errorPromise;
    expect(errData.code).toBe('FORBIDDEN_OPERATION');

    viewerSocket.disconnect();
  });

  it('executes real-time kill switch and purges location across connected viewers', async () => {
    const session = await SessionService.createSession({ durationMinutes: 30 });
    const { sessionId, senderToken, viewerToken } = session;

    const senderSocket: ClientSocket = Client(`http://localhost:${port}`, {
      auth: { role: 'sender', sessionId, token: senderToken },
      transports: ['websocket'],
    });

    const viewerSocket: ClientSocket = Client(`http://localhost:${port}`, {
      auth: { role: 'viewer', sessionId, token: viewerToken },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise<void>((resolve) => senderSocket.on('connect', resolve)),
      new Promise<void>((resolve) => viewerSocket.on('connect', resolve)),
    ]);

    // Send initial coordinate and wait for its broadcast
    const initialCoordsPromise = new Promise((resolve) => viewerSocket.once('session:location_broadcast', resolve));
    senderSocket.emit('sender:location_update', {
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 10,
    });
    await initialCoordsPromise;

    const statusChangePromise = new Promise<{ status: string }>((resolve) => {
      viewerSocket.on('session:status_changed', resolve);
    });

    // Sender hits Kill Switch
    senderSocket.emit('sender:terminate');

    // Viewer receives revoked event in real time!
    const statusData = await statusChangePromise;
    expect(statusData.status).toBe('revoked');

    // Verify DB location was purged immediately
    const dbSession = await Session.findOne({ sessionId });
    expect(dbSession?.status).toBe('revoked');
    expect(dbSession?.lastLocation).toBeNull();

    senderSocket.disconnect();
    viewerSocket.disconnect();
  });

  it('rejects socket connection for non-existent session ID', async () => {
    const socket: ClientSocket = Client(`http://localhost:${port}`, {
      auth: {
        role: 'viewer',
        sessionId: 'nonexistent_session_id',
      },
      transports: ['websocket'],
    });

    const errorPromise = new Promise<Error>((resolve) => {
      socket.on('connect_error', resolve);
    });

    const err = await errorPromise;
    expect(err.message).toContain('SESSION_NOT_FOUND');
    socket.disconnect();
  });

  it('rejects socket connection for revoked session', async () => {
    const session = await SessionService.createSession({ durationMinutes: 30 });
    const doc = await Session.findOne({ sessionId: session.sessionId });
    if (doc) await SessionService.revokeSession(doc);

    const socket: ClientSocket = Client(`http://localhost:${port}`, {
      auth: {
        role: 'viewer',
        sessionId: session.sessionId,
      },
      transports: ['websocket'],
    });

    const errorPromise = new Promise<Error>((resolve) => {
      socket.on('connect_error', resolve);
    });

    const err = await errorPromise;
    expect(err.message).toContain('SESSION_REVOKED');
    socket.disconnect();
  });

  it('rejects socket connection for expired session', async () => {
    const session = await SessionService.createSession({ durationMinutes: 30 });
    await Session.updateOne(
      { sessionId: session.sessionId },
      { expiresAt: new Date(Date.now() - 5000) }
    );

    const socket: ClientSocket = Client(`http://localhost:${port}`, {
      auth: {
        role: 'viewer',
        sessionId: session.sessionId,
      },
      transports: ['websocket'],
    });

    const errorPromise = new Promise<Error>((resolve) => {
      socket.on('connect_error', resolve);
    });

    const err = await errorPromise;
    expect(err.message).toContain('SESSION_EXPIRED');
    socket.disconnect();
  });

  it('rejects unauthorized viewer on passcode-protected session until verified', async () => {
    const session = await SessionService.createSession({
      durationMinutes: 30,
      passcode: '5678',
    });
    const { sessionId, viewerToken } = session;

    // 1. Viewer attempts connection with no token on protected session -> REJECTED
    const noTokenSocket: ClientSocket = Client(`http://localhost:${port}`, {
      auth: { role: 'viewer', sessionId },
      transports: ['websocket'],
    });

    const noTokenErrPromise = new Promise<Error>((resolve) => {
      noTokenSocket.on('connect_error', resolve);
    });

    const err1 = await noTokenErrPromise;
    expect(err1.message).toContain('UNAUTHORIZED_TOKEN');
    noTokenSocket.disconnect();

    // 2. Viewer attempts connection with forged token -> REJECTED
    const badTokenSocket: ClientSocket = Client(`http://localhost:${port}`, {
      auth: { role: 'viewer', sessionId, token: 'vt_forged_viewer_token' },
      transports: ['websocket'],
    });

    const badTokenErrPromise = new Promise<Error>((resolve) => {
      badTokenSocket.on('connect_error', resolve);
    });

    const err2 = await badTokenErrPromise;
    expect(err2.message).toContain('UNAUTHORIZED_TOKEN');
    badTokenSocket.disconnect();

    // 3. Viewer connects with genuine viewerToken -> ACCEPTED
    const validSocket: ClientSocket = Client(`http://localhost:${port}`, {
      auth: { role: 'viewer', sessionId, token: viewerToken },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => validSocket.on('connect', resolve));
    expect(validSocket.connected).toBe(true);
    validSocket.disconnect();
  });

  it('permits repeated credential use for multiple authorized concurrent viewers', async () => {
    const session = await SessionService.createSession({ durationMinutes: 30 });
    const { sessionId, senderToken, viewerToken } = session;

    const senderSocket: ClientSocket = Client(`http://localhost:${port}`, {
      auth: { role: 'sender', sessionId, token: senderToken },
      transports: ['websocket'],
    });

    // Two independent viewers using the same valid capability credential
    const viewer1: ClientSocket = Client(`http://localhost:${port}`, {
      auth: { role: 'viewer', sessionId, token: viewerToken },
      transports: ['websocket'],
    });

    const viewer2: ClientSocket = Client(`http://localhost:${port}`, {
      auth: { role: 'viewer', sessionId, token: viewerToken },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise<void>((resolve) => senderSocket.on('connect', resolve)),
      new Promise<void>((resolve) => viewer1.on('connect', resolve)),
      new Promise<void>((resolve) => viewer2.on('connect', resolve)),
    ]);

    expect(viewer1.connected).toBe(true);
    expect(viewer2.connected).toBe(true);

    const v1Promise = new Promise<{ latitude: number }>((resolve) =>
      viewer1.once('session:location_broadcast', resolve)
    );
    const v2Promise = new Promise<{ latitude: number }>((resolve) =>
      viewer2.once('session:location_broadcast', resolve)
    );

    senderSocket.emit('sender:location_update', {
      latitude: 48.8566,
      longitude: 2.3522,
      accuracy: 8,
    });

    const [v1Coords, v2Coords] = await Promise.all([v1Promise, v2Promise]);
    expect(v1Coords.latitude).toBe(48.8566);
    expect(v2Coords.latitude).toBe(48.8566);

    senderSocket.disconnect();
    viewer1.disconnect();
    viewer2.disconnect();
  });

  it('strictly denies repeated credential access after session revocation', async () => {
    const session = await SessionService.createSession({ durationMinutes: 30 });
    const { sessionId, viewerToken } = session;

    // First, sender revokes session
    const doc = await Session.findOne({ sessionId });
    if (doc) await SessionService.revokeSession(doc);

    // Attempting to reuse the previously-valid viewerToken must be rejected
    const reusedSocket: ClientSocket = Client(`http://localhost:${port}`, {
      auth: { role: 'viewer', sessionId, token: viewerToken },
      transports: ['websocket'],
    });

    const errPromise = new Promise<Error>((resolve) => {
      reusedSocket.on('connect_error', resolve);
    });

    const err = await errPromise;
    expect(err.message).toContain('SESSION_REVOKED');
    reusedSocket.disconnect();
  });

  it('rejects viewer socket connection without capability token (Session ID alone does not authorize WebSocket join)', async () => {
    const session = await SessionService.createSession({ durationMinutes: 30 });
    const { sessionId } = session;

    // Attacker possesses only the public sessionId and no capability token
    const unauthorizedViewer: ClientSocket = Client(`http://localhost:${port}`, {
      auth: { role: 'viewer', sessionId },
      transports: ['websocket'],
    });

    const errPromise = new Promise<Error>((resolve) => {
      unauthorizedViewer.on('connect_error', resolve);
    });

    const err = await errPromise;
    expect(err.message).toContain('UNAUTHORIZED_TOKEN');
    unauthorizedViewer.disconnect();
  });

  it('rejects location updates with malformed or out-of-bounds coordinates', async () => {
    const session = await SessionService.createSession({ durationMinutes: 30 });
    const { sessionId, senderToken } = session;

    const senderSocket: ClientSocket = Client(`http://localhost:${port}`, {
      auth: { role: 'sender', sessionId, token: senderToken },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => senderSocket.on('connect', resolve));

    const errorPromise = new Promise<{ code: string; message: string }>((resolve) => {
      senderSocket.on('session:error', resolve);
    });

    // Malformed coordinate: latitude 120.0 (exceeds 90.0 bound)
    senderSocket.emit('sender:location_update', {
      latitude: 120.0,
      longitude: -74.006,
      accuracy: 10,
    });

    const errPayload = await errorPromise;
    expect(errPayload.code).toBe('BAD_REQUEST_PAYLOAD');
    senderSocket.disconnect();
  });

  it('disconnects active sockets and purges location when session expires in real time', async () => {
    // Create session expiring in 600ms
    const session = await SessionService.createSession({ durationMinutes: 5 });
    const { sessionId, senderToken, viewerToken } = session;

    await Session.updateOne(
      { sessionId },
      { expiresAt: new Date(Date.now() + 600) }
    );

    const senderSocket: ClientSocket = Client(`http://localhost:${port}`, {
      auth: { role: 'sender', sessionId, token: senderToken },
      transports: ['websocket'],
    });

    const viewerSocket: ClientSocket = Client(`http://localhost:${port}`, {
      auth: { role: 'viewer', sessionId, token: viewerToken },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise<void>((resolve) => senderSocket.on('connect', resolve)),
      new Promise<void>((resolve) => viewerSocket.on('connect', resolve)),
    ]);

    const expiredPromise = new Promise<{ status: string }>((resolve) => {
      viewerSocket.on('session:status_changed', resolve);
    });

    // Wait for the server real-time expiration timer to fire
    const expiredData = await expiredPromise;
    expect(expiredData.status).toBe('expired');

    // Verify DB location was purged upon real-time expiration
    const dbSession = await Session.findOne({ sessionId });
    expect(dbSession?.status).toBe('expired');
    expect(dbSession?.lastLocation).toBeNull();

    senderSocket.disconnect();
    viewerSocket.disconnect();
  });
});
