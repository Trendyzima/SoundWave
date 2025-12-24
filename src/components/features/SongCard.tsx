import { Song } from '../../types';
import { Play, Heart, MoreHorizontal } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { formatNumber } from '../../lib/utils';
import { Link } from 'react-router-dom';

interface SongCardProps {
  song: Song;
}

export default function SongCard({ song }: SongCardProps) {
  const { play, currentSong, isPlaying } = usePlayerStore();
  const isCurrentSong = currentSong?.id === song.id;
  
  return (
    <div className="group relative glass-card p-4 rounded-xl hover:bg-white/10 transition-all cursor-pointer">
      <Link to={`/song/${song.id}`}>
        <div className="relative mb-4">
          <img
            src={song.coverUrl}
            alt={song.title}
            className="w-full aspect-square object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <button
              onClick={(e) => {
                e.preventDefault();
                play(song);
              }}
              className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform"
            >
              <Play className="w-6 h-6 ml-0.5" />
            </button>
          </div>
          {isCurrentSong && isPlaying && (
            <div className="absolute top-2 right-2 w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <div className="flex gap-0.5 items-end h-3">
                <div className="w-0.5 bg-white animate-pulse" style={{ height: '60%' }} />
                <div className="w-0.5 bg-white animate-pulse" style={{ height: '100%', animationDelay: '0.2s' }} />
                <div className="w-0.5 bg-white animate-pulse" style={{ height: '80%', animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
        </div>
      </Link>
      
      <div className="space-y-1">
        <Link to={`/song/${song.id}`}>
          <h3 className="font-semibold text-foreground truncate hover:underline">
            {song.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            {formatNumber(song.plays)} plays
          </span>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="text-muted-foreground hover:text-primary transition-colors">
              <Heart className="w-4 h-4" />
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
