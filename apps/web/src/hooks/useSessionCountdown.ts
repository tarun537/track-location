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
  const [remainingSec, setRemainingSec] = useState<number>(() => {
    if (!expiresAt) return durationMinutes * 60;
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (!expiresAt) return;

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
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalAllocatedSec = Math.max(1, durationMinutes * 60);
  const percentageRemaining = Math.min(100, Math.max(0, (remainingSec / totalAllocatedSec) * 100));

  return {
    formattedTime,
    totalSecondsRemaining: remainingSec,
    isExpired: remainingSec <= 0,
    percentageRemaining,
  };
}

