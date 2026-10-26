import { useState, useCallback, useEffect } from 'react';

export function useWakeLock() {
  const [isSupported] = useState<boolean>(
    () => typeof navigator !== 'undefined' && 'wakeLock' in navigator
  );
  const [isLocked, setIsLocked] = useState(false);
  const [sentinel, setSentinel] = useState<WakeLockSentinel | null>(null);

  const requestLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      const lock = await navigator.wakeLock.request('screen');
      setSentinel(lock);
      setIsLocked(true);

      lock.addEventListener('release', () => {
        setIsLocked(false);
        setSentinel(null);
      });
    } catch {
      setIsLocked(false);
    }
  }, []);

  const releaseLock = useCallback(async () => {
    if (sentinel) {
      await sentinel.release();
      setSentinel(null);
      setIsLocked(false);
    }
  }, [sentinel]);

  // Re-acquire lock if page visibility changes back to 'visible'
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isLocked) {
        await requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLocked, requestLock]);

  return {
    isSupported,
    isLocked,
    requestLock,
    releaseLock,
  };
}

