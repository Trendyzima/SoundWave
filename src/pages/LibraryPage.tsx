import { useState, useEffect } from 'react';
import { useAuth } from '../stores/authStore';
import { Navigate } from 'react-router-dom';
import { Music, Download, HardDrive, Play, Pause } from 'lucide-react';
import { usePlayerStore } from '../stores/playerStore';
import { getUnifiedLibrary, UnifiedSong } from '../lib/musicLibrary';
import { autoSyncLocalMusic } from '../lib/localMusic';

export default function LibraryPage() {
  const { user, isAuthenticated } = useAuth();
  const { play, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const [library, setLibrary] = useState<UnifiedSong[]>([]);
  const [downloaded, setDownloaded] = useState<UnifiedSong[]>([]);
  const [local, setLocal] = useState<UnifiedSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'downloaded' | 'local'>('all');
  
  useEffect(() => {
    loadLibrary();
    syncLocalMusicInBackground();
  }, [user]);
  
  const loadLibrary = async () => {
    setLoading(true);
    try {
      const lib = await getUnifiedLibrary(user?.id);
      setLibrary(lib.all);
      setDownloaded(lib.downloaded);
      setLocal(lib.local);
      
      // Set active filter based on available content
      if (lib.downloaded.length > 0 && filter === 'all') {
        setFilter('downloaded');
      } else if (lib.local.length > 0 && filter === 'all') {
        setFilter('local');
      }
    } catch (error) {
      console.error('Error loading library:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const syncLocalMusicInBackground = async () => {
    try {
      const synced = await autoSyncLocalMusic();
      if (synced.length > 0) {
        // Refresh library after sync
        const lib = await getUnifiedLibrary(user?.id);
        setLibrary(lib.all);
        setLocal(lib.local);
        console.log(`Background sync: ${synced.length} local songs synchronized`);
      }
    } catch (error) {
      console.warn('Background sync failed:', error);
    }
  };
  
  const handlePlaySong = (song: UnifiedSong) => {
    const isCurrentSong = currentSong?.id === song.id;
    if (isCurrentSong) {
      togglePlay();
    } else {
      const filteredSongs = getFilteredSongs();
      play(song, filteredSongs);
    }
  };
  
  const getFilteredSongs = () => {
    switch (filter) {
      case 'downloaded':
        return downloaded;
      case 'local':
        return local;
      default:
        return library;
    }
  };
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  const filteredSongs = getFilteredSongs();
  
  return (
    <div className="min-h-screen pb-32 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">My Library</h1>
          <p className="text-muted-foreground">
            All your music in one place - online, downloaded, and local
          </p>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <Music className="w-4 h-4 inline mr-2" />
            All ({library.length})
          </button>
          <button
            onClick={() => setFilter('downloaded')}
            className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors ${
              filter === 'downloaded'
                ? 'bg-primary text-white'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <Download className="w-4 h-4 inline mr-2" />
            Downloaded ({downloaded.length})
          </button>
          <button
            onClick={() => setFilter('local')}
            className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors ${
              filter === 'local'
                ? 'bg-primary text-white'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <HardDrive className="w-4 h-4 inline mr-2" />
            Local ({local.length})
          </button>
        </div>
        
        {/* Songs List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your library...</p>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="text-center py-20">
            <Music className="w-20 h-20 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Your Library is Empty</h2>
            <p className="text-muted-foreground mb-6">
              {filter === 'downloaded' && 'Download songs to listen offline'}
              {filter === 'local' && 'Import local music from your device'}
              {filter === 'all' && 'Upload songs or add local music to get started'}
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-muted-foreground">
                {filteredSongs.length} songs
              </div>
              <button
                onClick={() => {
                  if (filteredSongs.length > 0) {
                    play(filteredSongs[0], filteredSongs);
                  }
                }}
                className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-full font-semibold transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Play All
              </button>
            </div>
            
            <div className="space-y-2">
              {filteredSongs.map((song, index) => {
                const isCurrentSong = currentSong?.id === song.id;
                return (
                  <div
                    key={song.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrentSong
                        ? 'border-primary bg-primary/10'
                        : 'border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground w-8 text-right">{index + 1}</span>
                      
                      <button
                        onClick={() => handlePlaySong(song)}
                        className="w-12 h-12 bg-primary/20 hover:bg-primary/30 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        {isPlaying && isCurrentSong ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" />
                        )}
                      </button>
                      
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{song.title}</h3>
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-2">
                          {song.artist}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                            song.source === 'local'
                              ? 'bg-purple-500/20 text-purple-500'
                              : song.source === 'downloaded'
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-blue-500/20 text-blue-500'
                          }`}>
                            {song.source === 'local' && (
                              <>
                                <HardDrive className="w-3 h-3" />
                                Local
                              </>
                            )}
                            {song.source === 'downloaded' && (
                              <>
                                <Download className="w-3 h-3" />
                                Offline
                              </>
                            )}
                            {song.source === 'online' && (
                              <>
                                <Music className="w-3 h-3" />
                                Online
                              </>
                            )}
                          </span>
                        </p>
                      </div>
                      
                      <span className="text-sm text-muted-foreground">
                        {formatDuration(song.duration)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
