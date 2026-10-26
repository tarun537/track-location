import { Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center p-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 mb-4">
        <Compass className="h-8 w-8 animate-spin-slow" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white">
        404 — Page Not Found
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
        The page or tracking link you are looking for does not exist or may have expired.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button className="gap-2 font-medium">
            <span>Return to Locato Home</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

