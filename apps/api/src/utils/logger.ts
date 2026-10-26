import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-session-viewer-key"]',
      'req.body.senderToken',
      'req.body.viewerToken',
      'req.body.token',
      'req.body.passcode',
      'senderToken',
      'viewerToken',
      'passcode',
      'token',
      // Redact precise coordinates from logs
      'req.body.latitude',
      'req.body.longitude',
      'latitude',
      'longitude',
      'lastLocation.latitude',
      'lastLocation.longitude',
      'coords.latitude',
      'coords.longitude',
      'payload.latitude',
      'payload.longitude',
    ],
    censor: '[REDACTED_SENSITIVE]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
