import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/environment.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { setupSocketServer } from './sockets/socketServer.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  // Connect to Database
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  // Initialize Socket.IO Real-Time Gateway
  const io = setupSocketServer(server);

  const port = env.PORT;

  server.listen(port, '0.0.0.0', () => {
    logger.info(`Locato API & Real-Time Gateway listening on port ${port} in ${env.NODE_ENV} mode`);
    logger.info(`Allowed Client Origin: ${env.CLIENT_ORIGIN}`);
  });

  // Graceful Shutdown Handling
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received: closing HTTP server and database connections`);
    io.close();
    server.close(async () => {
      logger.info('HTTP server closed');
      await disconnectDatabase();
      process.exit(0);
    });

    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Fatal error during server bootstrap');
  process.exit(1);
});
