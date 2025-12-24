import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Player from './components/layout/Player';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import SongPage from './pages/SongPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import LibraryPage from './pages/LibraryPage';
import AIAssistantPage from './pages/AIAssistantPage';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/song/:id" element={<SongPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
        </Routes>
        
        <Player />
      </div>
    </Router>
  );
}
