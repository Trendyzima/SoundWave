import { useState, useRef } from 'react';
import { useAuth } from '../stores/authStore';
import { Navigate } from 'react-router-dom';
import { Folder, Music, Play, Pause, Plus, Trash2, ListMusic } from 'lucide-react';
import { usePlayerStore } from '../stores/playerStore';

interface LocalSong {
  id: string;
  title: string;
  artist: string;
  duration: number;
  audioUrl: string;
  file: File;
  coverUrl: string;
}

export default function LocalMusicPage() {
  const { isAuthenticated } = useAuth();
  const { play, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const [localSongs, setLocalSongs] = useState<LocalSong[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load local songs from localStorage on mount
  useState(() => {
    const stored = localStorage.getItem('local_music');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Note: We can't restore File objects from localStorage
        // User will need to re-import files
      } catch (e) {
        console.error('Error loading local music:', e);
      }
    }
  });
  
  const handleImportFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
    
    const newSongs: LocalSong[] = await Promise.all(
      audioFiles.map(async (file) => {
        // Extract metadata
        const audioUrl = URL.createObjectURL(file);
        const audio = new Audio(audioUrl);
        
        return new Promise<LocalSong>((resolve) => {
          audio.addEventListener('loadedmetadata', () => {
            const song: LocalSong = {
              id: `local_${Date.now()}_${Math.random().toString(36)}`,
              title: file.name.replace(/\.[^/.]+$/, ''),
              artist: 'Local Artist',
              duration: Math.floor(audio.duration),
              audioUrl,
              file,
              coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
            };
            resolve(song);
          });
        });
      })
    );
    
    setLocalSongs([...localSongs, ...newSongs]);
    
    // Save metadata to localStorage (without the File object)
    const metadata = newSongs.map(song => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      fileName: song.file.name,
    }));
    localStorage.setItem('local_music_metadata', JSON.stringify(metadata));
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
      
      // Create local songs from files
      const newSongs: LocalSong[] = await Promise.all(
        files.map(async (file) => {
          const audioUrl = URL.createObjectURL(file);
          const audio = new Audio(audioUrl);
          
          return new Promise<LocalSong>((resolve) => {
            audio.addEventListener('loadedmetadata', () => {
              resolve({
                id: `local_${Date.now()}_${Math.random().toString(36)}`,
                title: file.name.replace(/\.[^/.]+$/, ''),
                artist: 'Local Artist',
                duration: Math.floor(audio.duration),
                audioUrl,
                file,
                coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
              });
            });
          });
        })
      );
      
      setLocalSongs([...localSongs, ...newSongs]);
    } catch (error) {
      console.error('Error importing folder:', error);
      alert('Failed to import folder. Your browser may not support this feature.');
    }
  };
  
  const handlePlaySong = (song: LocalSong) => {
    const playerSong = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: '',
      coverUrl: song.coverUrl,
      duration: song.duration,
      audioUrl: song.audioUrl,
      plays: 0,
      likes: 0,
      releaseDate: '',
      genre: 'Local',
    };
    
    const isCurrentSong = currentSong?.id === song.id;
    if (isCurrentSong) {
      togglePlay();
    } else {
      const queue = localSongs.map(s => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        album: '',
        coverUrl: s.coverUrl,
        duration: s.duration,
        audioUrl: s.audioUrl,
        plays: 0,
        likes: 0,
        releaseDate: '',
        genre: 'Local',
      }));
      play(playerSong, queue);
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
            <Music className="w-8 h-8" />
            Local Music Library
          </h1>
          <p className="text-muted-foreground">
            Import and play music from your device. Works offline!
          </p>
        </div>
        
        {/* Import Buttons */}
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
                  <Plus className="w-4 h-4" />
                  Choose Files
                </div>
              </div>
            </button>
          </div>
          
          <div className="glass-card p-6 rounded-2xl">
            <button
              onClick={handleImportFolder}
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
              Import music files from your device to get started
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
                      id: s.id,
                      title: s.title,
                      artist: s.artist,
                      album: '',
                      coverUrl: s.coverUrl,
                      duration: s.duration,
                      audioUrl: s.audioUrl,
                      plays: 0,
                      likes: 0,
                      releaseDate: '',
                      genre: 'Local',
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
                        <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
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
              MP3, WAV, FLAC, AAC, OGG and more
            </p>
          </div>
          
          <div className="glass-card p-6 rounded-xl text-center">
            <Folder className="w-8 h-8 text-accent mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Bulk Import</h3>
            <p className="text-sm text-muted-foreground">
              Import entire folders at once
            </p>
          </div>
          
          <div className="glass-card p-6 rounded-xl text-center">
            <Play className="w-8 h-8 text-green-500 mx-auto mb-3" />
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
