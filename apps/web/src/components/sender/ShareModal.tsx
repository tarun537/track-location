import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Share2, QrCode, AlertCircle } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  expiresAt: string;
}

export function ShareModal({ isOpen, onClose, shareUrl, expiresAt }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setCopyFailed(false);
        setTimeout(() => setCopied(false), 2500);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      // Fallback for non-secure contexts or permission denied: select text for manual copy
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 4000);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'My Live Location on Locato',
          text: 'Follow my live location in real time on Locato:',
          url: shareUrl,
        });
      } catch (err: unknown) {
        // Only fallback to copy if it wasn't an intentional user abort
        if ((err as Error)?.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Share Live Location"
      description="Send this link to anyone you trust. They will see your live movement on an interactive map."
    >
      <div className="space-y-4 pt-2">
        {/* Link Input & Copy */}
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/70 p-2 dark:border-gray-800 dark:bg-gray-800/60">
          <input
            ref={inputRef}
            type="text"
            readOnly
            value={shareUrl}
            className="w-full bg-transparent px-2 text-xs font-mono text-gray-700 dark:text-gray-300 focus:outline-none select-all truncate"
          />
          <Button
            size="sm"
            onClick={handleCopy}
            className={`shrink-0 gap-1.5 transition-all ${
              copied ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>

        {/* Copy Failure Graceful Warning */}
        {copyFailed && (
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Clipboard blocked. Link selected—press Ctrl+C / Cmd+C to copy.</span>
          </div>
        )}

        {/* Action Buttons: Native Share & Toggle QR */}
        <div className="flex gap-2">
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              variant="outline"
              className="flex-1 gap-2 border-gray-200 dark:border-gray-700"
              onClick={handleNativeShare}
            >
              <Share2 className="h-4 w-4 text-blue-600" />
              <span>Share via App</span>
            </Button>
          )}

          <Button
            variant="outline"
            className="flex-1 gap-2 border-gray-200 dark:border-gray-700"
            onClick={() => setShowQr(!showQr)}
          >
            <QrCode className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            <span>{showQr ? 'Hide QR' : 'Show QR Code'}</span>
          </Button>
        </div>

        {/* QR Code Container (Contains ONLY the authorized share URL, zero location info) */}
        {showQr && (
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700 animate-in fade-in">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <QRCodeSVG value={shareUrl} size={180} level="M" />
            </div>
            <p className="mt-2 text-[11px] text-gray-500 text-center">
              Scan with mobile camera to open tracking view
            </p>
          </div>
        )}

        <div className="rounded-lg bg-gray-50 dark:bg-gray-800/40 p-3 text-[11px] text-gray-500 dark:text-gray-400">
          Link expires automatically at{' '}
          <strong className="text-gray-800 dark:text-gray-200">
            {new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </strong>
          .
        </div>
      </div>
    </Dialog>
  );
}

