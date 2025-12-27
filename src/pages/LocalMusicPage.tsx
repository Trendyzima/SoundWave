import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../stores/authStore';
import { Navigate } from 'react-router-dom';
import { Folder, Music, Play, Pause, Plus, Trash2, ListMusic, Download, Loader2, HardDrive, Sparkles } from 'lucide-react';
import { usePlayerStore } from '../stores/playerStore';
import { autoDiscoverMusic, getLocalSongs, LocalSong, createSongFromFile, autoSyncLocalMusic } from '../lib/localMusic';

export default function LocalMusicPage() {
  const { isAuthenticated } = useAuth();
  const { play, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const [localSongs, setLocalSongs] = useState<LocalSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoScanning, setAutoScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load cached local songs and auto-sync on mount
  useEffect(() => {
    loadCachedSongs();
    autoSync();
  }, []);
  
  const loadCachedSongs = async () => {
    try {
      const cached = await getLocalSongs();
      setLocalSongs(cached);
    } catch (error) {
      console.error('Error loading cached songs:', error);
    }
  };
  
  const autoSync = async () => {
    try {
      const synced = await autoSyncLocalMusic();
      if (synced.length > 0) {
        setLocalSongs(synced);
        console.log(`Auto-synced ${synced.length} songs from device`);
      }
    } catch (error) {
      console.warn('Auto-sync failed:', error);
    }
  };
  
  const handleAutoDiscover = async () => {
    setAutoScanning(true);
    try {
      const discovered = await autoDiscoverMusic();
      setLocalSongs([...localSongs, ...discovered]);
      
      if (discovered.length > 0) {
        alert(`Successfully discovered ${discovered.length} songs! They are now synced and available offline in your Library.`);
      }
    } catch (error: any) {
      console.error('Error auto-discovering music:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Failed to auto-discover music. Please try again.';
      alert(errorMessage);
    } finally {
      setAutoScanning(false);
    }
  };
  
  const handleImportFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
    
    if (audioFiles.length === 0) {
      alert('No audio files selected. Please select audio files (MP3, WAV, FLAC, etc.)');
      return;
    }
    
    setLoading(true);
    try {
      const newSongs: LocalSong[] = await Promise.all(
        audioFiles.map(file => createSongFromFile(file))
      );
      
      setLocalSongs([...localSongs, ...newSongs]);
      
      if (newSongs.length > 0) {
        alert(`Successfully imported ${newSongs.length} songs!`);
      }
    } catch (error) {
      console.error('Error importing files:', error);
      alert('Failed to import some files. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleImportFolder = async () => {
    try {
      // @ts-ignore - File System Access API
      const dirHandle = await window.showDirectoryPicker();
      const files: File[] = [];
      
      // @ts-ignore
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          if (file.type.startsWith('audio/')) {
            files.push(file);
          }
        }
      }
      
      if (files.length === 0) {
        alert('No audio files found in the selected folder.');
        return;
      }
      
      setLoading(true);
      const newSongs: LocalSong[] = await Promise.all(
        files.map(file => createSongFromFile(file))
      );
      
      setLocalSongs([...localSongs, ...newSongs]);
      
      if (newSongs.length > 0) {
        alert(`Successfully imported ${newSongs.length} songs from folder!`);
      }
    } catch (error: any) {
      console.error('Error importing folder:', error);
      
      if (error.name !== 'AbortError') {
        alert('Failed to import folder. Your browser may not support this feature. Please use Chrome or Edge.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handlePlaySong = (song: LocalSong) => {
    const isCurrentSong = currentSong?.id === song.id;
    if (isCurrentSong) {
      togglePlay();
    } else {
      const queue = localSongs.map(s => ({
        ...s,
        isLocal: undefined,
        file: undefined,
        downloaded: undefined,
      }));
      play(song, queue);
    }
  };
  
  const handleDeleteSong = (songId: string) => {
    setLocalSongs(localSongs.filter(s => s.id !== songId));
  };
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  return (
    <div className="min-h-screen pb-32 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-3">
            <HardDrive className="w-8 h-8" />
            Local Music Library
          </h1>
          <p className="text-muted-foreground">
            Auto-discover and play music from your device. Works offline!
          </p>
        </div>
        
        {/* Auto-Discover Banner */}
        <div className="glass-card p-6 rounded-2xl mb-6 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">Auto-Discover & Sync Music</h2>
              <p className="text-muted-foreground mb-4">
                Grant access to your music folder once, and we'll automatically find, sync, and keep your music library up to date.
                All songs will be available offline. Supports MP3, WAV, FLAC, OGG, M4A, AAC, and more!
              </p>
              <button
                onClick={handleAutoDiscover}
                disabled={autoScanning}
                className="px-6 py-3 bg-gradient-primary rounded-full font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {autoScanning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <HardDrive className="w-5 h-5" />
                    Auto-Discover & Sync
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Manual Import Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="glass-card p-6 rounded-2xl">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={handleImportFiles}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                  <Music className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold mb-1">Import Files</h3>
                  <p className="text-sm text-muted-foreground">
                    Select individual music files from your device
                  </p>
                </div>
                <div className="px-4 py-2 bg-primary rounded-full font-semibold flex items-center gap-2 hover:scale-105 transition-transform">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Choose Files
                    </>
                  )}
                </div>
              </div>
            </button>
          </div>
          
          <div className="glass-card p-6 rounded-2xl">
            <button
              onClick={handleImportFolder}
              disabled={loading}
              className="w-full"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                  <Folder className="w-8 h-8 text-accent" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold mb-1">Import Folder</h3>
                  <p className="text-sm text-muted-foreground">
                    Select an entire music folder to import all songs
                  </p>
                </div>
                <div className="px-4 py-2 bg-accent rounded-full font-semibold flex items-center gap-2 hover:scale-105 transition-transform">
                  <Folder className="w-4 h-4" />
                  Choose Folder
                </div>
              </div>
            </button>
          </div>
        </div>
        
        {/* Songs List */}
        {localSongs.length === 0 ? (
          <div className="text-center py-20">
            <Music className="w-20 h-20 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">No Local Music Yet</h2>
            <p className="text-muted-foreground mb-6">
              Use auto-discover or import music files from your device to get started
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ListMusic className="w-5 h-5" />
                <span>{localSongs.length} songs</span>
              </div>
              <button
                onClick={() => {
                  if (localSongs.length > 0) {
                    const queue = localSongs.map(s => ({
                      ...s,
                      isLocal: undefined,
                      file: undefined,
                      downloaded: undefined,
                    }));
                    play(queue[0], queue);
                  }
                }}
                className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-full font-semibold transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Play All
              </button>
            </div>
            
            <div className="space-y-2">
              {localSongs.map((song, index) => {
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
                          {song.downloaded && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-500 rounded-full text-xs">
                              <Download className="w-3 h-3" />
                              Offline
                            </span>
                          )}
                        </p>
                      </div>
                      
                      <span className="text-sm text-muted-foreground">
                        {formatDuration(song.duration)}
                      </span>
                      
                      <button
                        onClick={() => handleDeleteSong(song.id)}
                        className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-6 rounded-xl text-center">
            <Music className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">All Formats Supported</h3>
            <p className="text-sm text-muted-foreground">
              MP3, WAV, FLAC, AAC, OGG, M4A, WMA, OPUS and more
            </p>
          </div>
          
          <div className="glass-card p-6 rounded-xl text-center">
            <Folder className="w-8 h-8 text-accent mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Auto-Discovery & Sync</h3>
            <p className="text-sm text-muted-foreground">
              Automatically finds and syncs all music on your device
            </p>
          </div>
          
          <div className="glass-card p-6 rounded-xl text-center">
            <Download className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Offline Playback</h3>
            <p className="text-sm text-muted-foreground">
              Works without internet connection
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
