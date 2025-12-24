import { useState, useEffect } from 'react';
import { Search as SearchIcon, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Song } from '../types';
import { useAuth } from '../stores/authStore';
import { Navigate, Link } from 'react-router-dom';
import { usePlayerStore } from '../stores/playerStore';

export default function SearchPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { playSong } = usePlayerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('for-you');
  
  const tabs = ['For You', 'Trending', 'News', 'Sports', 'Entertainment'];
  
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
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-14">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  const genres = Array.from(new Set(allSongs.map(s => s.genre).filter(Boolean)));
  const trendingTopics = [
    { name: 'New Releases', count: '12.5K posts' },
    { name: 'Top Charts', count: '8.2K posts' },
    { name: 'Live Sessions', count: '5.1K posts' },
  ];
  
  return (
    <div className="min-h-screen pb-20 md:pb-4 pt-14">
      <div className="max-w-screen-xl mx-auto md:ml-64 lg:ml-72 md:mr-0">
        <div className="max-w-2xl">
          {/* Search Header */}
          <div className="sticky top-14 bg-background/80 backdrop-blur-xl z-10 pb-3">
            <div className="px-4 pt-3">
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-background"
                />
              </div>
            </div>
            
            {/* Horizontal Tabs */}
            <div className="overflow-x-auto scrollbar-hide border-b border-white/10 mt-3">
              <div className="flex px-4 gap-6">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.toLowerCase().replace(' ', '-');
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
                      className={`py-3 font-semibold whitespace-nowrap transition-colors relative ${
                        isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="px-4 py-4 space-y-4">
              {/* Today's News Section */}
              <section>
                <h2 className="text-xl font-bold mb-4">Today's Music</h2>
                <div className="space-y-3">
                  {allSongs.slice(0, 3).map((song, index) => (
                    <Link
                      key={song.id}
                      to={`/song/${song.id}`}
                      className="block p-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <div className="flex gap-3">
                        <img
                          src={song.coverUrl}
                          alt={song.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold mb-1 line-clamp-2">{song.title}</h3>
                          <p className="text-sm text-muted-foreground mb-1">
                            {song.artist} · {song.genre}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {song.plays.toLocaleString()} plays
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
              
              {/* Trending */}
              <section className="pt-4">
                <h2 className="text-xl font-bold mb-4">Trending</h2>
                <div className="space-y-1">
                  {trendingTopics.map((topic, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Music · Trending</p>
                          <p className="font-bold">{topic.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">{topic.count}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
              
              {/* Browse by Genre */}
              {genres.length > 0 && (
                <section className="pt-4">
                  <h2 className="text-xl font-bold mb-4">Browse by Genre</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {genres.slice(0, 6).map((genre) => (
                      <button
                        key={genre}
                        className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 hover:from-primary/30 hover:to-accent/30 transition-all text-left"
                      >
                        <p className="font-bold text-lg">{genre}</p>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
