import { useState, useEffect } from 'react';
import { useAuth } from '../stores/authStore';
import { Navigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Song } from '../types';
import { 
  Loader2, Calendar, MapPin, Link as LinkIcon, Edit2, Save, X, 
  Music, Heart, MessageCircle, BarChart3, TrendingUp 
} from 'lucide-react';
import { formatDuration } from '../lib/utils';

export default function ProfilePage() {
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const { username } = useParams();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [uploadedSongs, setUploadedSongs] = useState<Song[]>([]);
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'analytics' | 'likes'>('posts');
  
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    location: '',
    website: '',
  });
  
  const [stats, setStats] = useState({
    totalPlays: 0,
    totalLikes: 0,
    totalComments: 0,
    totalListeningTime: 0,
  });
  
  const isOwnProfile = !username || currentUser?.username === username;
  
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (isOwnProfile && currentUser) {
        loadOwnProfile();
      } else if (username) {
        loadUserProfile(username);
      }
    }
  }, [isAuthenticated, authLoading, username, currentUser]);
  
  const loadOwnProfile = async () => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      if (error) throw error;
      
      const mappedProfile: User = {
        id: data.id,
        username: data.username || data.email.split('@')[0],
        email: data.email,
        avatarUrl: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
        bio: data.bio,
        location: data.location,
        website: data.website,
        coverUrl: data.cover_url,
        joinedDate: data.created_at,
        followersCount: data.followers_count || 0,
        followingCount: data.following_count || 0,
      };
      
      setProfile(mappedProfile);
      setEditForm({
        username: mappedProfile.username,
        bio: mappedProfile.bio || '',
        location: mappedProfile.location || '',
        website: mappedProfile.website || '',
      });
      
      await Promise.all([
        fetchUploadedSongs(currentUser.id),
        fetchLikedSongs(currentUser.id),
        fetchStats(currentUser.id),
      ]);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadUserProfile = async (username: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error) throw error;
      
      const mappedProfile: User = {
        id: data.id,
        username: data.username || data.email.split('@')[0],
        email: data.email,
        avatarUrl: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
        bio: data.bio,
        location: data.location,
        website: data.website,
        coverUrl: data.cover_url,
        joinedDate: data.created_at,
        followersCount: data.followers_count || 0,
        followingCount: data.following_count || 0,
      };
      
      setProfile(mappedProfile);
      
      // Check if following
      if (currentUser) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', data.id)
          .single();
        
        setIsFollowing(!!followData);
      }
      
      await Promise.all([
        fetchUploadedSongs(data.id),
        fetchLikedSongs(data.id),
        fetchStats(data.id),
      ]);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUploadedSongs = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const mappedSongs: Song[] = (data || []).map(song => ({
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
      
      setUploadedSongs(mappedSongs);
    } catch (error) {
      console.error('Error fetching uploaded songs:', error);
    }
  };
  
  const fetchLikedSongs = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('song_id, songs(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const mappedSongs: Song[] = (data || []).map((like: any) => ({
        id: like.songs.id,
        title: like.songs.title,
        artist: like.songs.artist,
        album: like.songs.album || '',
        coverUrl: like.songs.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
        duration: like.songs.duration,
        audioUrl: like.songs.audio_url,
        plays: like.songs.plays,
        likes: like.songs.likes,
        releaseDate: like.songs.release_date || '',
        genre: like.songs.genre || '',
        description: like.songs.description || '',
      }));
      
      setLikedSongs(mappedSongs);
    } catch (error) {
      console.error('Error fetching liked songs:', error);
    }
  };
  
  const fetchStats = async (userId: string) => {
    try {
      // Get total plays from uploaded songs
      const { data: songsData } = await supabase
        .from('songs')
        .select('plays, likes, duration')
        .eq('user_id', userId);
      
      const totalPlays = songsData?.reduce((sum, song) => sum + song.plays, 0) || 0;
      const totalLikes = songsData?.reduce((sum, song) => sum + song.likes, 0) || 0;
      
      // Get total comments
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      // Get total listening time from history
      const { data: historyData } = await supabase
        .from('listening_history')
        .select('duration_listened')
        .eq('user_id', userId);
      
      const totalListeningTime = historyData?.reduce((sum, h) => sum + h.duration_listened, 0) || 0;
      
      setStats({
        totalPlays,
        totalLikes,
        totalComments: commentsCount || 0,
        totalListeningTime,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          username: editForm.username,
          bio: editForm.bio || null,
          location: editForm.location || null,
          website: editForm.website || null,
        })
        .eq('id', currentUser.id);
      
      if (error) throw error;
      
      setEditing(false);
      loadOwnProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };
  
  const handleFollow = async () => {
    if (!currentUser || !profile) return;
    
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id);
        
        setIsFollowing(false);
        setProfile({
          ...profile,
          followersCount: profile.followersCount - 1,
        });
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: profile.id,
          });
        
        setIsFollowing(true);
        setProfile({
          ...profile,
          followersCount: profile.followersCount + 1,
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };
  
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-14">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-14">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-20 md:pb-4 pt-14">
      <div className="max-w-screen-xl mx-auto md:ml-64 lg:ml-72 md:mr-0">
        <div className="max-w-2xl">
          {/* Cover & Avatar */}
          <div className="relative">
            <div className="h-48 bg-gradient-to-br from-primary/30 to-accent/30" />
            <div className="px-4">
              <div className="flex justify-between items-start -mt-16 mb-4">
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  className="w-32 h-32 rounded-full border-4 border-background object-cover"
                />
                {isOwnProfile ? (
                  <button
                    onClick={() => editing ? handleSaveProfile() : setEditing(true)}
                    className="mt-20 px-4 py-2 border border-white/20 rounded-full font-semibold hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    {editing ? (
                      <>
                        <Save className="w-4 h-4" />
                        Save
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-4 h-4" />
                        Edit profile
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex gap-2 mt-20">
                    <Link
                      to={`/messages?conversation=${profile.id}`}
                      className="px-4 py-2 border border-white/20 rounded-full font-semibold hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </Link>
                    <button
                      onClick={handleFollow}
                      className={`px-4 py-2 rounded-full font-semibold transition-colors ${
                        isFollowing
                          ? 'border border-white/20 hover:bg-red-500/10 hover:text-red-500'
                          : 'bg-primary hover:bg-primary/90'
                      }`}
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Profile Info */}
              <div className="mb-4">
                {editing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Username"
                    />
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      placeholder="Bio"
                      rows={3}
                    />
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Location"
                    />
                    <input
                      type="url"
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Website"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold mb-1">{profile.username}</h1>
                    <p className="text-muted-foreground mb-3">@{profile.username}</p>
                    {profile.bio && <p className="mb-3">{profile.bio}</p>}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                      {profile.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {profile.location}
                        </div>
                      )}
                      {profile.website && (
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <LinkIcon className="w-4 h-4" />
                          {new URL(profile.website).hostname}
                        </a>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Joined {new Date(profile.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button className="hover:underline">
                        <span className="font-bold">{profile.followingCount}</span>{' '}
                        <span className="text-muted-foreground">Following</span>
                      </button>
                      <button className="hover:underline">
                        <span className="font-bold">{profile.followersCount}</span>{' '}
                        <span className="text-muted-foreground">Followers</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              {/* Tabs */}
              <div className="border-b border-white/10 mb-4">
                <div className="flex gap-6">
                  {(['posts', 'analytics', 'likes'] as const).map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-3 font-semibold transition-colors relative ${
                          isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {isActive && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Content */}
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  {uploadedSongs.length === 0 ? (
                    <div className="text-center py-20">
                      <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">No songs uploaded yet</p>
                    </div>
                  ) : (
                    uploadedSongs.map((song) => (
                      <Link
                        key={song.id}
                        to={`/song/${song.id}`}
                        className="block p-4 rounded-xl hover:bg-white/5 transition-colors border border-white/10"
                      >
                        <div className="flex gap-3">
                          <img
                            src={song.coverUrl}
                            alt={song.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold mb-1">{song.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{song.artist} · {song.genre}</p>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span>{song.plays.toLocaleString()} plays</span>
                              <span>{song.likes.toLocaleString()} likes</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
              
              {activeTab === 'analytics' && isOwnProfile && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-6 rounded-2xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats.totalPlays.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Total Plays</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="glass-card p-6 rounded-2xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center">
                          <Heart className="w-5 h-5 text-pink-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Total Likes</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="glass-card p-6 rounded-2xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats.totalComments.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Comments</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="glass-card p-6 rounded-2xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{Math.floor(stats.totalListeningTime / 60)}</p>
                          <p className="text-sm text-muted-foreground">Minutes Listened</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Top Songs */}
                  <div>
                    <h2 className="text-xl font-bold mb-4">Top Performing Songs</h2>
                    <div className="space-y-2">
                      {uploadedSongs.slice(0, 5).sort((a, b) => b.plays - a.plays).map((song, index) => (
                        <Link
                          key={song.id}
                          to={`/song/${song.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <span className="text-lg font-bold text-muted-foreground w-6">#{index + 1}</span>
                          <img
                            src={song.coverUrl}
                            alt={song.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{song.title}</p>
                            <p className="text-sm text-muted-foreground">{song.plays.toLocaleString()} plays</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'likes' && (
                <div className="space-y-4">
                  {likedSongs.length === 0 ? (
                    <div className="text-center py-20">
                      <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">No liked songs yet</p>
                    </div>
                  ) : (
                    likedSongs.map((song) => (
                      <Link
                        key={song.id}
                        to={`/song/${song.id}`}
                        className="block p-4 rounded-xl hover:bg-white/5 transition-colors border border-white/10"
                      >
                        <div className="flex gap-3">
                          <img
                            src={song.coverUrl}
                            alt={song.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold mb-1">{song.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{song.artist} · {song.genre}</p>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span>{song.plays.toLocaleString()} plays</span>
                              <span>{song.likes.toLocaleString()} likes</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
