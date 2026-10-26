import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  EyeOff,
  Clock,
  ArrowRight,
  Share2,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-white py-16 sm:py-24 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          {/* Privacy Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 shadow-sm mb-6">
            <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>100% Consent-Based &bull; Zero Permanent History</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-gray-950 sm:text-6xl dark:text-white leading-[1.15]">
            Share your location. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Stay connected.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Create a temporary, private link to share your live GPS position with family, friends, or meetups. No app downloads, no account registrations, and never any secret tracking.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/create" className="w-full sm:w-auto">
              <Button size="lg" className="w-full gap-2 text-base font-semibold shadow-lg shadow-blue-500/25">
                <span>Create Location Link</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full border-gray-200 dark:border-gray-800">
                How It Works
              </Button>
            </a>
          </div>

          {/* Key Guarantee Badges */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-3xl mx-auto pt-6 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>No App Required</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>No Account Needed</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Instant Kill Switch</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Auto-Expiring URLs</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-gray-50/60 dark:bg-gray-900/40 border-y border-gray-200/60 dark:border-gray-800/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-950 dark:text-white">
              How Locato Works
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Three simple steps to safe, temporary real-time coordination.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Step 1 */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-4 right-4 text-3xl font-black text-gray-100 dark:text-gray-800">01</div>
              <CardHeader>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mb-3">
                  <Clock className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Set Duration & Consent</CardTitle>
                <CardDescription>
                  Choose how long you want to share (e.g. 30 minutes). Review our transparent privacy rules before granting browser location access.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Step 2 */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-4 right-4 text-3xl font-black text-gray-100 dark:text-gray-800">02</div>
              <CardHeader>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-3">
                  <Share2 className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Share Your Link</CardTitle>
                <CardDescription>
                  Send your private link via SMS, WhatsApp, or show a QR code. Your link contains an encrypted capability token that stays in memory.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Step 3 */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-4 right-4 text-3xl font-black text-gray-100 dark:text-gray-800">03</div>
              <CardHeader>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-3">
                  <Zap className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Live Map View</CardTitle>
                <CardDescription>
                  Your recipient opens the link and sees your smooth, live marker on an interactive map. Stop sharing at any moment with one tap.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Privacy Principles Section */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-950 dark:text-white">
              Built on Privacy, Not Surveillance
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Every design decision in Locato prioritizes your physical sovereignty.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4 p-5 rounded-2xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Explicit Consent Pre-Prompt
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  We never trigger the browser GPS prompt on page load. You explicitly review the session terms and duration before sharing starts.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                <EyeOff className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Recipients Are Strictly Observers
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  The recipient page never asks for or captures the viewer&apos;s location. Recipients cannot manipulate your device or send fake points.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Zero Permanent Location Logs
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Only your latest active coordinate is held in memory for live viewer syncing. When you stop sharing or the session expires, your location is wiped permanently.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  One-Tap Instant Kill Switch
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  You maintain absolute control. Tapping &quot;Stop Sharing&quot; invalidates your session URL and severs all connected viewer WebSockets in less than 500ms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-16 bg-gray-50/60 dark:bg-gray-900/40 border-t border-gray-200/60 dark:border-gray-800/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-950 dark:text-white flex items-center justify-center gap-2">
              <HelpCircle className="h-6 w-6 text-blue-600" />
              <span>Frequently Asked Questions</span>
            </h2>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-base">Does the recipient need to download an app?</CardTitle>
                <CardDescription className="pt-1">
                  No. Locato works in any standard mobile or desktop web browser (Safari, Chrome, Firefox, Edge). Recipients simply open the link.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-base">What happens when I lock my phone?</CardTitle>
                <CardDescription className="pt-1">
                  Mobile browsers (especially iOS Safari) heavily restrict JavaScript when screens are locked or tabs are backgrounded. Locato uses the Screen Wake Lock API to help keep your screen illuminated while actively sharing.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-base">Can a recipient see where I was 10 minutes ago?</CardTitle>
                <CardDescription className="pt-1">
                  No. Locato does not record or display historical breadcrumbs. Viewers see only your current live position and accuracy circle.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
