import { Link } from 'react-router-dom';
import { Song } from '../../types';
import { Heart, MessageCircle, Repeat2, Share2, Play, BarChart3 } from 'lucide-react';
import { formatDuration } from '../../lib/utils';
import { usePlayerStore } from '../../stores/playerStore';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../stores/authStore';

interface SongFeedCardProps {
  song: Song;
}

export default function SongFeedCard({ song }: SongFeedCardProps) {
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(song.likes);
  
  const isCurrentSong = currentSong?.id === song.id;
  
  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isCurrentSong) {
      togglePlay();
    } else {
      playSong(song);
    }
  };
  
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      if (liked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('song_id', song.id);
        setLiked(false);
        setLocalLikes(prev => prev - 1);
      } else {
        await supabase
          .from('likes')
          .insert({ user_id: user.id, song_id: song.id });
        setLiked(true);
        setLocalLikes(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };
  
  return (
    <article className="border-b border-white/10 px-4 py-3 hover:bg-white/[0.02] transition-colors">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
            <span className="text-sm font-bold">{song.artist[0]}</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1 mb-1">
            <Link to={`/song/${song.id}`} className="font-bold hover:underline">
              {song.artist}
            </Link>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground text-sm">
              {formatDuration(song.duration)}
            </span>
          </div>
          
          {/* Song Title */}
          <Link to={`/song/${song.id}`}>
            <p className="mb-3 text-[15px]">{song.title}</p>
          </Link>
          
          {/* Song Preview Card */}
          <Link to={`/song/${song.id}`} className="block mb-3">
            <div className="border border-white/10 rounded-2xl overflow-hidden hover:bg-white/5 transition-colors">
              <div className="relative aspect-video bg-gradient-dark">
                <img
                  src={song.coverUrl}
                  alt={song.title}
                  className="w-full h-full object-cover opacity-60"
                />
                <button
                  onClick={handlePlay}
                  className="absolute inset-0 flex items-center justify-center group"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 ml-1" fill="currentColor" />
                  </div>
                </button>
              </div>
              
              <div className="p-3 border-t border-white/10">
                <p className="font-semibold mb-1">{song.title}</p>
                <p className="text-sm text-muted-foreground">
                  {song.album && `${song.album} · `}
                  {song.genre}
                </p>
              </div>
            </div>
          </Link>
          
          {/* Interaction Buttons */}
          <div className="flex items-center justify-between max-w-md -ml-2">
            <Link
              to={`/song/${song.id}`}
              className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-primary/10 hover:text-primary transition-colors group"
            >
              <MessageCircle className="w-[18px] h-[18px]" />
              <span className="text-sm text-muted-foreground group-hover:text-primary">24</span>
            </Link>
            
            <button className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-green-500/10 hover:text-green-500 transition-colors group">
              <Repeat2 className="w-[18px] h-[18px]" />
              <span className="text-sm text-muted-foreground group-hover:text-green-500">12</span>
            </button>
            
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-2 py-1 rounded-full transition-colors group ${
                liked
                  ? 'text-pink-500'
                  : 'hover:bg-pink-500/10 hover:text-pink-500'
              }`}
            >
              <Heart className={`w-[18px] h-[18px] ${liked ? 'fill-current' : ''}`} />
              <span className={`text-sm ${liked ? 'text-pink-500' : 'text-muted-foreground group-hover:text-pink-500'}`}>
                {localLikes}
              </span>
            </button>
            
            <button className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-primary/10 hover:text-primary transition-colors group">
              <BarChart3 className="w-[18px] h-[18px]" />
              <span className="text-sm text-muted-foreground group-hover:text-primary">
                {song.plays}
              </span>
            </button>
            
            <button className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-primary/10 hover:text-primary transition-colors group">
              <Share2 className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
