import mongoose from 'mongoose';
import { env } from './environment.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export async function connectDatabase(uri: string = env.MONGODB_URI): Promise<void> {
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }

  const options: mongoose.ConnectOptions = {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
    minPoolSize: 2,
    retryWrites: true,
  };

  try {
    mongoose.connection.on('connected', () => {
      isConnected = true;
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB connection lost');
    });

    await mongoose.connect(uri, options);
  } catch (error) {
    logger.error({ error }, 'Failed to connect to MongoDB');
    // In dev mode, don't crash process immediately if mongo is offline so dev server can still serve healthcheck
    if (env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected');
  }
}
