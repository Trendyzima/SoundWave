import { useState, useEffect } from 'react';
import { useAuth } from '../stores/authStore';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Podcast, User } from '../types';
import { Loader2, Radio, Users, Clock, Heart, Play, Calendar } from 'lucide-react';

export default function PodcastsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [livePodcasts, setLivePodcasts] = useState<Podcast[]>([]);
  const [recordedPodcasts, setRecordedPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'recorded'>('live');
  
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchPodcasts();
      
      // Poll for live stream updates every 5 seconds
      const interval = setInterval(() => {
        fetchLivePodcasts();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, authLoading]);
  
  const fetchPodcasts = async () => {
    try {
      await Promise.all([fetchLivePodcasts(), fetchRecordedPodcasts()]);
    } catch (error) {
      console.error('Error fetching podcasts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchLivePodcasts = async () => {
    try {
      const { data, error } = await supabase
        .from('podcasts')
        .select('*, user_profiles(*)')
        .eq('is_live', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const mappedPodcasts: Podcast[] = (data || []).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        title: p.title,
        description: p.description || '',
        coverUrl: p.cover_url,
        audioUrl: p.audio_url,
        duration: p.duration,
        category: p.category,
        isLive: p.is_live,
        wasLive: p.was_live,
        viewersCount: p.viewers_count || 0,
        likes: p.likes || 0,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        endedAt: p.ended_at,
        host: p.user_profiles ? {
          id: p.user_profiles.id,
          username: p.user_profiles.username || p.user_profiles.email.split('@')[0],
          email: p.user_profiles.email,
          avatarUrl: p.user_profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_profiles.id}`,
          bio: p.user_profiles.bio,
          location: p.user_profiles.location,
          website: p.user_profiles.website,
          coverUrl: p.user_profiles.cover_url,
          joinedDate: p.user_profiles.created_at,
          followersCount: p.user_profiles.followers_count || 0,
          followingCount: p.user_profiles.following_count || 0,
        } : undefined,
      }));
      
      setLivePodcasts(mappedPodcasts);
    } catch (error) {
      console.error('Error fetching live podcasts:', error);
    }
  };
  
  const fetchRecordedPodcasts = async () => {
    try {
      const { data, error } = await supabase
        .from('podcasts')
        .select('*, user_profiles(*)')
        .eq('is_live', false)
        .not('audio_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      const mappedPodcasts: Podcast[] = (data || []).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        title: p.title,
        description: p.description || '',
        coverUrl: p.cover_url,
        audioUrl: p.audio_url,
        duration: p.duration,
        category: p.category,
        isLive: p.is_live,
        wasLive: p.was_live,
        viewersCount: p.viewers_count || 0,
        likes: p.likes || 0,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        endedAt: p.ended_at,
        host: p.user_profiles ? {
          id: p.user_profiles.id,
          username: p.user_profiles.username || p.user_profiles.email.split('@')[0],
          email: p.user_profiles.email,
          avatarUrl: p.user_profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_profiles.id}`,
          bio: p.user_profiles.bio,
          location: p.user_profiles.location,
          website: p.user_profiles.website,
          coverUrl: p.user_profiles.cover_url,
          joinedDate: p.user_profiles.created_at,
          followersCount: p.user_profiles.followers_count || 0,
          followingCount: p.user_profiles.following_count || 0,
        } : undefined,
      }));
      
      setRecordedPodcasts(mappedPodcasts);
    } catch (error) {
      console.error('Error fetching recorded podcasts:', error);
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
  
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  
  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };
  
  return (
    <div className="min-h-screen pb-20 md:pb-4 pt-14">
      <div className="max-w-screen-xl mx-auto md:ml-64 lg:ml-72 md:mr-0">
        <div className="max-w-2xl">
          {/* Header */}
          <div className="sticky top-14 bg-background/80 backdrop-blur-xl border-b border-white/10 z-10">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Podcasts</h1>
                <Link
                  to="/go-live"
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-full font-semibold flex items-center gap-2 transition-colors"
                >
                  <Radio className="w-4 h-4" />
                  Go Live
                </Link>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex border-t border-white/10">
              <button
                onClick={() => setActiveTab('live')}
                className={`flex-1 px-4 py-4 font-semibold transition-colors relative hover:bg-white/5 ${
                  activeTab === 'live' ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Radio className="w-5 h-5" />
                  Live Now
                  {livePodcasts.length > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 rounded-full text-xs">
                      {livePodcasts.length}
                    </span>
                  )}
                </div>
                {activeTab === 'live' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('recorded')}
                className={`flex-1 px-4 py-4 font-semibold transition-colors relative hover:bg-white/5 ${
                  activeTab === 'recorded' ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Recorded
                {activeTab === 'recorded' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                )}
              </button>
            </div>
          </div>
          
          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="px-4 py-4">
              {activeTab === 'live' ? (
                <>
                  {livePodcasts.length === 0 ? (
                    <div className="text-center py-20">
                      <Radio className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h2 className="text-xl font-bold mb-2">No live podcasts</h2>
                      <p className="text-muted-foreground mb-4">
                        Be the first to go live!
                      </p>
                      <Link
                        to="/go-live"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-full font-semibold transition-colors"
                      >
                        <Radio className="w-5 h-5" />
                        Start Live Podcast
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {livePodcasts.map((podcast) => (
                        <Link
                          key={podcast.id}
                          to={`/podcast/${podcast.id}`}
                          className="block glass-card rounded-2xl overflow-hidden hover:bg-white/5 transition-colors"
                        >
                          <div className="relative">
                            <div className="aspect-video bg-gradient-to-br from-red-500/30 to-pink-500/30 flex items-center justify-center">
                              {podcast.coverUrl ? (
                                <img
                                  src={podcast.coverUrl}
                                  alt={podcast.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Radio className="w-20 h-20 text-white/50" />
                              )}
                            </div>
                            <div className="absolute top-3 left-3 px-3 py-1 bg-red-500 rounded-full text-sm font-bold flex items-center gap-2 animate-pulse">
                              <div className="w-2 h-2 bg-white rounded-full" />
                              LIVE
                            </div>
                          </div>
                          
                          <div className="p-4">
                            <h3 className="font-bold text-lg mb-2 line-clamp-2">
                              {podcast.title}
                            </h3>
                            
                            <div className="flex items-center gap-3 mb-3">
                              <img
                                src={podcast.host?.avatarUrl}
                                alt={podcast.host?.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">
                                  {podcast.host?.username}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Started {formatTimeAgo(podcast.createdAt)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {podcast.viewersCount} watching
                              </div>
                              {podcast.category && (
                                <div className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">
                                  {podcast.category}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {recordedPodcasts.length === 0 ? (
                    <div className="text-center py-20">
                      <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h2 className="text-xl font-bold mb-2">No recorded podcasts</h2>
                      <p className="text-muted-foreground">
                        Recorded live streams will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recordedPodcasts.map((podcast) => (
                        <Link
                          key={podcast.id}
                          to={`/podcast/${podcast.id}`}
                          className="block p-4 rounded-xl hover:bg-white/5 transition-colors border border-white/10"
                        >
                          <div className="flex gap-3">
                            <div className="relative flex-shrink-0">
                              {podcast.coverUrl ? (
                                <img
                                  src={podcast.coverUrl}
                                  alt={podcast.title}
                                  className="w-20 h-20 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                                  <Play className="w-8 h-8" />
                                </div>
                              )}
                              {podcast.wasLive && (
                                <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500/80 rounded text-xs font-bold">
                                  LIVE
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold mb-1 line-clamp-2">
                                {podcast.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {podcast.host?.username}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formatDuration(podcast.duration)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Heart className="w-4 h-4" />
                                  {podcast.likes}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {formatTimeAgo(podcast.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
