import { Server, Socket } from 'socket.io';
import { LocationUpdateSchema } from '../../schemas/location.schema.js';
import { Session } from '../../models/session.model.js';
import { logger } from '../../utils/logger.js';

// Leaky-bucket rate limiter: max 2 updates per second per sender socket
const socketUpdateTimestamps = new Map<string, number[]>();

export function registerLocationHandlers(io: Server, socket: Socket) {
  const { role, sessionId } = socket.data;

  socket.on('sender:location_update', async (payload: unknown) => {
    // 1. Strict Role Authorization on every coordinate event
    if (role !== 'sender') {
      logger.warn({ socketId: socket.id, sessionId }, 'Viewer attempted to emit location_update. Disconnecting.');
      socket.emit('session:error', { code: 'FORBIDDEN_OPERATION', message: 'Viewers cannot broadcast coordinates' });
      socket.disconnect(true);
      return;
    }

    // 2. Leaky Bucket Rate Limiting (max 2 events / sec)
    const now = Date.now();
    const timestamps = socketUpdateTimestamps.get(socket.id) || [];
    const recent = timestamps.filter((t) => now - t < 1000);

    if (recent.length >= 2) {
      // Drop excessive updates and warn sender
      socket.emit('session:error', { code: 'RATE_LIMIT_EXCEEDED', message: 'Coordinate updates throttled (>2/sec)' });
      return;
    }

    recent.push(now);
    socketUpdateTimestamps.set(socket.id, recent);

    // 3. Schema Validation with Zod
    const validation = LocationUpdateSchema.safeParse(payload);
    if (!validation.success) {
      socket.emit('session:error', {
        code: 'BAD_REQUEST_PAYLOAD',
        message: 'Invalid coordinate payload structure',
        details: validation.error.format(),
      });
      return;
    }

    const coords = validation.data;

    try {
      // 4. Update session status and latest location in MongoDB (overwrites single slot)
      // Check session status first
      const session = await Session.findOne({ sessionId });
      if (!session || session.status === 'revoked' || session.isExpired()) {
        socket.emit('session:status_changed', { status: session?.status === 'revoked' ? 'revoked' : 'expired' });
        socket.disconnect(true);
        return;
      }

      if (session.status === 'paused') {
        return; // Paused sessions do not broadcast
      }

      const timestampDate = coords.timestamp ? new Date(coords.timestamp) : new Date();

      const locationSnapshot = {
        latitude: Math.round(coords.latitude * 1e6) / 1e6,
        longitude: Math.round(coords.longitude * 1e6) / 1e6,
        accuracy: Math.round(coords.accuracy * 10) / 10,
        heading: coords.heading != null ? coords.heading : null,
        speed: coords.speed != null ? coords.speed : null,
        altitude: coords.altitude != null ? coords.altitude : null,
        timestamp: timestampDate,
      };

      // Atomic update ensures an in-flight coordinate update cannot race with a revocation
      const updated = await Session.findOneAndUpdate(
        {
          sessionId,
          status: { $nin: ['revoked', 'expired'] },
          expiresAt: { $gt: new Date() },
        },
        {
          $set: {
            lastLocation: locationSnapshot,
            status: 'active',
            'stats.lastSeenAt': new Date(),
          },
          $inc: { 'stats.totalUpdates': 1 },
        },
        { new: true }
      );

      if (!updated) {
        socket.emit('session:status_changed', { status: 'revoked' });
        return;
      }

      // 5. Broadcast live coordinates to all viewers in the session room
      io.to(`session:${sessionId}`).emit('session:location_broadcast', {
        ...locationSnapshot,
        timestamp: timestampDate.toISOString(),
      });
    } catch (error) {
      logger.error({ error, sessionId }, 'Error saving and broadcasting coordinate');
    }
  });

  socket.on('disconnect', () => {
    socketUpdateTimestamps.delete(socket.id);
  });
}
