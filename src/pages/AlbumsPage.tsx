import { useState, useEffect } from 'react';
import { Disc3, Play, Music } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Song, Album } from '../types';
import { usePlayerStore } from '../stores/playerStore';
import { useNavigate } from 'react-router-dom';

export default function AlbumsPage() {
  const { play } = usePlayerStore();
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadAlbums();
  }, []);
  
  const loadAlbums = async () => {
    try {
      const { data: songs } = await supabase
        .from('songs')
        .select('*')
        .order('release_date', { ascending: false });
      
      if (songs) {
        // Group songs by album
        const albumsMap = new Map<string, Song[]>();
        
        songs.forEach((song) => {
          const albumKey = `${song.album || 'Singles'}-${song.artist}`;
          if (!albumsMap.has(albumKey)) {
            albumsMap.set(albumKey, []);
          }
          albumsMap.get(albumKey)!.push({
            id: song.id,
            title: song.title,
            artist: song.artist,
            album: song.album || 'Singles',
            coverUrl: song.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
            duration: song.duration,
            audioUrl: song.audio_url,
            plays: song.plays,
            likes: song.likes,
            releaseDate: song.release_date || '',
            genre: song.genre || '',
            description: song.description || '',
          });
        });
        
        // Convert to Album objects
        const albumsList: Album[] = Array.from(albumsMap.entries()).map(([key, songs]) => {
          const firstSong = songs[0];
          return {
            id: key,
            title: firstSong.album,
            artist: firstSong.artist,
            coverUrl: firstSong.coverUrl,
            releaseDate: firstSong.releaseDate,
            genre: firstSong.genre,
            songs,
            totalDuration: songs.reduce((sum, s) => sum + s.duration, 0),
            plays: songs.reduce((sum, s) => sum + s.plays, 0),
          };
        });
        
        setAlbums(albumsList);
      }
    } catch (error) {
      console.error('Error loading albums:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  };
  
  return (
    <div className="min-h-screen pb-32 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 flex items-center gap-3">
            <Disc3 className="w-10 h-10" />
            Albums
          </h1>
          <p className="text-muted-foreground text-lg">
            Explore complete albums and collections
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading albums...</p>
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center py-20">
            <Music className="w-20 h-20 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">No Albums Yet</h2>
            <p className="text-muted-foreground">
              Albums will appear here as artists upload more music
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {albums.map((album) => (
              <div
                key={album.id}
                className="group cursor-pointer"
                onClick={() => {
                  // Navigate to album detail or play album
                  play(album.songs[0], album.songs);
                }}
              >
                <div className="relative mb-3 overflow-hidden rounded-xl aspect-square">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 ml-0.5" />
                    </button>
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 rounded-full text-xs font-semibold">
                    {album.songs.length} tracks
                  </div>
                </div>
                <h3 className="font-bold truncate mb-1">{album.title}</h3>
                <p className="text-sm text-muted-foreground truncate mb-1">{album.artist}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{album.releaseDate.split('-')[0]}</span>
                  <span>•</span>
                  <span>{formatDuration(album.totalDuration)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
