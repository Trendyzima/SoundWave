import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { authService } from './lib/auth';
import { useAuthStore } from './stores/authStore';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import DesktopSidebar from './components/layout/DesktopSidebar';
import RightSidebar from './components/layout/RightSidebar';
import Player from './components/layout/Player';
import { registerServiceWorker, setupPWAInstall } from './lib/pwa';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import SongPage from './pages/SongPage';
import ProfilePage from './pages/ProfilePage';
import AIAssistantPage from './pages/AIAssistantPage';
import SearchPage from './pages/SearchPage';
import LibraryPage from './pages/LibraryPage';
import UploadPage from './pages/UploadPage';
import MessagesPage from './pages/MessagesPage';
import PodcastsPage from './pages/PodcastsPage';
import GoLivePage from './pages/GoLivePage';
import PodcastPlayerPage from './pages/PodcastPlayerPage';
import DJMixesPage from './pages/DJMixesPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import ChallengesPage from './pages/ChallengesPage';
import AdminDashboard from './pages/AdminDashboard';
import KaraokeStudioPage from './pages/KaraokeStudioPage';
import LocalMusicPage from './pages/LocalMusicPage';

export default function App() {
  const { login, logout, setLoading } = useAuthStore();
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Register PWA
    registerServiceWorker();
    setupPWAInstall();

    // Safety #1: Check existing session (page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session?.user) {
        login(authService.mapUser(session.user));
      }
      if (mounted) setLoading(false);
    });

    // Safety #2: Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        login(authService.mapUser(session.user));
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        logout();
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        login(authService.mapUser(session.user));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [login, logout, setLoading]);

  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar onToggleSidebar={() => setRightSidebarOpen(true)} />
        <DesktopSidebar />
        <RightSidebar isOpen={rightSidebarOpen} onClose={() => setRightSidebarOpen(false)} />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/song/:id" element={<SongPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/podcasts" element={<PodcastsPage />} />
          <Route path="/go-live" element={<GoLivePage />} />
          <Route path="/podcast/:id" element={<PodcastPlayerPage />} />
          <Route path="/dj-mixes" element={<DJMixesPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/event/:id" element={<EventDetailPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/karaoke" element={<KaraokeStudioPage />} />
          <Route path="/local-music" element={<LocalMusicPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
        <BottomNav />
        <Player />
      </div>
    </Router>
  );
}
