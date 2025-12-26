import { useEffect, useState } from 'react';
import { Song } from '../types';
import SongCard from '../components/features/SongCard';
import { Heart, ListMusic, Clock, Loader2, Music, Upload, Download, HardDrive, Cloud, Sparkles, Play } from 'lucide-react';
import { useAuth } from '../stores/authStore';
import { Navigate } from 'react-router-dom';
import { getUnifiedLibrary, UnifiedSong, getLibraryStats } from '../lib/musicLibrary';
import { usePlayerStore } from '../stores/playerStore';
import { formatDuration } from '../lib/utils';

type TabType = 'all' | 'online' | 'downloads' | 'local';

export default function LibraryPage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { play } = usePlayerStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [library, setLibrary] = useState<{
    all: UnifiedSong[];
    online: UnifiedSong[];
    downloaded: UnifiedSong[];
    local: UnifiedSong[];
  }>({
    all: [],
    online: [],
    downloaded: [],
    local: [],
  });
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      fetchLibraryData();
    }
  }, [isAuthenticated, user, authLoading]);
  
  const fetchLibraryData = async () => {
    if (!user) return;
    
    try {
      const libraryData = await getUnifiedLibrary(user.id);
      const statsData = await getLibraryStats(user.id);
      
      setLibrary(libraryData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching library data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getCurrentSongs = (): UnifiedSong[] => {
    switch (activeTab) {
      case 'online':
        return library.online;
      case 'downloads':
        return library.downloaded;
      case 'local':
        return library.local;
      default:
        return library.all;
    }
  };
  
  const handlePlayAll = () => {
    const songs = getCurrentSongs();
    if (songs.length > 0) {
      // Convert UnifiedSong to Song for player
      const queue = songs.map(s => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        album: s.album,
        coverUrl: s.coverUrl,
        duration: s.duration,
        audioUrl: s.audioUrl,
        plays: s.plays,
        likes: s.likes,
        releaseDate: s.releaseDate,
        genre: s.genre,
        description: s.description,
      }));
      play(queue[0], queue);
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
  
  const currentSongs = getCurrentSongs();
  
  return (
    <div className="min-h-screen pb-32 pt-20">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Your Music Library</h1>
          <p className="text-muted-foreground">All your music in one place - online, downloaded, and local</p>
        </div>
        
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Music className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Total Songs</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalSongs}</p>
            </div>
            
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Cloud className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-muted-foreground">Online</span>
              </div>
              <p className="text-2xl font-bold">{stats.onlineSongs}</p>
            </div>
            
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Download className="w-5 h-5 text-green-400" />
                <span className="text-sm text-muted-foreground">Downloaded</span>
              </div>
              <p className="text-2xl font-bold">{stats.downloadedSongs}</p>
            </div>
            
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <HardDrive className="w-5 h-5 text-accent" />
                <span className="text-sm text-muted-foreground">Local</span>
              </div>
              <p className="text-2xl font-bold">{stats.localSongs}</p>
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 rounded-full font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-gradient-primary'
                : 'glass-card hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            All Music ({library.all.length})
          </button>
          
          <button
            onClick={() => setActiveTab('online')}
            className={`px-6 py-3 rounded-full font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'online'
                ? 'bg-gradient-primary'
                : 'glass-card hover:bg-white/10'
            }`}
          >
            <Cloud className="w-4 h-4" />
            Online ({library.online.length})
          </button>
          
          <button
            onClick={() => setActiveTab('downloads')}
            className={`px-6 py-3 rounded-full font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'downloads'
                ? 'bg-gradient-primary'
                : 'glass-card hover:bg-white/10'
            }`}
          >
            <Download className="w-4 h-4" />
            Downloads ({library.downloaded.length})
          </button>
          
          <button
            onClick={() => setActiveTab('local')}
            className={`px-6 py-3 rounded-full font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'local'
                ? 'bg-gradient-primary'
                : 'glass-card hover:bg-white/10'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            Local Music ({library.local.length})
          </button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Action Bar */}
            {currentSongs.length > 0 && (
              <div className="flex items-center justify-between mb-6">
                <div className="text-muted-foreground">
                  {currentSongs.length} songs • {formatDuration(currentSongs.reduce((sum, s) => sum + s.duration, 0))}
                </div>
                <button
                  onClick={handlePlayAll}
                  className="px-6 py-3 bg-gradient-primary rounded-full font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Play All
                </button>
              </div>
            )}
            
            {/* Songs Grid */}
            {currentSongs.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {currentSongs.map((song) => (
                  <div key={song.id} className="relative">
                    <SongCard 
                      song={{
                        id: song.id,
                        title: song.title,
                        artist: song.artist,
                        album: song.album,
                        coverUrl: song.coverUrl,
                        duration: song.duration,
                        audioUrl: song.audioUrl,
                        plays: song.plays,
                        likes: song.likes,
                        releaseDate: song.releaseDate,
                        genre: song.genre,
                        description: song.description,
                      }} 
                    />
                    {/* Source Badge */}
                    <div className="absolute top-2 right-2 z-10">
                      {song.source === 'local' && (
                        <div className="px-2 py-1 bg-accent/90 rounded-full text-xs font-semibold backdrop-blur-sm flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          Local
                        </div>
                      )}
                      {song.source === 'downloaded' && (
                        <div className="px-2 py-1 bg-green-500/90 rounded-full text-xs font-semibold backdrop-blur-sm flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          Offline
                        </div>
                      )}
                      {song.source === 'online' && song.isAvailableOffline && (
                        <div className="px-2 py-1 bg-blue-500/90 rounded-full text-xs font-semibold backdrop-blur-sm flex items-center gap-1">
                          <Cloud className="w-3 h-3" />
                          Online
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                {activeTab === 'all' && (
                  <>
                    <Music className="w-20 h-20 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h2 className="text-2xl font-bold mb-2">Your Library is Empty</h2>
                    <p className="text-muted-foreground mb-6">
                      Start building your music collection
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <a
                        href="/upload"
                        className="px-6 py-3 bg-gradient-primary rounded-full font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Music
                      </a>
                      <a
                        href="/local-music"
                        className="px-6 py-3 glass-card rounded-full font-semibold hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <HardDrive className="w-4 h-4" />
                        Add Local Music
                      </a>
                    </div>
                  </>
                )}
                
                {activeTab === 'online' && (
                  <>
                    <Cloud className="w-20 h-20 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h2 className="text-2xl font-bold mb-2">No Online Songs</h2>
                    <p className="text-muted-foreground mb-6">
                      Upload songs or like tracks to build your online library
                    </p>
                  </>
                )}
                
                {activeTab === 'downloads' && (
                  <>
                    <Download className="w-20 h-20 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h2 className="text-2xl font-bold mb-2">No Downloaded Songs</h2>
                    <p className="text-muted-foreground mb-6">
                      Download songs for offline listening from any song page
                    </p>
                  </>
                )}
                
                {activeTab === 'local' && (
                  <>
                    <HardDrive className="w-20 h-20 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h2 className="text-2xl font-bold mb-2">No Local Music</h2>
                    <p className="text-muted-foreground mb-6">
                      Import music files from your device to play offline
                    </p>
                    <a
                      href="/local-music"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary rounded-full font-semibold hover:scale-105 transition-transform"
                    >
                      <HardDrive className="w-4 h-4" />
                      Add Local Music
                    </a>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
