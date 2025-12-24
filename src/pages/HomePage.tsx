import { mockSongs, mockPlaylists } from '../constants/mockData';
import SongCard from '../components/features/SongCard';
import PlaylistCard from '../components/features/PlaylistCard';
import { Sparkles, TrendingUp, Clock } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Navigate } from 'react-router-dom';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  const recentlyPlayed = mockSongs.slice(0, 4);
  const aiRecommendations = mockSongs.slice(2, 6);
  const trending = mockSongs.slice(1, 5);
  
  return (
    <div className="min-h-screen pb-32 pt-20">
      {/* Hero Section */}
      <section className="relative mb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-dark opacity-60" />
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1600&h=600&fit=crop"
            alt="Music background"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        
        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold">AI-Powered Discovery</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Welcome back to
              <br />
              <span className="gradient-text">Your Sound</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl">
              Pick up where you left off or discover something new with AI-curated recommendations just for you.
            </p>
          </div>
        </div>
      </section>
      
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Continue Listening */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-primary" />
            <h2 className="text-2xl sm:text-3xl font-bold">Continue Listening</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentlyPlayed.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </section>
        
        {/* AI Recommendations */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-accent" />
            <h2 className="text-2xl sm:text-3xl font-bold">Made for You</h2>
            <span className="text-sm text-muted-foreground">by AI</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockPlaylists.filter(p => p.isAiGenerated).map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        </section>
        
        {/* Personalized Feed */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-2xl sm:text-3xl font-bold">Your Personalized Feed</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {aiRecommendations.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </section>
        
        {/* Trending */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-accent" />
            <h2 className="text-2xl sm:text-3xl font-bold">Trending Now</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {trending.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
