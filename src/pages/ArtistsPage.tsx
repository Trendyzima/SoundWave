import { useState, useEffect } from 'react';
import { Mic2, Play, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Artist, Song } from '../types';
import { usePlayerStore } from '../stores/playerStore';
import { useNavigate } from 'react-router-dom';

export default function ArtistsPage() {
  const { play } = usePlayerStore();
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadArtists();
  }, []);
  
  const loadArtists = async () => {
    try {
      const { data: songs } = await supabase
        .from('songs')
        .select('*')
        .order('plays', { ascending: false });
      
      if (songs) {
        // Group songs by artist
        const artistsMap = new Map<string, Song[]>();
        
        songs.forEach((song) => {
          const artist = song.artist;
          if (!artistsMap.has(artist)) {
            artistsMap.set(artist, []);
          }
          artistsMap.get(artist)!.push({
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
          });
        });
        
        // Get user profiles for artists
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('*');
        
        const profilesMap = new Map(
          (profiles || []).map(p => [p.username, p])
        );
        
        // Convert to Artist objects
        const artistsList: Artist[] = Array.from(artistsMap.entries()).map(([name, songs]) => {
          const profile = profilesMap.get(name);
          const topSongs = songs.sort((a, b) => b.plays - a.plays).slice(0, 5);
          const totalPlays = songs.reduce((sum, s) => sum + s.plays, 0);
          const genres = [...new Set(songs.map(s => s.genre))];
          
          return {
            id: profile?.id || name,
            name,
            bio: profile?.bio,
            avatarUrl: profile?.avatar_url || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop',
            coverUrl: profile?.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=400&fit=crop',
            genre: genres[0] || 'Various',
            followers: profile?.followers_count || 0,
            topSongs,
            albums: [],
            monthlyListeners: Math.floor(totalPlays / 12),
          };
        });
        
        // Sort by monthly listeners
        artistsList.sort((a, b) => b.monthlyListeners - a.monthlyListeners);
        
        setArtists(artistsList);
      }
    } catch (error) {
      console.error('Error loading artists:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };
  
  return (
    <div className="min-h-screen pb-32 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 flex items-center gap-3">
            <Mic2 className="w-10 h-10" />
            Artists
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover talented artists from around the world
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading artists...</p>
          </div>
        ) : artists.length === 0 ? (
          <div className="text-center py-20">
            <Mic2 className="w-20 h-20 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">No Artists Yet</h2>
            <p className="text-muted-foreground">
              Artists will appear here as users upload music
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {artists.map((artist) => (
              <div
                key={artist.id}
                className="group cursor-pointer"
                onClick={() => navigate(`/profile/${artist.id}`)}
              >
                <div className="relative mb-3 overflow-hidden rounded-full aspect-square">
                  <img
                    src={artist.avatarUrl}
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (artist.topSongs.length > 0) {
                          play(artist.topSongs[0], artist.topSongs);
                        }
                      }}
                      className="w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <Play className="w-6 h-6 ml-0.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-center truncate mb-1">{artist.name}</h3>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                  <Users className="w-3 h-3" />
                  <span>{formatNumber(artist.followers)} followers</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {formatNumber(artist.monthlyListeners)} monthly listeners
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
