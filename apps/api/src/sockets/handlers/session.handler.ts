import { Server, Socket } from 'socket.io';
import { Session } from '../../models/session.model.js';
import { SessionService } from '../../services/session.service.js';
import { logger } from '../../utils/logger.js';

// Tracks active disconnect grace timers for senders (sessionId -> Timeout)
const senderGraceTimers = new Map<string, NodeJS.Timeout>();

export function registerSessionHandlers(io: Server, socket: Socket) {
  const { role, sessionId, sessionDoc } = socket.data;
  const roomName = `session:${sessionId}`;

  // 1. Join isolated session room
  socket.join(roomName);

  // If sender reconnected, clear any pending disconnect grace timer and notify room
  if (role === 'sender') {
    const existingTimer = senderGraceTimers.get(sessionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      senderGraceTimers.delete(sessionId);
      io.to(roomName).emit('session:sender_reconnected');
      logger.info({ sessionId }, 'Sender reconnected within grace period');
    }
  }

  // If viewer joined, update viewer count
  if (role === 'viewer') {
    // Count sockets in room with role === 'viewer'
    io.in(roomName)
      .fetchSockets()
      .then((sockets) => {
        const viewerCount = sockets.filter((s) => s.data.role === 'viewer').length;
        io.to(roomName).emit('session:viewer_count', { viewerCount });
      })
      .catch(() => {});
  }

  // 2. Sender Pause Event
  socket.on('sender:pause', async () => {
    if (role !== 'sender') return;
    try {
      const session = await Session.findOne({ sessionId });
      if (session && !session.isExpired()) {
        await SessionService.pauseSession(session);
        io.to(roomName).emit('session:status_changed', { status: 'paused' });
      }
    } catch (error) {
      logger.error({ error, sessionId }, 'Error handling sender:pause');
    }
  });

  // 3. Sender Resume Event
  socket.on('sender:resume', async () => {
    if (role !== 'sender') return;
    try {
      const session = await Session.findOne({ sessionId });
      if (session && !session.isExpired()) {
        await SessionService.resumeSession(session);
        io.to(roomName).emit('session:status_changed', { status: 'active' });
      }
    } catch (error) {
      logger.error({ error, sessionId }, 'Error handling sender:resume');
    }
  });

  // 4. Sender Kill Switch (Terminate Session)
  socket.on('sender:terminate', async () => {
    if (role !== 'sender') return;
    try {
      const session = await Session.findOne({ sessionId });
      if (session) {
        await SessionService.revokeSession(session);
      }

      // Notify all room members that session has been revoked
      io.to(roomName).emit('session:status_changed', { status: 'revoked' });

      // Disconnect all sockets in room
      const roomSockets = await io.in(roomName).fetchSockets();
      for (const s of roomSockets) {
        s.disconnect(true);
      }

      logger.info({ sessionId }, 'Session terminated via sender:terminate kill switch');
    } catch (error) {
      logger.error({ error, sessionId }, 'Error executing sender:terminate');
    }
  });

  // 5. Handle Disconnect
  socket.on('disconnect', async () => {
    if (role === 'viewer') {
      // Re-calculate viewer count
      setTimeout(async () => {
        try {
          const sockets = await io.in(roomName).fetchSockets();
          const viewerCount = sockets.filter((s) => s.data.role === 'viewer').length;
          io.to(roomName).emit('session:viewer_count', { viewerCount });
        } catch {
          // Room might already be empty
        }
      }, 500);
    } else if (role === 'sender') {
      // Sender disconnected: start 60s Grace Timer
      io.to(roomName).emit('session:sender_disconnected', { gracePeriodSeconds: 60 });
      logger.warn({ sessionId }, 'Sender socket disconnected. 60s grace timer started.');

      const timer = setTimeout(async () => {
        senderGraceTimers.delete(sessionId);
        try {
          const session = await Session.findOne({ sessionId });
          if (session && session.status === 'active') {
            session.status = 'disconnected_stale';
            await session.save();
            io.to(roomName).emit('session:status_changed', {
              status: 'disconnected_stale',
              reason: 'Sender lost connection and did not reconnect within 60s',
            });
          }
        } catch (err) {
          logger.error({ err, sessionId }, 'Error processing disconnect grace expiration');
        }
      }, 60 * 1000);

      senderGraceTimers.set(sessionId, timer);
    }
  });
}
