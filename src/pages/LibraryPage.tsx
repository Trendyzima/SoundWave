import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Song } from '../types';
import SongCard from '../components/features/SongCard';
import { Heart, ListMusic, Clock, Loader2, Music, Upload } from 'lucide-react';
import { useAuth } from '../stores/authStore';
import { Navigate } from 'react-router-dom';

export default function LibraryPage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [mySongs, setMySongs] = useState<Song[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      fetchLibraryData();
    }
  }, [isAuthenticated, user, authLoading]);
  
  const fetchLibraryData = async () => {
    if (!user) return;
    
    try {
      // Fetch liked songs
      const { data: likesData } = await supabase
        .from('likes')
        .select('song_id, songs(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8);
      
      const liked = (likesData || []).map((like: any) => ({
        id: like.songs.id,
        title: like.songs.title,
        artist: like.songs.artist,
        album: like.songs.album || '',
        coverUrl: like.songs.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
        duration: like.songs.duration,
        audioUrl: like.songs.audio_url,
        plays: like.songs.plays,
        likes: like.songs.likes,
        releaseDate: like.songs.release_date || '',
        genre: like.songs.genre || '',
      }));
      setLikedSongs(liked);
      
      // Fetch my uploaded songs
      const { data: myData } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8);
      
      const my = (myData || []).map((song) => ({
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
      setMySongs(my);
      
      // Fetch recently played
      const { data: historyData } = await supabase
        .from('listening_history')
        .select('song_id, songs(*)')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(8);
      
      // Remove duplicates
      const uniqueSongs = new Map();
      (historyData || []).forEach((item: any) => {
        if (!uniqueSongs.has(item.song_id)) {
          uniqueSongs.set(item.song_id, {
            id: item.songs.id,
            title: item.songs.title,
            artist: item.songs.artist,
            album: item.songs.album || '',
            coverUrl: item.songs.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
            duration: item.songs.duration,
            audioUrl: item.songs.audio_url,
            plays: item.songs.plays,
            likes: item.songs.likes,
            releaseDate: item.songs.release_date || '',
            genre: item.songs.genre || '',
          });
        }
      });
      setRecentlyPlayed(Array.from(uniqueSongs.values()));
      
    } catch (error) {
      console.error('Error fetching library data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  return (
    <div className="min-h-screen pb-32 pt-20">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Your Library</h1>
          <p className="text-muted-foreground">Access all your music in one place</p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-12">
            {/* My Uploads */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Music className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">My Uploads</h2>
                  <span className="text-muted-foreground">({mySongs.length})</span>
                </div>
                <a
                  href="/upload"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-primary rounded-lg font-semibold hover:scale-105 transition-transform text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Upload New
                </a>
              </div>
              
              {mySongs.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {mySongs.map((song) => (
                    <SongCard key={song.id} song={song} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 glass-card rounded-xl">
                  <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">You haven't uploaded any songs yet</p>
                </div>
              )}
            </section>
            
            {/* Liked Songs */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Heart className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Liked Songs</h2>
                <span className="text-muted-foreground">({likedSongs.length})</span>
              </div>
              
              {likedSongs.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {likedSongs.map((song) => (
                    <SongCard key={song.id} song={song} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 glass-card rounded-xl">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">You haven't liked any songs yet</p>
                </div>
              )}
            </section>
            
            {/* Recently Played */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-6 h-6 text-muted-foreground" />
                <h2 className="text-2xl font-bold">Recently Played</h2>
              </div>
              
              {recentlyPlayed.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {recentlyPlayed.map((song) => (
                    <SongCard key={song.id} song={song} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 glass-card rounded-xl">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No listening history yet</p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
