import { useState, useEffect } from 'react';
import { Search as SearchIcon, TrendingUp, Clock, Loader2, Music } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Song } from '../types';
import SongCard from '../components/features/SongCard';
import { useAuth } from '../stores/authStore';
import { Navigate } from 'react-router-dom';

export default function SearchPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchAllSongs();
    }
  }, [isAuthenticated, authLoading]);
  
  const fetchAllSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('plays', { ascending: false })
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
      
      setAllSongs(mappedSongs);
      setSearchResults(mappedSongs);
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults(allSongs);
      return;
    }
    
    setSearching(true);
    
    try {
      const lowerQuery = query.toLowerCase();
      
      // Search in database
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .or(
          `title.ilike.%${query}%,` +
          `artist.ilike.%${query}%,` +
          `album.ilike.%${query}%,` +
          `genre.ilike.%${query}%`
        )
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
      
      setSearchResults(mappedSongs);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearching(false);
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
  
  const trendingSearches = ['Pop', 'Rock', 'Hip-Hop', 'R&B'];
  const genres = Array.from(new Set(allSongs.map(s => s.genre).filter(Boolean))).slice(0, 8);
  
  return (
    <div className="min-h-screen pb-32 pt-20">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        {/* Search Header */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-6">Search</h1>
          
          {/* Search Input */}
          <div className="relative max-w-2xl">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for songs, artists, albums, or genres..."
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg"
            />
            {searching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !searchQuery ? (
          <div className="space-y-12">
            {/* Browse by Genre */}
            {genres.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">Browse by Genre</h2>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {genres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => handleSearch(genre)}
                      className="px-6 py-3 glass-card rounded-full hover:bg-white/10 transition-colors font-medium"
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </section>
            )}
            
            {/* Browse All */}
            <section>
              <h2 className="text-2xl font-bold mb-6">Browse All</h2>
              
              {allSongs.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {allSongs.map((song) => (
                    <SongCard key={song.id} song={song} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 glass-card rounded-xl">
                  <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No songs available yet</p>
                </div>
              )}
            </section>
          </div>
        ) : (
          <section>
            <h2 className="text-2xl font-bold mb-6">
              {searchResults.length > 0
                ? `Found ${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`
                : 'No results found'}
            </h2>
            
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {searchResults.map((song) => (
                  <SongCard key={song.id} song={song} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <SearchIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground">
                  No results found for "{searchQuery}"
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try searching for something else
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
