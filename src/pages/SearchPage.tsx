import { useState } from 'react';
import { Search as SearchIcon, TrendingUp, Clock } from 'lucide-react';
import { mockSongs } from '../constants/mockData';
import SongCard from '../components/features/SongCard';
import { useAuthStore } from '../stores/authStore';
import { Navigate } from 'react-router-dom';

export default function SearchPage() {
  const { isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(mockSongs);
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults(mockSongs);
      return;
    }
    
    const filtered = mockSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(query.toLowerCase()) ||
        song.artist.toLowerCase().includes(query.toLowerCase()) ||
        song.album.toLowerCase().includes(query.toLowerCase()) ||
        song.genre.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(filtered);
  };
  
  const trendingSearches = ['The Weeknd', 'Pop Hits', 'Workout Music', 'R&B Classics'];
  const recentSearches = ['Dua Lipa', 'Justin Bieber', 'Chill Vibes'];
  
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
          </div>
        </div>
        
        {!searchQuery ? (
          <div className="space-y-12">
            {/* Trending Searches */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Trending Searches</h2>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {trendingSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => handleSearch(search)}
                    className="px-6 py-3 glass-card rounded-full hover:bg-white/10 transition-colors font-medium"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </section>
            
            {/* Recent Searches */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-6 h-6 text-muted-foreground" />
                <h2 className="text-2xl font-bold">Recent Searches</h2>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {recentSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => handleSearch(search)}
                    className="px-6 py-3 glass-card rounded-full hover:bg-white/10 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </section>
            
            {/* Browse All */}
            <section>
              <h2 className="text-2xl font-bold mb-6">Browse All</h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {mockSongs.map((song) => (
                  <SongCard key={song.id} song={song} />
                ))}
              </div>
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
