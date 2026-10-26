import { Request, Response } from 'express';
import mongoose from 'mongoose';

export function getHealthCheck(_req: Request, res: Response): void {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      uptimeSeconds: Math.floor(process.uptime()),
      database: isDbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    },
  });
}
