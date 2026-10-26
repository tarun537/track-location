import { Radio, Users, Target, Clock, ShieldAlert, Share2, Sun, Moon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export interface BroadcastingBarProps {
  viewerCount: number;
  accuracyMeters?: number | null;
  formattedTimeRemaining: string;
  percentageRemaining?: number;
  isWakeLockActive?: boolean;
  onToggleWakeLock?: () => void;
  onOpenShareModal: () => void;
  onRequestStopSharing: () => void;
}

export function BroadcastingBar({
  viewerCount,
  accuracyMeters,
  formattedTimeRemaining,
  percentageRemaining = 100,
  isWakeLockActive,
  onToggleWakeLock,
  onOpenShareModal,
  onRequestStopSharing,
}: BroadcastingBarProps) {
  // Dynamic color shift for countdown timer: Green -> Amber -> Red
  const getTimerStyles = () => {
    if (formattedTimeRemaining.includes('∞') || formattedTimeRemaining.includes('Stopped')) {
      return {
        badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900',
        icon: 'text-blue-600',
      };
    }
    if (percentageRemaining <= 10) {
      return {
        badge: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900 animate-pulse',
        icon: 'text-red-600',
      };
    }
    if (percentageRemaining <= 30) {
      return {
        badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900',
        icon: 'text-amber-600',
      };
    }
    return {
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900',
      icon: 'text-emerald-600',
    };
  };

  const timerStyles = getTimerStyles();

  return (
    <div className="w-full rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-all">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Live Status and Metrics */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pulsing Live Badge */}
          <Badge className="bg-red-600 text-white gap-1.5 px-3 py-1 shadow-sm shadow-red-500/20 font-semibold tracking-wider text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>LIVE</span>
          </Badge>

          {/* Viewers Badge */}
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <Users className="h-3.5 w-3.5 text-blue-600" />
            <span>{viewerCount} {viewerCount === 1 ? 'Viewer' : 'Viewers'}</span>
          </div>

          {/* GPS Accuracy Badge */}
          {accuracyMeters != null && (
            <div className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <Target className="h-3.5 w-3.5 text-blue-600" />
              <span>±{Math.round(accuracyMeters)}m</span>
            </div>
          )}

          {/* Countdown Timer with Visual Color Shift */}
          <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-mono font-medium transition-colors ${timerStyles.badge}`}>
            <Clock className={`h-3.5 w-3.5 ${timerStyles.icon}`} />
            <span>{formattedTimeRemaining}</span>
          </div>

          {/* Wake Lock Interactive Toggle */}
          {onToggleWakeLock && (
            <button
              onClick={onToggleWakeLock}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                isWakeLockActive
                  ? 'bg-amber-100/80 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
              }`}
              title={isWakeLockActive ? 'Screen kept awake (Click to disable)' : 'Screen may sleep (Click to keep awake)'}
            >
              {isWakeLockActive ? <Sun className="h-3.5 w-3.5 text-amber-600 animate-spin" /> : <Moon className="h-3.5 w-3.5" />}
              <span>{isWakeLockActive ? 'Awake' : 'Dim OK'}</span>
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pt-2 sm:pt-0">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 sm:flex-initial gap-1.5 border-gray-200 dark:border-gray-700 text-xs font-medium"
            onClick={onOpenShareModal}
          >
            <Share2 className="h-3.5 w-3.5 text-blue-600" />
            <span>Share Link</span>
          </Button>

          <Button
            size="sm"
            variant="destructive"
            className="flex-1 sm:flex-initial gap-1.5 text-xs font-semibold shadow-sm"
            onClick={onRequestStopSharing}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Stop Sharing</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

