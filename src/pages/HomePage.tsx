import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Song } from '../types';
import SongCard from '../components/features/SongCard';
import PlaylistCard from '../components/features/PlaylistCard';
import { Sparkles, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '../stores/authStore';
import { Navigate } from 'react-router-dom';

export default function HomePage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchSongs();
    }
  }, [isAuthenticated, authLoading]);
  
  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      // Map database songs to app Song type
      const mappedSongs: Song[] = (data || []).map((song) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album || '',
        coverUrl: song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
        duration: song.duration,
        audioUrl: song.audio_url,
        plays: song.plays,
        likes: song.likes,
        releaseDate: song.release_date || '',
        genre: song.genre || '',
      }));
      
      setSongs(mappedSongs);
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  const recentlyPlayed = songs.slice(0, 4);
  const aiRecommendations = songs.slice(2, 6);
  const trending = songs.slice(1, 5);
  
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
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-20">
            <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">No music yet</h2>
            <p className="text-muted-foreground mb-6">Be the first to upload and share your music!</p>
            <a
              href="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary rounded-lg font-semibold hover:scale-105 transition-transform"
            >
              <Upload className="w-5 h-5" />
              Upload Your First Song
            </a>
          </div>
        ) : (
          <>
            {/* Continue Listening */}
            {recentlyPlayed.length > 0 && (
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
            )}
            
            {/* Personalized Feed */}
            {aiRecommendations.length > 0 && (
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
            )}
            
            {/* Trending */}
            {trending.length > 0 && (
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
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Missing imports
import { Music, Upload } from 'lucide-react';
