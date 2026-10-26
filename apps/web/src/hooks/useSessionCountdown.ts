import { useState, useEffect } from 'react';

interface CountdownResult {
  formattedTime: string;
  totalSecondsRemaining: number;
  isExpired: boolean;
  percentageRemaining: number;
}

export function useSessionCountdown(
  expiresAt?: string | Date | null,
  durationMinutes: number = 30,
  onExpire?: () => void
): CountdownResult {
  const isIndefinite =
    durationMinutes === 0 ||
    Boolean(expiresAt && new Date(expiresAt).getTime() - Date.now() > 30 * 24 * 3600 * 1000);

  const [remainingSec, setRemainingSec] = useState<number>(() => {
    if (isIndefinite) return Infinity;
    if (!expiresAt) return durationMinutes * 60;
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (!expiresAt || isIndefinite) return;

    const interval = setInterval(() => {
      const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      const remaining = Math.max(0, diff);
      setRemainingSec(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, isIndefinite, onExpire]);

  if (isIndefinite) {
    return {
      formattedTime: '∞ Until Stopped',
      totalSecondsRemaining: Infinity,
      isExpired: false,
      percentageRemaining: 100,
    };
  }

  const hours = Math.floor(remainingSec / 3600);
  const minutes = Math.floor((remainingSec % 3600) / 60);
  const seconds = remainingSec % 60;
  const formattedTime =
    hours > 0
      ? `${hours}h ${String(minutes).padStart(2, '0')}m`
      : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalAllocatedSec = Math.max(1, durationMinutes * 60);
  const percentageRemaining = Math.min(100, Math.max(0, (remainingSec / totalAllocatedSec) * 100));

  return {
    formattedTime,
    totalSecondsRemaining: remainingSec,
    isExpired: remainingSec <= 0,
    percentageRemaining,
  };
}

