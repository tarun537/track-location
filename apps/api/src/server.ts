import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/environment.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { setupSocketServer } from './sockets/socketServer.js';
import { logger } from './utils/logger.js';

export async function bootstrap() {
  // 1. Establish Database Connection
  logger.info('Connecting to database...');
  try {
    await connectDatabase();
    logger.info('Database connection established');
  } catch (err) {
    logger.error({ err }, 'Failed to initialize database connection');
    throw err;
  }

  // 2. Initialize Express Application & HTTP Server
  const app = createApp();
  const server = http.createServer(app);

  // 3. Mount Socket.IO Real-Time Gateway onto HTTP Server
  const io = setupSocketServer(server);

  const port = env.PORT;
  const host = env.HOST;

  // 4. Handle Server Level Errors (e.g., EADDRINUSE)
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${port} is already in use by another process. Please terminate it or change PORT in .env`);
    } else {
      logger.error({ err }, 'HTTP server error encountered');
    }
    process.exit(1);
  });

  // 5. Start Listening Asynchronously
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.removeListener('error', reject);
      logger.info(`Locato API & Real-Time Gateway listening on http://${host}:${port} in ${env.NODE_ENV} mode`);
      logger.info(`Allowed Client Origin: ${env.CLIENT_ORIGIN}`);
      logger.info(`Health check endpoint: http://${host}:${port}/api/health`);
      resolve();
    });
  });

  // 6. Graceful Shutdown Handling
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received: closing HTTP server and database connections`);

    // Safety timeout: force exit if graceful termination hangs
    const forceExitTimer = setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);
    forceExitTimer.unref();

    try {
      io.close();
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      logger.info('HTTP server closed');
      await disconnectDatabase();
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (shutdownErr) {
      logger.error({ err: shutdownErr }, 'Error during graceful shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return { app, server, io };
}

// Auto-start bootstrap when running as main entrypoint
const isTestEnv = Boolean(process.env.VITEST || process.env.NODE_ENV === 'test');

if (!isTestEnv) {
  bootstrap().catch((err) => {
    logger.error({ err }, 'Fatal error during server bootstrap');
    process.exit(1);
  });
}
