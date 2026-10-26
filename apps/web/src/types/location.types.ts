export interface ILocationSnapshot {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number | null;
  speed?: number | null;
  altitude?: number | null;
  timestamp: number | string;
}

export type GeolocationPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface GeolocationErrorState {
  code: number;
  message: string;
}

export interface GeolocationState {
  coordinates: ILocationSnapshot | null;
  error: GeolocationErrorState | null;
  isTracking: boolean;
  permission: GeolocationPermissionState;
}

