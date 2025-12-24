import { Playlist } from '../../types';
import { Play, Sparkles } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { Link } from 'react-router-dom';

interface PlaylistCardProps {
  playlist: Playlist;
}

export default function PlaylistCard({ playlist }: PlaylistCardProps) {
  const { play } = usePlayerStore();
  
  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    if (playlist.songs.length > 0) {
      play(playlist.songs[0]);
    }
  };
  
  return (
    <Link to={`/playlist/${playlist.id}`}>
      <div className="group relative glass-card p-4 rounded-xl hover:bg-white/10 transition-all cursor-pointer">
        <div className="relative mb-4">
          <img
            src={playlist.coverUrl}
            alt={playlist.name}
            className="w-full aspect-square object-cover rounded-lg"
          />
          {playlist.isAiGenerated && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-accent rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span className="text-xs font-semibold text-background">AI</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <button
              onClick={handlePlay}
              className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform"
            >
              <Play className="w-6 h-6 ml-0.5" />
            </button>
          </div>
        </div>
        
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground truncate group-hover:underline">
            {playlist.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {playlist.description}
          </p>
          <p className="text-xs text-muted-foreground pt-1">
            {playlist.songs.length} songs
          </p>
        </div>
      </div>
    </Link>
  );
}
