import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Song } from '../types';
import SongFeedCard from '../components/features/SongFeedCard';
import { Loader2, Music } from 'lucide-react';
import { useAuth } from '../stores/authStore';
import { Navigate } from 'react-router-dom';

export default function HomePage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');
  
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
        .limit(50);
      
      if (error) throw error;
      
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
  
  return (
    <div className="min-h-screen pb-20 md:pb-4 pt-14">
      <div className="max-w-screen-xl mx-auto md:ml-64 lg:ml-72 md:mr-0">
        <div className="max-w-2xl">
          {/* Tabs */}
          <div className="sticky top-14 bg-background/80 backdrop-blur-xl border-b border-white/10 z-10">
            <div className="flex">
              <button
                onClick={() => setActiveTab('for-you')}
                className={`flex-1 px-4 py-4 font-semibold transition-colors relative hover:bg-white/5 ${
                  activeTab === 'for-you' ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                For you
                {activeTab === 'for-you' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('following')}
                className={`flex-1 px-4 py-4 font-semibold transition-colors relative hover:bg-white/5 ${
                  activeTab === 'following' ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Following
                {activeTab === 'following' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                )}
              </button>
            </div>
          </div>
          
          {/* Feed */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : songs.length === 0 ? (
            <div className="text-center py-20 px-4">
              <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-bold mb-2">No music yet</h2>
              <p className="text-muted-foreground">Be the first to upload and share your music!</p>
            </div>
          ) : (
            <div>
              {songs.map((song) => (
                <SongFeedCard key={song.id} song={song} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
