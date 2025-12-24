import { useEffect } from 'react';
import { supabase } from './lib/supabase';
import { authService } from './lib/auth';
import { useAuthStore } from './stores/authStore';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import DesktopSidebar from './components/layout/DesktopSidebar';
import Player from './components/layout/Player';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import SongPage from './pages/SongPage';
import ProfilePage from './pages/ProfilePage';
import AIAssistantPage from './pages/AIAssistantPage';
import SearchPage from './pages/SearchPage';
import LibraryPage from './pages/LibraryPage';
import UploadPage from './pages/UploadPage';

export default function App() {
  const { login, logout, setLoading } = useAuthStore();

  useEffect(() => {
    let mounted = true;

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
        <Navbar />
        <DesktopSidebar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/song/:id" element={<SongPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/upload" element={<UploadPage />} />
        </Routes>
        <BottomNav />
        <Player />
      </div>
    </Router>
  );
}
