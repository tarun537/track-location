import { Shield, Eye, Clock, Slash, AlertCircle } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

export interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmConsent: () => void;
  durationMinutes: number;
}

export function ConsentModal({
  isOpen,
  onClose,
  onConfirmConsent,
  durationMinutes,
}: ConsentModalProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Location Sharing Consent"
      description="Please review our privacy rules before enabling your device location."
    >
      <div className="space-y-4 pt-2">
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <p>
              Your browser will prompt you for location permission next. We will <strong>never</strong> collect your location secretly or before your explicit permission.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              <Eye className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Only People with Your Link
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Only recipients with your unique link can view your live marker. Your link is cryptographically random.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {durationMinutes === 0
                  ? 'Continuous Sharing (Until Manually Stopped)'
                  : `Automatic Expiry (${
                      durationMinutes >= 60
                        ? `${(durationMinutes / 60).toFixed(durationMinutes % 60 === 0 ? 0 : 1)} hours`
                        : `${durationMinutes} minutes`
                    })`}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {durationMinutes === 0
                  ? 'Sharing remains live continuously until you press "Stop Sharing". When stopped, all data is purged immediately.'
                  : `Sharing terminates automatically after ${
                      durationMinutes >= 60
                        ? `${(durationMinutes / 60).toFixed(durationMinutes % 60 === 0 ? 0 : 1)} hours`
                        : `${durationMinutes} minutes`
                    }. All coordinate data is permanently deleted.`}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
              <Slash className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Instant Kill Switch
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You can press &quot;Stop Sharing&quot; at any moment to instantly revoke access and disconnect all active viewers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            className="sm:w-1/2"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="sm:w-1/2 bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold shadow-md shadow-blue-500/20"
            onClick={onConfirmConsent}
          >
            <Shield className="h-4 w-4" />
            <span>I Consent & Share</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

