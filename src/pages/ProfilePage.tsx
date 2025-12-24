import { useAuthStore } from '../stores/authStore';
import { Navigate } from 'react-router-dom';
import { Calendar, Users, Music, TrendingUp, Clock, Headphones } from 'lucide-react';
import { formatDate, formatNumber } from '../lib/utils';
import { mockSongs } from '../constants/mockData';
import SongCard from '../components/features/SongCard';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" />;
  }
  
  // Mock listening stats
  const stats = {
    totalListeningTime: 12456, // minutes
    topArtists: [
      { name: 'The Weeknd', plays: 234 },
      { name: 'Dua Lipa', plays: 189 },
      { name: 'Justin Bieber', plays: 156 },
    ],
    topSongs: mockSongs.slice(0, 4),
    topGenres: [
      { genre: 'Pop', count: 456 },
      { genre: 'R&B', count: 321 },
      { genre: 'Hip-Hop', count: 234 },
    ],
  };
  
  const listeningHours = Math.floor(stats.totalListeningTime / 60);
  
  return (
    <div className="min-h-screen pb-32 pt-20">
      {/* Profile Header */}
      <section className="relative mb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-20" />
        
        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
            {/* Avatar */}
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-white/20 shadow-2xl"
            />
            
            {/* User Info */}
            <div className="flex-1 space-y-3">
              <h1 className="text-4xl sm:text-5xl font-bold">{user.username}</h1>
              <p className="text-lg text-muted-foreground max-w-2xl">{user.bio}</p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span><strong>{formatNumber(user.followers)}</strong> followers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span><strong>{formatNumber(user.following)}</strong> following</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Joined {formatDate(user.joinedDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Listening Stats Cards */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">Your Listening Stats</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Listening Time */}
            <div className="glass-card p-6 rounded-xl border border-primary/20">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Headphones className="w-6 h-6" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-3xl font-bold mb-1">{listeningHours}h</h3>
              <p className="text-sm text-muted-foreground">Total listening time</p>
            </div>
            
            {/* Total Songs */}
            <div className="glass-card p-6 rounded-xl">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center">
                  <Music className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-1">847</h3>
              <p className="text-sm text-muted-foreground">Songs played</p>
            </div>
            
            {/* Top Genre */}
            <div className="glass-card p-6 rounded-xl">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-background" />
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-1">{stats.topGenres[0].genre}</h3>
              <p className="text-sm text-muted-foreground">Top genre</p>
            </div>
            
            {/* This Month */}
            <div className="glass-card p-6 rounded-xl">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-1">42h</h3>
              <p className="text-sm text-muted-foreground">This month</p>
            </div>
          </div>
        </section>
        
        {/* Top Artists */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">Top Artists</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.topArtists.map((artist, index) => (
              <div key={artist.name} className="glass-card p-6 rounded-xl hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-2xl font-bold">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{artist.name}</h3>
                    <p className="text-sm text-muted-foreground">{artist.plays} plays</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Top Songs */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">Your Most Played</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {stats.topSongs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </section>
        
        {/* Genre Distribution */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">Genre Distribution</h2>
          
          <div className="glass-card p-6 rounded-xl">
            <div className="space-y-4">
              {stats.topGenres.map((genre, index) => {
                const total = stats.topGenres.reduce((sum, g) => sum + g.count, 0);
                const percentage = (genre.count / total) * 100;
                
                return (
                  <div key={genre.genre}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{genre.genre}</span>
                      <span className="text-sm text-muted-foreground">{Math.round(percentage)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
