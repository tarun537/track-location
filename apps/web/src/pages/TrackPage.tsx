import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { LeafletMap } from '@/components/map/LeafletMap';
import { ViewerStatusCard } from '@/components/viewer/ViewerStatusCard';
import {
  WaitingForSenderState,
  SessionExpiredState,
  SessionRevokedState,
  InvalidSessionState,
  PasscodeDialog,
} from '@/components/viewer/StateCards';
import { apiClient } from '@/services/apiClient';
import { mockSessionService } from '@/services/mockSessionService';
import { createViewerSocket, LocatoSocket } from '@/services/socketClient';
import { SessionPublicMetadata } from '@/types/session.types';
import { ILocationSnapshot } from '@/types/location.types';

export function TrackPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  // Capability key parsed from URL hash fragment (#key=vt_...) lazily on mount
  const [viewerKey, setViewerKey] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const match = window.location.hash.match(/[#&]key=([^&]+)/);
      return match && match[1] ? match[1] : null;
    }
    return null;
  });

  // Session state
  const [session, setSession] = useState<SessionPublicMetadata | null>(null);
  const [currentLocation, setCurrentLocation] = useState<ILocationSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(sessionId));
  const [errorStatus, setErrorStatus] = useState<'404' | 'expired' | 'revoked' | null>(() =>
    sessionId ? null : '404'
  );

  // Passcode verification state
  const [isPasscodeRequired, setIsPasscodeRequired] = useState(false);
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState(false);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  // Real-time connection state
  const [connectionStatus, setConnectionStatus] = useState<'active' | 'disconnected_stale' | 'paused'>('active');
  const socketRef = useRef<LocatoSocket | null>(null);

  // STEP 1: Strip capability token from browser address bar
  // Prevents token lingering in browser history, bookmarks, or accidental shoulder-surfing
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const cleanUrl = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', cleanUrl);
    }
  }, []);

  // STEP 2: Fetch public session metadata
  // NOTE: We NEVER request recipient location!
  useEffect(() => {
    if (!sessionId) return;

    let isMounted = true;

    async function fetchSession() {
      try {
        let meta: SessionPublicMetadata;
        try {
          meta = await apiClient.getSessionMetadata(sessionId!, viewerKey);
        } catch {
          // If backend is offline during isolated UI development, use mock service
          meta = await mockSessionService.getSessionMetadata(sessionId!);
        }

        if (!isMounted) return;

        if (meta.status === 'expired') {
          setErrorStatus('expired');
        } else if (meta.status === 'revoked') {
          setErrorStatus('revoked');
        } else if (meta.requirePasscode && !meta.isUnlocked) {
          setIsPasscodeRequired(true);
        } else {
          setSession(meta);
          if (meta.lastLocation) {
            setCurrentLocation(meta.lastLocation);
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410) {
          setErrorStatus('expired');
        } else {
          setErrorStatus('404');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchSession();

    return () => {
      isMounted = false;
    };
  }, [sessionId, viewerKey]);

  // STEP 3: Setup Socket.IO connection for real-time live coordinate updates
  useEffect(() => {
    if (!sessionId || isPasscodeRequired || errorStatus || !session) return;

    // Connect to WebSocket gateway
    const socket = createViewerSocket(sessionId, viewerKey);
    socketRef.current = socket;

    socket.on('session:location_broadcast', (location: ILocationSnapshot) => {
      setCurrentLocation(location);
      setConnectionStatus('active');
    });

    socket.on('session:status_changed', ({ status }) => {
      if (status === 'revoked') {
        setErrorStatus('revoked');
      } else if (status === 'expired') {
        setErrorStatus('expired');
      } else if (status === 'paused') {
        setConnectionStatus('paused');
      } else if (status === 'active') {
        setConnectionStatus('active');
      }
    });

    socket.on('session:sender_disconnected', () => {
      setConnectionStatus('disconnected_stale');
    });

    socket.on('session:sender_reconnected', () => {
      setConnectionStatus('active');
    });

    socket.on('session:expired', () => {
      setErrorStatus('expired');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId, viewerKey, isPasscodeRequired, errorStatus, session]);

  // Passcode verification submission
  const handleVerifyPasscode = async (passcode: string) => {
    if (!sessionId) return;
    setIsVerifyingPasscode(true);
    setPasscodeError(null);

    try {
      const res = await apiClient.verifyPasscode(sessionId, passcode);
      if (res.verified) {
        setViewerKey(res.viewerToken);
        setIsPasscodeRequired(false);
        // Refresh session data
        const meta = await apiClient.getSessionMetadata(sessionId, res.viewerToken);
        setSession(meta);
        if (meta.lastLocation) setCurrentLocation(meta.lastLocation);
      }
    } catch (err: unknown) {
      setPasscodeError(
        err instanceof Error ? err.message : 'Invalid passcode. Please try again.'
      );
    } finally {
      setIsVerifyingPasscode(false);
    }
  };

  // State Condition: Loading
  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-xs font-medium text-gray-500">Loading live tracking map...</p>
        </div>
      </div>
    );
  }

  // State Condition: Invalid / 404
  if (errorStatus === '404' || !sessionId) {
    return <InvalidSessionState />;
  }

  // State Condition: Expired
  if (errorStatus === 'expired') {
    return <SessionExpiredState />;
  }

  // State Condition: Revoked by sender
  if (errorStatus === 'revoked') {
    return <SessionRevokedState />;
  }

  // State Condition: Passcode Locked
  if (isPasscodeRequired) {
    return (
      <PasscodeDialog
        onSubmitPasscode={handleVerifyPasscode}
        isVerifying={isVerifyingPasscode}
        error={passcodeError}
      />
    );
  }

  // State Condition: Waiting for sender's first fix
  if (!currentLocation && session?.status === 'created') {
    return <WaitingForSenderState title={session?.title} />;
  }

  // State Condition: Active Live Map View
  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* Floating Status & Metrics Card */}
      <ViewerStatusCard
        location={currentLocation}
        status={connectionStatus}
        expiresAt={session?.expiresAt || ''}
        title={session?.title}
      />

      {/* Full-bleed Interactive Map */}
      <LeafletMap location={currentLocation} className="h-full w-full" />
    </div>
  );
}

