import { useState, useEffect } from 'react';
import { Sparkles, Play, Pause, TrendingUp, History, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../stores/authStore';
import { Song, Playlist } from '../types';
import { usePlayerStore } from '../stores/playerStore';
import { Navigate } from 'react-router-dom';

export default function ForYouPage() {
  const { user, isAuthenticated } = useAuth();
  const { play, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const [loading, setLoading] = useState(true);
  const [dailyMixes, setDailyMixes] = useState<Playlist[]>([]);
  const [recommended, setRecommended] = useState<Song[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [trending, setTrending] = useState<Song[]>([]);
  
  useEffect(() => {
    if (user) {
      loadPersonalizedContent();
    }
  }, [user]);
  
  const loadPersonalizedContent = async () => {
    try {
      // Get user's listening history
      const { data: history } = await supabase
        .from('listening_history')
        .select('song_id, songs(*)')
        .eq('user_id', user?.id)
        .order('played_at', { ascending: false })
        .limit(20);
      
      // Get user's liked songs
      const { data: likes } = await supabase
        .from('likes')
        .select('song_id, songs(*)')
        .eq('user_id', user?.id)
        .limit(20);
      
      // Get trending songs
      const { data: trendingSongs } = await supabase
        .from('songs')
        .select('*')
        .order('plays', { ascending: false })
        .limit(20);
      
      // Get recommended songs based on listening history
      const { data: allSongs } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (history) {
        const recent = history.slice(0, 10).map((item: any) => ({
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
          description: item.songs.description || '',
        }));
        setRecentlyPlayed(recent);
      }
      
      if (trendingSongs) {
        const songs = trendingSongs.map((song: any) => ({
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
          description: song.description || '',
        }));
        setTrending(songs);
      }
      
      if (allSongs) {
        const songs = allSongs.map((song: any) => ({
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
          description: song.description || '',
        }));
        
        // Simple recommendation: shuffle and take first 20
        const shuffled = songs.sort(() => 0.5 - Math.random()).slice(0, 20);
        setRecommended(shuffled);
        
        // Create Daily Mixes
        const genres = [...new Set(songs.map(s => s.genre).filter(Boolean))];
        const mixes = genres.slice(0, 6).map((genre, index) => ({
          id: `daily-mix-${index + 1}`,
          name: `Daily Mix ${index + 1}`,
          description: `${genre} and more`,
          coverUrl: `https://images.unsplash.com/photo-${1470225620780 + index}?w=400&h=400&fit=crop`,
          songs: songs.filter(s => s.genre === genre).slice(0, 50),
          createdBy: user?.id || '',
          isAiGenerated: true,
        }));
        setDailyMixes(mixes);
      }
    } catch (error) {
      console.error('Error loading personalized content:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePlaySong = (song: Song, queue: Song[]) => {
    const isCurrentSong = currentSong?.id === song.id;
    if (isCurrentSong) {
      togglePlay();
    } else {
      play(song, queue);
    }
  };
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  return (
    <div className="min-h-screen pb-32 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 flex items-center gap-3">
            <Sparkles className="w-10 h-10" />
            Made For You
          </h1>
          <p className="text-muted-foreground text-lg">
            Personalized playlists and recommendations
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Curating your personalized feed...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Daily Mixes */}
            {dailyMixes.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  Your Daily Mixes
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {dailyMixes.map((mix) => (
                    <div key={mix.id} className="group cursor-pointer">
                      <div className="relative mb-3 overflow-hidden rounded-xl aspect-square">
                        <img
                          src={mix.coverUrl}
                          alt={mix.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 flex items-end p-4">
                          <div className="w-full">
                            <h3 className="font-bold text-sm mb-1">{mix.name}</h3>
                            <p className="text-xs text-white/80">{mix.songs.length} songs</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (mix.songs.length > 0) {
                              play(mix.songs[0], mix.songs);
                            }
                          }}
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                        >
                          <Play className="w-6 h-6 ml-0.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            
            {/* Recently Played */}
            {recentlyPlayed.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <History className="w-6 h-6 text-accent" />
                  Recently Played
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {recentlyPlayed.map((song) => {
                    const isCurrentSong = currentSong?.id === song.id;
                    return (
                      <div key={song.id} className="group">
                        <div className="relative mb-3 overflow-hidden rounded-xl aspect-square">
                          <img
                            src={song.coverUrl}
                            alt={song.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <button
                            onClick={() => handlePlaySong(song, recentlyPlayed)}
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                          >
                            {isPlaying && isCurrentSong ? (
                              <Pause className="w-6 h-6" />
                            ) : (
                              <Play className="w-6 h-6 ml-0.5" />
                            )}
                          </button>
                        </div>
                        <h3 className="font-semibold text-sm truncate">{song.title}</h3>
                        <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            
            {/* Recommended */}
            {recommended.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-500" />
                  Recommended For You
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {recommended.map((song) => {
                    const isCurrentSong = currentSong?.id === song.id;
                    return (
                      <div key={song.id} className="group">
                        <div className="relative mb-3 overflow-hidden rounded-xl aspect-square">
                          <img
                            src={song.coverUrl}
                            alt={song.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <button
                            onClick={() => handlePlaySong(song, recommended)}
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                          >
                            {isPlaying && isCurrentSong ? (
                              <Pause className="w-6 h-6" />
                            ) : (
                              <Play className="w-6 h-6 ml-0.5" />
                            )}
                          </button>
                        </div>
                        <h3 className="font-semibold text-sm truncate">{song.title}</h3>
                        <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            
            {/* Trending */}
            {trending.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                  Trending Now
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {trending.slice(0, 12).map((song) => {
                    const isCurrentSong = currentSong?.id === song.id;
                    return (
                      <div key={song.id} className="group">
                        <div className="relative mb-3 overflow-hidden rounded-xl aspect-square">
                          <img
                            src={song.coverUrl}
                            alt={song.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <button
                            onClick={() => handlePlaySong(song, trending)}
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                          >
                            {isPlaying && isCurrentSong ? (
                              <Pause className="w-6 h-6" />
                            ) : (
                              <Play className="w-6 h-6 ml-0.5" />
                            )}
                          </button>
                        </div>
                        <h3 className="font-semibold text-sm truncate">{song.title}</h3>
                        <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
