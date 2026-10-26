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
});
