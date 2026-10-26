import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Slash, AlertCircle, KeyRound, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

/**
 * State: Waiting for sender to broadcast first coordinate fix
 */
export function WaitingForSenderState({ title }: { title?: string | null }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center p-6 border-dashed">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 mb-4 animate-pulse">
          <Clock className="h-7 w-7" />
        </div>
        <CardTitle className="text-xl">Waiting for Sender</CardTitle>
        <CardDescription className="mt-2 text-sm">
          {title ? `"${title}" is active.` : 'The location-sharing session has started.'}{' '}
          Waiting for the sender to acquire a satellite GPS signal and broadcast their first position.
        </CardDescription>
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-full">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
            <span>Listening for live updates...</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * State: Session expired after duration elapsed
 */
export function SessionExpiredState() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center p-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 mb-4">
          <Clock className="h-7 w-7" />
        </div>
        <CardTitle className="text-xl">Session Expired</CardTitle>
        <CardDescription className="mt-2 text-sm">
          This temporary location-sharing session has reached its scheduled expiration time. All location coordinates have been purged from the servers.
        </CardDescription>
        <div className="mt-6">
          <Link to="/">
            <Button variant="outline" className="w-full gap-2">
              <span>Return to Locato Home</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

/**
 * State: Sender manually revoked / stopped sharing
 */
export function SessionRevokedState() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center p-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 mb-4">
          <Slash className="h-7 w-7" />
        </div>
        <CardTitle className="text-xl">Location Sharing Stopped</CardTitle>
        <CardDescription className="mt-2 text-sm">
          The sender has explicitly stopped sharing their location. The tracking link has been invalidated and the live connection terminated.
        </CardDescription>
        <div className="mt-6">
          <Link to="/">
            <Button variant="outline" className="w-full gap-2">
              <span>Return to Locato Home</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

/**
 * State: Invalid session ID or 404
 */
export function InvalidSessionState() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center p-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 mb-4">
          <AlertCircle className="h-7 w-7" />
        </div>
        <CardTitle className="text-xl">Session Not Found</CardTitle>
        <CardDescription className="mt-2 text-sm">
          The link you opened is invalid, malformed, or has already been permanently deleted. Please request a fresh link from the sender.
        </CardDescription>
        <div className="mt-6">
          <Link to="/">
            <Button variant="outline" className="w-full gap-2">
              <span>Go to Home</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

/**
 * State: Passcode Verification Dialog
 */
export function PasscodeDialog({
  onSubmitPasscode,
  isVerifying,
  error,
}: {
  onSubmitPasscode: (passcode: string) => void;
  isVerifying: boolean;
  error?: string | null;
}) {
  const [passcode, setPasscode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim()) {
      onSubmitPasscode(passcode.trim());
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <CardHeader className="text-center p-0 mb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 mb-2">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Protected Session</CardTitle>
          <CardDescription className="text-xs mt-1">
            The sender set a numeric PIN to protect this location stream.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-0 space-y-3">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={8}
              placeholder="Enter 4-8 digit PIN"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              error={error || undefined}
              className="text-center tracking-widest text-lg font-mono"
              autoFocus
            />
          </CardContent>

          <CardFooter className="p-0 pt-4 flex gap-2">
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              isLoading={isVerifying}
              disabled={!passcode.trim()}
            >
              Unlock Location Map
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
