import { Radio, Users, Target, Clock, ShieldAlert, Share2, Sun } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export interface BroadcastingBarProps {
  viewerCount: number;
  accuracyMeters?: number | null;
  formattedTimeRemaining: string;
  isWakeLockActive?: boolean;
  onOpenShareModal: () => void;
  onRequestStopSharing: () => void;
}

export function BroadcastingBar({
  viewerCount,
  accuracyMeters,
  formattedTimeRemaining,
  isWakeLockActive,
  onOpenShareModal,
  onRequestStopSharing,
}: BroadcastingBarProps) {
  return (
    <div className="w-full rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-all">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Live Status and Metrics */}
        <div className="flex flex-wrap items-center gap-3">
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
              <Target className="h-3.5 w-3.5 text-emerald-600" />
              <span>±{Math.round(accuracyMeters)}m accuracy</span>
            </div>
          )}

          {/* Countdown Timer */}
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-mono font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <span>{formattedTimeRemaining} left</span>
          </div>

          {/* Wake Lock Indicator */}
          {isWakeLockActive && (
            <div className="hidden md:flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              <Sun className="h-3 w-3" />
              <span>Screen On</span>
            </div>
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
