import http from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from '../config/environment.js';
import { socketAuthMiddleware } from './middleware/socketAuth.middleware.js';
import { registerLocationHandlers } from './handlers/location.handler.js';
import { registerSessionHandlers } from './handlers/session.handler.js';
import { logger } from '../utils/logger.js';

export function setupSocketServer(httpServer: http.Server): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: [env.CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 1e4, // 10 KB max payload
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  // Attach handshake authentication middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const { role, sessionId } = socket.data;
    logger.info({ socketId: socket.id, role, sessionId }, 'Socket client authenticated and connected');

    // Register handlers
    registerSessionHandlers(io, socket);
    registerLocationHandlers(io, socket);

    socket.on('error', (err) => {
      logger.error({ socketId: socket.id, err }, 'Socket client error');
    });
  });

  return io;
}

