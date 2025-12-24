import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Song } from '../types';
import SongFeedCard from '../components/features/SongFeedCard';
import { Loader2, Music, TrendingUp, Hash, X } from 'lucide-react';
import { useAuth } from '../stores/authStore';
import { Navigate } from 'react-router-dom';

export default function HomePage() {
  const location = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [trendingHashtags, setTrendingHashtags] = useState<Array<{ tag: string; usage_count: number; rank: number }>>([]);
  
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchSongs();
      fetchTrendingHashtags();
    }
  }, [isAuthenticated, authLoading, selectedHashtag]);
  
  useEffect(() => {
    // Check if there's a hashtag in the URL query params
    const params = new URLSearchParams(location.search);
    const hashtag = params.get('hashtag');
    if (hashtag) {
      setSelectedHashtag(hashtag);
    }
  }, [location.search]);
  
  const fetchTrendingHashtags = async () => {
    try {
      const { data, error } = await supabase
        .from('hashtags')
        .select('tag, usage_count, plays_count')
        .order('usage_count', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      const rankedHashtags = (data || []).map((hashtag, index) => ({
        ...hashtag,
        rank: index + 1,
      }));
      
      setTrendingHashtags(rankedHashtags);
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
    }
  };
  
  const fetchSongs = async () => {
    try {
      let query = supabase
        .from('songs')
        .select(`
          *,
          song_hashtags(hashtag_id, hashtags(tag))
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      let mappedSongs: Song[] = (data || []).map((song: any) => {
        const songHashtags = song.song_hashtags?.map((sh: any) => sh.hashtags?.tag).filter(Boolean) || [];
        
        return {
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
          hashtags: songHashtags,
        };
      });
      
      // Filter by hashtag if selected
      if (selectedHashtag) {
        mappedSongs = mappedSongs.filter(song =>
          song.hashtags?.some(tag => tag.toLowerCase() === selectedHashtag.toLowerCase())
        );
      }
      
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
      <div className="max-w-screen-xl mx-auto md:ml-64 lg:ml-72 md:mr-0 flex gap-4">
        <div className="flex-1 max-w-2xl">
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
          
          {/* Active Hashtag Filter */}
          {selectedHashtag && (
            <div className="px-4 py-3 border-b border-white/10 bg-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" />
                  <span className="font-semibold">
                    Showing posts tagged: {selectedHashtag}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedHashtag(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          
          {/* Feed */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : songs.length === 0 ? (
            <div className="text-center py-20 px-4">
              <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-bold mb-2">
                {selectedHashtag ? `No music found for ${selectedHashtag}` : 'No music yet'}
              </h2>
              <p className="text-muted-foreground">
                {selectedHashtag ? 'Try searching for a different hashtag' : 'Be the first to upload and share your music!'}
              </p>
            </div>
          ) : (
            <div>
              {songs.map((song) => (
                <SongFeedCard
                  key={song.id}
                  song={song}
                  onHashtagClick={(tag) => setSelectedHashtag(tag)}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Trending Sidebar (Desktop Only) */}
        <div className="hidden lg:block w-80 pt-2">
          <div className="sticky top-16 space-y-4">
            {/* Trending Hashtags */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h2 className="font-bold text-xl flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Trending Now
                </h2>
              </div>
              
              <div>
                {trendingHashtags.map((hashtag) => (
                  <button
                    key={hashtag.tag}
                    onClick={() => setSelectedHashtag(hashtag.tag)}
                    className="w-full text-left p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-muted-foreground text-sm">#{hashtag.rank}</span>
                          <Hash className="w-4 h-4 text-primary" />
                          <span className="font-bold truncate">{hashtag.tag.substring(1)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {hashtag.usage_count.toLocaleString()} {hashtag.usage_count === 1 ? 'post' : 'posts'}
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-primary/20">
                        {hashtag.rank}
                      </div>
                    </div>
                  </button>
                ))}
                
                {trendingHashtags.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <Hash className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No trending hashtags yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
