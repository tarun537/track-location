import { Shield, Lock, MapPin, EyeOff } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-12 dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-gray-950 dark:text-white">Locato</span>
            </div>
            <p className="max-w-md text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Consent-first, temporary live location sharing through secure URLs. No account required, no recipient tracking, and zero permanent location history.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
              Privacy Commitments
            </h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                <span>Explicit user consent only</span>
              </li>
              <li className="flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-emerald-600" />
                <span>Never tracks recipients</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-600" />
                <span>Instant kill switch</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
              Attribution & Open Source
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline hover:text-blue-600">OpenStreetMap</a> contributors.
              Interactive maps rendered with <a href="https://leafletjs.com" target="_blank" rel="noreferrer" className="underline hover:text-blue-600">Leaflet</a>.
            </p>
            <div className="pt-2 text-xs text-gray-400">
              © {CURRENT_YEAR} Locato. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
