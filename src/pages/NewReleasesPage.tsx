import { useState, useEffect } from 'react';
import { Calendar, Play, Pause, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Song } from '../types';
import { usePlayerStore } from '../stores/playerStore';

export default function NewReleasesPage() {
  const { play, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const [newReleases, setNewReleases] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('week');
  
  useEffect(() => {
    loadNewReleases();
  }, [filter]);
  
  const loadNewReleases = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let dateFilter = new Date();
      
      if (filter === 'week') {
        dateFilter.setDate(now.getDate() - 7);
      } else if (filter === 'month') {
        dateFilter.setMonth(now.getMonth() - 1);
      } else {
        dateFilter.setMonth(now.getMonth() - 3); // Last 3 months
      }
      
      const { data } = await supabase
        .from('songs')
        .select('*')
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data) {
        const songs = data.map(song => ({
          id: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album || '',
          coverUrl: song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
          duration: song.duration,
          audioUrl: song.audio_url,
          plays: song.plays,
          likes: song.likes,
          releaseDate: song.release_date || song.created_at,
          genre: song.genre || '',
          description: song.description || '',
        }));
        
        setNewReleases(songs);
      }
    } catch (error) {
      console.error('Error loading new releases:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePlaySong = (song: Song) => {
    const isCurrentSong = currentSong?.id === song.id;
    if (isCurrentSong) {
      togglePlay();
    } else {
      play(song, newReleases);
    }
  };
  
  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="min-h-screen pb-32 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 flex items-center gap-3">
            <Calendar className="w-10 h-10" />
            New Releases
          </h1>
          <p className="text-muted-foreground text-lg">
            Fresh music from your favorite artists
          </p>
        </div>
        
        {/* Filter */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter('week')}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              filter === 'week'
                ? 'bg-gradient-primary scale-105'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setFilter('month')}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              filter === 'month'
                ? 'bg-gradient-primary scale-105'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              filter === 'all'
                ? 'bg-gradient-primary scale-105'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            All Recent
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading new releases...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {newReleases.map((song) => {
              const isCurrentSong = currentSong?.id === song.id;
              return (
                <div key={song.id} className="group">
                  <div className="relative mb-3 overflow-hidden rounded-xl aspect-square">
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => handlePlaySong(song)}
                        className="w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        {isPlaying && isCurrentSong ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6 ml-0.5" />
                        )}
                      </button>
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 rounded-full text-xs font-bold">
                      NEW
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(song.duration)}
                    </div>
                  </div>
                  <h3 className="font-bold truncate mb-1">{song.title}</h3>
                  <p className="text-sm text-muted-foreground truncate mb-1">{song.artist}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(song.releaseDate)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
