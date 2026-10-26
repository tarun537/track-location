import { AlertTriangle, Slash } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

export interface KillSwitchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmStop: () => void;
  isStopping?: boolean;
}

export function KillSwitchDialog({
  isOpen,
  onClose,
  onConfirmStop,
  isStopping,
}: KillSwitchDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Stop Location Sharing?"
      description="This will immediately revoke access and sever all active viewer connections."
    >
      <div className="space-y-4 pt-2">
        <div className="rounded-xl border border-red-100 bg-red-50/60 p-4 text-xs text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          <div className="flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <p>
              Once stopped, all recipients currently watching will see a &quot;Session Ended&quot; card. Your latest coordinates will be permanently deleted from the server immediately.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="sm:w-1/2"
            onClick={onClose}
            disabled={isStopping}
          >
            Keep Sharing
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="sm:w-1/2 gap-2 font-semibold"
            onClick={onConfirmStop}
            isLoading={isStopping}
          >
            <Slash className="h-4 w-4" />
            <span>Yes, Stop Sharing</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
