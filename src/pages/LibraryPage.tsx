import { mockPlaylists, mockSongs } from '../constants/mockData';
import PlaylistCard from '../components/features/PlaylistCard';
import SongCard from '../components/features/SongCard';
import { Heart, ListMusic, Clock } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Navigate } from 'react-router-dom';

export default function LibraryPage() {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  const likedSongs = mockSongs.slice(0, 4);
  const myPlaylists = mockPlaylists.filter(p => !p.isAiGenerated);
  const recentlyPlayed = mockSongs.slice(2, 6);
  
  return (
    <div className="min-h-screen pb-32 pt-20">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Your Library</h1>
          <p className="text-muted-foreground">Access all your music in one place</p>
        </div>
        
        <div className="space-y-12">
          {/* Liked Songs */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Heart className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Liked Songs</h2>
              <span className="text-muted-foreground">({likedSongs.length})</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {likedSongs.map((song) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          </section>
          
          {/* My Playlists */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <ListMusic className="w-6 h-6 text-accent" />
              <h2 className="text-2xl font-bold">My Playlists</h2>
              <span className="text-muted-foreground">({myPlaylists.length})</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPlaylists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
              
              {/* Create New Playlist Card */}
              <button className="glass-card p-4 rounded-xl hover:bg-white/10 transition-all cursor-pointer border-2 border-dashed border-white/20 flex items-center justify-center min-h-[280px]">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ListMusic className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Create New Playlist</h3>
                  <p className="text-sm text-muted-foreground">Start building your collection</p>
                </div>
              </button>
            </div>
          </section>
          
          {/* Recently Played */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-muted-foreground" />
              <h2 className="text-2xl font-bold">Recently Played</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {recentlyPlayed.map((song) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
