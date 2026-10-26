import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { HomePage } from '@/pages/HomePage';
import { CreatePage } from '@/pages/CreatePage';
import { TrackPage } from '@/pages/TrackPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

function AppLayout() {
  const location = useLocation();
  const isTrackingView = location.pathname.startsWith('/v/') || location.pathname.startsWith('/track/');

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/v/:sessionId" element={<TrackPage />} />
          <Route path="/track/:sessionId" element={<TrackPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {!isTrackingView && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
