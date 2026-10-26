import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ILocationSnapshot,
  GeolocationState,
  GeolocationPermissionState,
} from '@/types/location.types';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  minIntervalMs?: number;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 0,
    minIntervalMs = 2000,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    error: null,
    isTracking: false,
    permission: 'prompt',
  });

  const watchIdRef = useRef<number | null>(null);
  const lastEmitTimeRef = useRef<number>(0);

  // Check initial permission status if Permissions API is supported
  useEffect(() => {
    if (typeof window !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((permissionStatus) => {
          setState((prev) => ({
            ...prev,
            permission: permissionStatus.state as GeolocationPermissionState,
          }));

          permissionStatus.onchange = () => {
            setState((prev) => ({
              ...prev,
              permission: permissionStatus.state as GeolocationPermissionState,
            }));
          };
        })
        .catch(() => {
          // Permissions API unsupported or denied query
        });
    }
  }, []);

  const handleSuccess = useCallback(
    (position: GeolocationPosition) => {
      const now = Date.now();
      // Apply rate throttling
      if (now - lastEmitTimeRef.current < minIntervalMs && state.coordinates !== null) {
        return;
      }
      lastEmitTimeRef.current = now;

      const coords: ILocationSnapshot = {
        latitude: Math.round(position.coords.latitude * 1e6) / 1e6,
        longitude: Math.round(position.coords.longitude * 1e6) / 1e6,
        accuracy: Math.round(position.coords.accuracy * 10) / 10,
        heading: position.coords.heading,
        speed: position.coords.speed,
        altitude: position.coords.altitude,
        timestamp: position.timestamp || now,
      };

      setState({
        coordinates: coords,
        error: null,
        isTracking: true,
        permission: 'granted',
      });
    },
    [minIntervalMs, state.coordinates]
  );

  const handleError = useCallback((error: GeolocationPositionError) => {
    let permission: GeolocationPermissionState = 'prompt';
    if (error.code === error.PERMISSION_DENIED) {
      permission = 'denied';
    }

    setState((prev) => ({
      ...prev,
      error: { code: error.code, message: error.message },
      isTracking: false,
      permission,
    }));
  }, []);

  // START TRACKING: User must explicitly call this function
  const startTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState((prev) => ({
        ...prev,
        error: { code: 0, message: 'Geolocation is not supported by your browser.' },
        permission: 'unsupported',
      }));
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setState((prev) => ({ ...prev, isTracking: true, error: null }));

    const id = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });

    watchIdRef.current = id;
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  // STOP TRACKING: Clears hardware GPS watch
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState((prev) => ({ ...prev, isTracking: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
  };
}
