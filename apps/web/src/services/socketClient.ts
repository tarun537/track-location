import { io, Socket } from 'socket.io-client';
import { ILocationSnapshot } from '@/types/location.types';
import { SessionStatus } from '@/types/session.types';

function getSocketUrl(): string {
  if (import.meta.env.VITE_SOCKET_URL && !import.meta.env.VITE_SOCKET_URL.includes('localhost')) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (
    typeof window !== 'undefined' &&
    window.location.hostname &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return `http://${window.location.hostname}:5000`;
  }
  return (
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL?.replace(/\/api(\/v1)?$/, '') ||
    'http://localhost:5000'
  );
}

const SOCKET_URL = getSocketUrl();

export interface ServerToClientEvents {
  'session:location_broadcast': (location: ILocationSnapshot) => void;
  'session:status_changed': (data: { status: SessionStatus; reason?: string }) => void;
  'session:viewer_count': (data: { viewerCount: number }) => void;
  'session:sender_disconnected': (data: { gracePeriodSeconds: number }) => void;
  'session:sender_reconnected': () => void;
  'session:expired': (data: { expiredAt: string }) => void;
  'session:error': (data: { code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  'sender:location_update': (coords: ILocationSnapshot) => void;
  'sender:battery_status': (data: { batteryLevel: number; isCharging: boolean }) => void;
  'sender:pause': () => void;
  'sender:resume': () => void;
  'sender:terminate': () => void;
  'viewer:ping': (data: { timestamp: number }) => void;
}

export type LocatoSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSenderSocket(sessionId: string, senderToken: string): LocatoSocket {
  return io(SOCKET_URL, {
    auth: {
      role: 'sender',
      sessionId,
      token: senderToken,
    },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
  });
}

export function createViewerSocket(sessionId: string, viewerToken?: string | null): LocatoSocket {
  return io(SOCKET_URL, {
    auth: {
      role: 'viewer',
      sessionId,
      token: viewerToken,
    },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
  });
}

