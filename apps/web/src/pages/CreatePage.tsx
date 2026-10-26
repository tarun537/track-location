import { useState, useRef, useEffect } from 'react';
import {
  Clock,
  Shield,
  KeyRound,
  AlertCircle,
  Navigation,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LeafletMap } from '@/components/map/LeafletMap';
import { ConsentModal } from '@/components/sender/ConsentModal';
import { ShareModal } from '@/components/sender/ShareModal';
import { BroadcastingBar } from '@/components/sender/BroadcastingBar';
import { KillSwitchDialog } from '@/components/sender/KillSwitchDialog';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useSessionCountdown } from '@/hooks/useSessionCountdown';
import { apiClient } from '@/services/apiClient';
import { mockSessionService } from '@/services/mockSessionService';
import { createSenderSocket, LocatoSocket } from '@/services/socketClient';
import { SessionCreatedResult } from '@/types/session.types';

const DURATION_PRESETS = [
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
];

export function CreatePage() {
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [title, setTitle] = useState('');
  const [passcode, setPasscode] = useState('');
  const [requirePasscode, setRequirePasscode] = useState(false);

  // Dialog and Modal States
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isKillSwitchModalOpen, setIsKillSwitchModalOpen] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isStoppingSession, setIsStoppingSession] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);

  // Active Session & Real-time State
  const [activeSession, setActiveSession] = useState<SessionCreatedResult | null>(null);
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [isSharingEnded, setIsSharingEnded] = useState(false);
  const socketRef = useRef<LocatoSocket | null>(null);

  // Geolocation & Wake Lock Hooks
  // Note: startTracking is NEVER called on mount! It is only triggered after user confirms consent!
  const {
    coordinates,
    error: geoError,
    permission,
    startTracking,
    stopTracking,
  } = useGeolocation();

  const { isLocked: isWakeLockActive, requestLock, releaseLock } = useWakeLock();

  // Session Countdown
  const { formattedTime: timeRemaining, percentageRemaining, isExpired } = useSessionCountdown(
    activeSession?.expiresAt,
    activeSession?.durationMinutes || durationMinutes,
    () => {
      stopTracking();
      releaseLock();
      setIsSharingEnded(true);
    }
  );

  // STEP 1: Connect WebSocket when activeSession is initialized
  useEffect(() => {
    if (!activeSession) return;

    const socket = createSenderSocket(activeSession.sessionId, activeSession.senderToken);
    socketRef.current = socket;

    socket.on('session:viewer_count', (data) => {
      setViewerCount(data.viewerCount);
    });

    socket.on('session:status_changed', (data) => {
      if (data.status === 'revoked' || data.status === 'expired') {
        stopTracking();
        releaseLock();
        setIsSharingEnded(true);
        setActiveSession(null);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeSession, stopTracking, releaseLock]);

  // STEP 2: Stream live coordinates via WebSocket whenever device GPS acquires a new fix
  useEffect(() => {
    if (socketRef.current && coordinates) {
      socketRef.current.emit('sender:location_update', coordinates);
    }
  }, [coordinates]);

  // STEP 3: User clicks "Create & Share Location" -> Opens Consent Pre-Prompt
  const handleInitiateSharing = () => {
    setCreationError(null);
    setIsConsentModalOpen(true);
  };

  // STEP 4: User confirms consent -> Creates backend session & starts GPS
  const handleConfirmConsent = async () => {
    setIsConsentModalOpen(false);
    setIsCreatingSession(true);
    setCreationError(null);

    try {
      let sessionData: SessionCreatedResult;
      try {
        sessionData = await apiClient.createSession({
          durationMinutes,
          title: title.trim() || undefined,
          passcode: requirePasscode && passcode.trim() ? passcode.trim() : undefined,
        });
      } catch {
        sessionData = await mockSessionService.createSession({
          durationMinutes,
          title: title.trim() || undefined,
          passcode: requirePasscode && passcode.trim() ? passcode.trim() : undefined,
        });
      }

      setActiveSession(sessionData);

      // Now request device location via Geolocation API
      startTracking();

      // Request Screen Wake Lock to keep display active
      await requestLock();

      // Automatically display share link modal
      setIsShareModalOpen(true);
    } catch (err: unknown) {
      setCreationError(
        err instanceof Error ? err.message : 'Failed to initialize sharing session.'
      );
    } finally {
      setIsCreatingSession(false);
    }
  };

  // STEP 5: User triggers Instant Kill Switch
  const handleConfirmStopSharing = async () => {
    if (!activeSession) return;
    setIsStoppingSession(true);

    try {
      // 1. Notify backend via WebSocket immediately
      if (socketRef.current) {
        socketRef.current.emit('sender:terminate');
      }

      // 2. Also call REST API stop endpoint for certainty
      try {
        await apiClient.stopSession(activeSession.sessionId, activeSession.senderToken);
      } catch {
        await mockSessionService.stopSession(activeSession.sessionId);
      }
    } catch {
      // Continue teardown even if network failed
    } finally {
      stopTracking();
      releaseLock();
      setIsStoppingSession(false);
      setIsKillSwitchModalOpen(false);
      setIsSharingEnded(true);
      setActiveSession(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* View 1: Session Ended / Stopped */}
      {isSharingEnded && !activeSession && (
        <Card className="text-center p-8 border-dashed">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 mb-4">
            <Shield className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Sharing Ended</CardTitle>
          <CardDescription className="max-w-md mx-auto mt-2 text-sm">
            {isExpired
              ? 'Your sharing session completed its scheduled duration.'
              : 'You have stopped sharing your location. Your tracking link has been invalidated and live coordinate streaming terminated.'}
          </CardDescription>
          <div className="mt-6 flex justify-center gap-3">
            <Button
              onClick={() => {
                setIsSharingEnded(false);
                setActiveSession(null);
              }}
              className="gap-2 font-medium"
            >
              <span>Create New Session</span>
            </Button>
          </div>
        </Card>
      )}

      {/* View 2: Active Broadcasting Dashboard */}
      {activeSession && (
        <div className="space-y-6">
          {/* Top Control & Metrics Bar */}
          <BroadcastingBar
            viewerCount={viewerCount}
            accuracyMeters={coordinates?.accuracy}
            formattedTimeRemaining={timeRemaining}
            percentageRemaining={percentageRemaining}
            isWakeLockActive={isWakeLockActive}
            onToggleWakeLock={() => (isWakeLockActive ? releaseLock() : requestLock())}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onRequestStopSharing={() => setIsKillSwitchModalOpen(true)}
          />

          {/* Permission Denied Warning */}
          {permission === 'denied' && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Location Permission Denied in Browser</h4>
                <p className="mt-1 leading-relaxed">
                  {geoError?.message ||
                    'You blocked location access in your browser settings. To share your location, click the lock/settings icon in your browser address bar and change Location permission to "Allow".'}
                </p>
              </div>
            </div>
          )}

          {/* Live Map Preview Container */}
          <div className="h-[460px] w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200/80 dark:border-gray-800">
            <LeafletMap location={coordinates} />
          </div>

          <div className="text-center text-xs text-gray-400">
            Broadcasting live coordinates. Press <strong>Stop Sharing</strong> above to terminate at any time.
          </div>
        </div>
      )}

      {/* View 3: Session Creation Form (Initial State) */}
      {!activeSession && !isSharingEnded && (
        <Card className="shadow-md">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mb-3">
              <Navigation className="h-6 w-6 -rotate-45" />
            </div>
            <CardTitle className="text-2xl">Create Location Link</CardTitle>
            <CardDescription className="max-w-md mx-auto text-sm">
              Configure your session duration and optional PIN. Location permission will only be requested after your explicit confirmation.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-2">
            {creationError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
                {creationError}
              </div>
            )}

            {/* Duration Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                <span>Sharing Duration</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setDurationMinutes(preset.value)}
                    className={`h-11 rounded-xl text-xs font-semibold border transition-all ${
                      durationMinutes === preset.value
                        ? 'border-blue-600 bg-blue-50/80 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 ring-2 ring-blue-500/20'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Title */}
            <div className="space-y-1">
              <Input
                label="Session Label (Optional)"
                id="session-title"
                placeholder="e.g. Walking home from Metro, Cycling in Park"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
              />
              <p className="text-[11px] text-gray-400">
                Shown to recipients so they know what you are doing.
              </p>
            </div>

            {/* Optional PIN Protection */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Require Passcode PIN
                  </span>
                </div>
                <input
                  type="checkbox"
                  id="require-passcode"
                  checked={requirePasscode}
                  onChange={(e) => setRequirePasscode(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {requirePasscode && (
                <div className="pt-2 animate-in fade-in">
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="4 to 8 digit PIN"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="font-mono text-center tracking-widest text-base"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    Recipients must enter this PIN to unlock your live map.
                  </p>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button
              size="lg"
              onClick={handleInitiateSharing}
              isLoading={isCreatingSession}
              className="w-full text-base font-semibold shadow-lg shadow-blue-500/20"
            >
              <span>Review Privacy & Start Sharing</span>
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Modals & Dialogs */}
      <ConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        onConfirmConsent={handleConfirmConsent}
        durationMinutes={durationMinutes}
      />

      {activeSession && (
        <>
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            shareUrl={activeSession.shareUrl}
            expiresAt={activeSession.expiresAt}
          />

          <KillSwitchDialog
            isOpen={isKillSwitchModalOpen}
            onClose={() => setIsKillSwitchModalOpen(false)}
            onConfirmStop={handleConfirmStopSharing}
            isStopping={isStoppingSession}
          />
        </>
      )}
    </div>
  );
}
