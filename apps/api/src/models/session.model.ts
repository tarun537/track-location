import mongoose, { Schema, Document, Model } from 'mongoose';

export type SessionStatus =
  | 'created'
  | 'active'
  | 'disconnected_stale'
  | 'paused'
  | 'revoked'
  | 'expired';

export interface ILocationSnapshot {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number | null;
  speed?: number | null;
  altitude?: number | null;
  timestamp: Date;
}

export interface ISessionDocument extends Document {
  sessionId: string;
  senderTokenHash: string;
  viewerTokenHash?: string | null;
  status: SessionStatus;
  title?: string | null;
  durationMinutes: number;
  expiresAt: Date;
  lastLocation?: ILocationSnapshot | null;
  stats: {
    viewerCount: number;
    totalUpdates: number;
    lastSeenAt?: Date | null;
  };
  settings: {
    requirePasscode: boolean;
    passcodeHash?: string | null;
    senderBatteryLow: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  isExpired(): boolean;
  isActive(): boolean;
}

const LocationSnapshotSchema = new Schema<ILocationSnapshot>(
  {
    latitude: {
      type: Number,
      required: true,
      min: -90.0,
      max: 90.0,
      set: (v: number) => Math.round(v * 1e6) / 1e6, // Truncate to 6 decimal places (~0.11m precision)
    },
    longitude: {
      type: Number,
      required: true,
      min: -180.0,
      max: 180.0,
      set: (v: number) => Math.round(v * 1e6) / 1e6,
    },
    accuracy: {
      type: Number,
      required: true,
      min: 0,
    },
    heading: {
      type: Number,
      default: null,
      min: 0,
      max: 360,
    },
    speed: {
      type: Number,
      default: null,
      min: 0,
    },
    altitude: {
      type: Number,
      default: null,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false }
);

const SessionSchema = new Schema<ISessionDocument>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    senderTokenHash: {
      type: String,
      required: true,
      index: true,
    },
    viewerTokenHash: {
      type: String,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['created', 'active', 'disconnected_stale', 'paused', 'revoked', 'expired'],
      default: 'created',
      required: true,
    },
    title: {
      type: String,
      default: null,
      maxlength: 60,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 5,
      max: 480,
      default: 30,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Native MongoDB TTL index
    },
    lastLocation: {
      type: LocationSnapshotSchema,
      default: null,
    },
    stats: {
      viewerCount: { type: Number, default: 0, min: 0 },
      totalUpdates: { type: Number, default: 0, min: 0 },
      lastSeenAt: { type: Date, default: null },
    },
    settings: {
      requirePasscode: { type: Boolean, default: false },
      passcodeHash: { type: String, default: null },
      senderBatteryLow: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for fast active session status queries
SessionSchema.index({ sessionId: 1, status: 1, expiresAt: 1 });

// Instance methods
SessionSchema.methods.isExpired = function (): boolean {
  return new Date() >= this.expiresAt || this.status === 'expired' || this.status === 'revoked';
};

SessionSchema.methods.isActive = function (): boolean {
  return (this.status === 'active' || this.status === 'created') && !this.isExpired();
};

export const Session: Model<ISessionDocument> =
  mongoose.models.Session || mongoose.model<ISessionDocument>('Session', SessionSchema);
