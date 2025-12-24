import { useEffect, useState } from 'react';
import { useAuth } from '../stores/authStore';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, Music, Heart, Clock, Headphones, Loader2 } from 'lucide-react';
import { formatDate, formatNumber } from '../lib/utils';

interface Stats {
  totalListeningTime: number;
  songsPlayed: number;
  likedSongs: number;
  uploadedSongs: number;
}

export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalListeningTime: 0,
    songsPlayed: 0,
    likedSongs: 0,
    uploadedSongs: 0,
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      fetchUserStats();
    }
  }, [isAuthenticated, user, authLoading]);
  
  const fetchUserStats = async () => {
    if (!user) return;
    
    try {
      // Total listening time
      const { data: historyData } = await supabase
        .from('listening_history')
        .select('duration_listened')
        .eq('user_id', user.id);
      
      const totalTime = (historyData || []).reduce((sum, item) => sum + item.duration_listened, 0);
      
      // Songs played (unique count)
      const { count: songsCount } = await supabase
        .from('listening_history')
        .select('song_id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      // Liked songs
      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      // Uploaded songs
      const { count: uploadsCount } = await supabase
        .from('songs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setStats({
        totalListeningTime: totalTime,
        songsPlayed: songsCount || 0,
        likedSongs: likesCount || 0,
        uploadedSongs: uploadsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
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
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" />;
  }
  
  const formatListeningTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  
  return (
    <div className="min-h-screen pb-32 pt-20">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        {/* Profile Header */}
        <div className="relative mb-12 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-primary opacity-20" />
          <div className="relative p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-32 h-32 rounded-full object-cover border-4 border-white/20 shadow-2xl"
              />
              
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">{user.username}</h1>
                <p className="text-muted-foreground mb-4">{user.email}</p>
                {user.bio && <p className="text-foreground/80 mb-4">{user.bio}</p>}
                
                <div className="flex items-center justify-center sm:justify-start gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatDate(user.joinedDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Listening Stats</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Headphones className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatListeningTime(stats.totalListeningTime)}</p>
                    <p className="text-sm text-muted-foreground">Total Time</p>
                  </div>
                </div>
              </div>
              
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-accent rounded-full flex items-center justify-center">
                    <Music className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatNumber(stats.songsPlayed)}</p>
                    <p className="text-sm text-muted-foreground">Songs Played</p>
                  </div>
                </div>
              </div>
              
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatNumber(stats.likedSongs)}</p>
                    <p className="text-sm text-muted-foreground">Liked Songs</p>
                  </div>
                </div>
              </div>
              
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-accent rounded-full flex items-center justify-center">
                    <Music className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatNumber(stats.uploadedSongs)}</p>
                    <p className="text-sm text-muted-foreground">Uploaded</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
