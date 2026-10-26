import { useState, useEffect } from 'react';
import { Activity, Gauge, Compass, Clock, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { ILocationSnapshot } from '@/types/location.types';
import { formatRelativeTime, headingToCardinal, formatSpeedKmH } from '@/lib/geoMath';

export interface ViewerStatusCardProps {
  location?: ILocationSnapshot | null;
  status: 'active' | 'disconnected_stale' | 'paused';
  expiresAt: string;
  title?: string | null;
}

export function ViewerStatusCard({
  location,
  status,
  expiresAt,
  title,
}: ViewerStatusCardProps) {
  const isStale = status === 'disconnected_stale';
  const isPaused = status === 'paused';

  // Check if latest location coordinate timestamp is older than 30 seconds
  const [isOlderThan30s, setIsOlderThan30s] = useState(false);

  useEffect(() => {
    if (!location?.timestamp) {
      setIsOlderThan30s(false);
      return;
    }

    const checkStaleness = () => {
      const updateTime = new Date(location.timestamp).getTime();
      const elapsed = Date.now() - updateTime;
      setIsOlderThan30s(elapsed > 30000);
    };

    checkStaleness();
    const interval = setInterval(checkStaleness, 5000);
    return () => clearInterval(interval);
  }, [location?.timestamp]);

  return (
    <div className="absolute top-4 left-4 right-4 sm:left-6 sm:w-80 sm:right-auto z-[1000] rounded-2xl border border-gray-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95 transition-all">
      {/* Session Title & Connection Status */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            {status === 'active' ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            )}
          </span>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[180px]">
            {title || 'Live Sharing Session'}
          </h2>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-1 text-[11px] font-medium">
          {status === 'active' && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Wifi className="h-3 w-3" />
              <span>Live</span>
            </span>
          )}
          {isStale && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 animate-pulse">
              <WifiOff className="h-3 w-3" />
              <span>Reconnecting</span>
            </span>
          )}
          {isPaused && (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Activity className="h-3 w-3" />
              <span>Paused</span>
            </span>
          )}
        </div>
      </div>

      {/* Movement Metrics Grid */}
      {location ? (
        <div className="grid grid-cols-3 gap-2 pt-3 text-center">
          {/* Speed */}
          <div className="rounded-xl bg-gray-50/80 p-2 dark:bg-gray-800/60">
            <div className="flex items-center justify-center text-gray-400 dark:text-gray-500 mb-1">
              <Gauge className="h-3.5 w-3.5" />
            </div>
            <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
              {formatSpeedKmH(location.speed)}
            </div>
            <div className="text-[10px] text-gray-400">Speed</div>
          </div>

          {/* Heading */}
          <div className="rounded-xl bg-gray-50/80 p-2 dark:bg-gray-800/60">
            <div className="flex items-center justify-center text-gray-400 dark:text-gray-500 mb-1">
              <Compass className="h-3.5 w-3.5" />
            </div>
            <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
              {headingToCardinal(location.heading)}
            </div>
            <div className="text-[10px] text-gray-400">Heading</div>
          </div>

          {/* Accuracy */}
          <div className="rounded-xl bg-gray-50/80 p-2 dark:bg-gray-800/60">
            <div className="flex items-center justify-center text-gray-400 dark:text-gray-500 mb-1">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
              ±{Math.round(location.accuracy)}m
            </div>
            <div className="text-[10px] text-gray-400">Accuracy</div>
          </div>
        </div>
      ) : (
        <div className="py-4 text-center text-xs text-gray-500">
          Waiting for sender GPS coordinate...
        </div>
      )}

      {/* Stale Location Warning (>30 seconds) */}
      {isOlderThan30s && status === 'active' && (
        <div className="mt-2.5 flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Location not updated in &gt;30s (weak GPS or device asleep)</span>
        </div>
      )}

      {/* Last Update & Expiry Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 text-[11px] text-gray-400 dark:border-gray-800">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Updated {location ? formatRelativeTime(location.timestamp) : 'never'}</span>
        </div>
        <div>
          Expires {new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

