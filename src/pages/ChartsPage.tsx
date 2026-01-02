import { useState, useEffect } from 'react';
import { TrendingUp, Globe, MapPin, Music2, Play, Pause, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Song } from '../types';
import { usePlayerStore } from '../stores/playerStore';

export default function ChartsPage() {
  const { play, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const [chartType, setChartType] = useState<'global' | 'regional' | 'genre'>('global');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [topSongs, setTopSongs] = useState<(Song & { rank: number; change: number })[]>([]);
  const [loading, setLoading] = useState(true);
  
  const genres = ['All', 'Pop', 'Hip Hop', 'R&B', 'Rock', 'Electronic', 'Jazz', 'Country', 'Reggae'];
  
  useEffect(() => {
    loadCharts();
  }, [chartType, selectedGenre]);
  
  const loadCharts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('songs')
        .select('*')
        .order('plays', { ascending: false })
        .limit(50);
      
      if (selectedGenre !== 'All') {
        query = query.eq('genre', selectedGenre);
      }
      
      const { data } = await query;
      
      if (data) {
        const songs = data.map((song, index) => ({
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
          rank: index + 1,
          change: Math.floor(Math.random() * 21) - 10, // Simulated chart movement
        }));
        
        setTopSongs(songs);
      }
    } catch (error) {
      console.error('Error loading charts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePlaySong = (song: Song, index: number) => {
    const isCurrentSong = currentSong?.id === song.id;
    if (isCurrentSong) {
      togglePlay();
    } else {
      play(song, topSongs);
    }
  };
  
  const getRankChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };
  
  return (
    <div className="min-h-screen pb-32 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 flex items-center gap-3">
            <TrendingUp className="w-10 h-10" />
            Top Charts
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover what's trending worldwide
          </p>
        </div>
        
        {/* Chart Type Selector */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setChartType('global')}
            className={`px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-all ${
              chartType === 'global'
                ? 'bg-gradient-primary scale-105'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <Globe className="w-4 h-4 inline mr-2" />
            Global
          </button>
          <button
            onClick={() => setChartType('regional')}
            className={`px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-all ${
              chartType === 'regional'
                ? 'bg-gradient-primary scale-105'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-2" />
            Regional
          </button>
          <button
            onClick={() => setChartType('genre')}
            className={`px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-all ${
              chartType === 'genre'
                ? 'bg-gradient-primary scale-105'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <Music2 className="w-4 h-4 inline mr-2" />
            By Genre
          </button>
        </div>
        
        {/* Genre Filter */}
        {chartType === 'genre' && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                  selectedGenre === genre
                    ? 'bg-primary text-white scale-105'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        )}
        
        {/* Chart List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading charts...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topSongs.map((song, index) => {
              const isCurrentSong = currentSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  className={`glass-card p-4 rounded-xl border transition-all hover:scale-[1.01] ${
                    isCurrentSong ? 'border-primary bg-primary/10' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex flex-col items-center w-16">
                      <span className={`text-2xl font-bold ${
                        song.rank <= 3 ? 'text-gradient-primary' : 'text-muted-foreground'
                      }`}>
                        #{song.rank}
                      </span>
                      <div className="flex items-center gap-1 text-xs">
                        {getRankChangeIcon(song.change)}
                        {song.change !== 0 && <span>{Math.abs(song.change)}</span>}
                      </div>
                    </div>
                    
                    {/* Play Button */}
                    <button
                      onClick={() => handlePlaySong(song, index)}
                      className="w-14 h-14 bg-gradient-primary hover:scale-110 rounded-full flex items-center justify-center transition-transform flex-shrink-0"
                    >
                      {isPlaying && isCurrentSong ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6 ml-0.5" />
                      )}
                    </button>
                    
                    {/* Cover */}
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{song.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                      <p className="text-xs text-muted-foreground">{song.genre}</p>
                    </div>
                    
                    {/* Stats */}
                    <div className="hidden md:flex flex-col items-end gap-1">
                      <div className="text-sm font-semibold">{formatNumber(song.plays)} plays</div>
                      <div className="text-xs text-muted-foreground">{formatNumber(song.likes)} likes</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
