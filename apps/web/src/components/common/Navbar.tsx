import { Link, useLocation } from 'react-router-dom';
import { Navigation, ShieldCheck, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const location = useLocation();
  const isCreatePage = location.pathname === '/create';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200/80 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
            <Navigation className="h-5 w-5 -rotate-45" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-gray-950 dark:text-white">
              Locato
            </span>
            <span className="text-[10px] font-medium tracking-wide text-blue-600 dark:text-blue-400 uppercase -mt-1">
              Consent-Based Live Sharing
            </span>
          </div>
        </Link>

        {/* Navigation & CTAs */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 text-xs font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Zero-History Guarantee</span>
          </div>

          {!isCreatePage && (
            <Link to="/create">
              <Button size="sm" className="gap-2 font-medium shadow-sm">
                <PlusCircle className="h-4 w-4" />
                <span>Share Location</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

