import { useState, useEffect } from 'react';
import { useAuth } from '../stores/authStore';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { DJMix } from '../types';
import { Loader2, Music2, Play, Heart, Download, Upload, Clock } from 'lucide-react';
import { formatDuration } from '../lib/utils';

export default function DJMixesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [mixes, setMixes] = useState<DJMix[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'trending' | 'new'>('all');
  
  useEffect(() => {
    if (!authLoading) {
      fetchMixes();
    }
  }, [authLoading, filter]);
  
  const fetchMixes = async () => {
    try {
      let query = supabase
        .from('dj_mixes')
        .select('*, user_profiles(*)');
      
      if (filter === 'trending') {
        query = query.order('plays', { ascending: false });
      } else if (filter === 'new') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      const { data, error } = await query.limit(20);
      
      if (error) throw error;
      
      const mappedMixes: DJMix[] = (data || []).map((mix: any) => ({
        id: mix.id,
        userId: mix.user_id,
        title: mix.title,
        description: mix.description,
        coverUrl: mix.cover_url,
        audioUrl: mix.audio_url,
        duration: mix.duration,
        genre: mix.genre,
        tracklist: mix.tracklist,
        plays: mix.plays,
        likes: mix.likes,
        downloads: mix.downloads,
        createdAt: mix.created_at,
        updatedAt: mix.updated_at,
        user: mix.user_profiles ? {
          id: mix.user_profiles.id,
          username: mix.user_profiles.username || mix.user_profiles.email.split('@')[0],
          email: mix.user_profiles.email,
          avatarUrl: mix.user_profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mix.user_profiles.id}`,
          joinedDate: mix.user_profiles.created_at,
          followersCount: mix.user_profiles.followers_count || 0,
          followingCount: mix.user_profiles.following_count || 0,
        } : undefined,
      }));
      
      setMixes(mappedMixes);
    } catch (error) {
      console.error('Error fetching DJ mixes:', error);
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
  
  return (
    <div className="min-h-screen pb-20 md:pb-4 pt-14">
      <div className="max-w-screen-xl mx-auto md:ml-64 lg:ml-72 md:mr-0">
        <div className="max-w-6xl">
          {/* Header */}
          <div className="sticky top-14 bg-background/80 backdrop-blur-xl border-b border-white/10 z-10">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Music2 className="w-6 h-6" />
                  DJ Mixes & Sets
                </h1>
                {isAuthenticated && (
                  <Link
                    to="/upload-mix"
                    className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-full font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Mix
                  </Link>
                )}
              </div>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex border-t border-white/10">
              {(['all', 'trending', 'new'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`flex-1 px-4 py-4 font-semibold transition-colors relative hover:bg-white/5 ${
                    filter === tab ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {filter === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mixes.length === 0 ? (
                <div className="col-span-full text-center py-20">
                  <Music2 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h2 className="text-xl font-bold mb-2">No DJ mixes yet</h2>
                  <p className="text-muted-foreground mb-4">
                    Be the first to upload a mix!
                  </p>
                  {isAuthenticated && (
                    <Link
                      to="/upload-mix"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 rounded-full font-semibold transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      Upload Your Mix
                    </Link>
                  )}
                </div>
              ) : (
                mixes.map((mix) => (
                  <div
                    key={mix.id}
                    className="glass-card rounded-2xl overflow-hidden hover:bg-white/5 transition-colors group"
                  >
                    <div className="relative aspect-square">
                      {mix.coverUrl ? (
                        <img
                          src={mix.coverUrl}
                          alt={mix.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                          <Music2 className="w-20 h-20 text-white/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button className="w-16 h-16 rounded-full bg-primary flex items-center justify-center hover:scale-110 transition-transform">
                          <Play className="w-8 h-8 ml-1" fill="currentColor" />
                        </button>
                      </div>
                      {mix.genre && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded-full text-xs font-semibold">
                          {mix.genre}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">
                        {mix.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <img
                          src={mix.user?.avatarUrl}
                          alt={mix.user?.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="text-sm text-muted-foreground">
                          {mix.user?.username}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(mix.duration)}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Play className="w-4 h-4" />
                            {mix.plays.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {mix.likes.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="w-4 h-4" />
                            {mix.downloads.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
