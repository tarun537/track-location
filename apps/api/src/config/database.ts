import net from 'node:net';
import mongoose from 'mongoose';
import { env } from './environment.js';
import { logger } from '../utils/logger.js';

let isConnected = false;
let memoryServerInstance: { getUri: () => string; stop: () => Promise<boolean> } | null = null;

async function isLocalPortReachable(host: string, port: number, timeoutMs = 300): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let hasResolved = false;

    const cleanup = () => {
      if (!hasResolved) {
        hasResolved = true;
        socket.destroy();
      }
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      cleanup();
      resolve(true);
    });
    socket.once('timeout', () => {
      cleanup();
      resolve(false);
    });
    socket.once('error', () => {
      cleanup();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

function parseHostAndPort(uri: string): { host: string; port: number; isLocal: boolean } {
  try {
    const sanitized = uri.replace(/^mongodb(\+srv)?:\/\//, 'http://');
    const parsed = new URL(sanitized);
    const host = parsed.hostname || '127.0.0.1';
    const port = parsed.port ? parseInt(parsed.port, 10) : 27017;
    const isLocal = host === '127.0.0.1' || host === 'localhost' || host === '::1';
    return { host, port, isLocal };
  } catch {
    return { host: '127.0.0.1', port: 27017, isLocal: true };
  }
}

function hasPlaceholderPassword(uri: string): boolean {
  return /<[^>]+>/.test(uri) || uri.includes('<db_password>') || uri.includes('<password>');
}

export async function connectDatabase(uri: string = env.MONGODB_URI): Promise<void> {
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }

  // In non-production, check for placeholder password strings or unreachable local daemon
  if (env.NODE_ENV !== 'production') {
    if (hasPlaceholderPassword(uri)) {
      logger.warn(
        'Detected placeholder in MONGODB_URI (e.g., <db_password>). ' +
        'Please replace it with your actual MongoDB Atlas password in apps/api/.env. ' +
        'Falling back to fast in-memory MongoDB for local development.'
      );
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServerInstance = await MongoMemoryServer.create();
        const memUri = memoryServerInstance.getUri();
        await mongoose.connect(memUri);
        isConnected = true;
        logger.info(`In-memory MongoDB connected successfully at ${memUri}`);
        return;
      } catch (memError) {
        logger.error({ memError }, 'Failed to initialize in-memory MongoDB fallback');
      }
    }

    const { host, port, isLocal } = parseHostAndPort(uri);
    if (isLocal) {
      const isReachable = await isLocalPortReachable(host, port);
      if (!isReachable) {
        try {
          logger.info('Local MongoDB daemon not detected. Starting in-memory MongoDB for local development...');
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          memoryServerInstance = await MongoMemoryServer.create();
          const memUri = memoryServerInstance.getUri();
          await mongoose.connect(memUri);
          isConnected = true;
          logger.info(`In-memory MongoDB connected successfully at ${memUri}`);
          return;
        } catch (memError) {
          logger.error({ memError }, 'Failed to initialize in-memory MongoDB fallback');
        }
      }
    }
  }

  const options: mongoose.ConnectOptions = {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
    minPoolSize: 2,
    retryWrites: true,
  };

  try {
    await mongoose.connect(uri, options);
    isConnected = true;
    logger.info('MongoDB connected successfully');

    // Attach listeners after initial connection succeeds
    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB connection lost');
    });
  } catch (error) {
    logger.warn({ error }, 'Could not connect to external MongoDB instance');
    if (env.NODE_ENV === 'production') {
      throw error;
    }

    try {
      logger.info('Starting local in-memory MongoDB fallback for development...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const memUri = memoryServerInstance.getUri();
      await mongoose.connect(memUri);
      isConnected = true;
      logger.info(`In-memory MongoDB connected successfully at ${memUri}`);
    } catch (memError) {
      logger.error({ memError }, 'Failed to initialize in-memory MongoDB fallback');
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected');
  }

  if (memoryServerInstance) {
    await memoryServerInstance.stop();
    memoryServerInstance = null;
    logger.info('In-memory MongoDB stopped');
  }
}

