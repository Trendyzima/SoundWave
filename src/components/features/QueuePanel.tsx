import { useState } from 'react';
import { X, ListMusic, Trash2, GripVertical } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { formatDuration } from '../../lib/utils';

interface QueuePanelProps {
  onClose: () => void;
}

export default function QueuePanel({ onClose }: QueuePanelProps) {
  const { queue, currentIndex, currentSong, play, removeFromQueue, clearQueue } = usePlayerStore();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Visual feedback could be added here
  };
  
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Reorder logic would go here using reorderQueue from store
    setDraggedIndex(null);
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-background via-background/95 to-background/90 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ListMusic className="w-6 h-6" />
              Queue
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {queue.length} songs • {currentIndex + 1} of {queue.length} playing
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Queue List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {queue.length === 0 ? (
            <div className="text-center py-12">
              <ListMusic className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No songs in queue</p>
            </div>
          ) : (
            queue.map((song, index) => {
              const isCurrentSong = song.id === currentSong?.id;
              const isPastSong = index < currentIndex;
              
              return (
                <div
                  key={`${song.id}-${index}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`p-3 rounded-xl border transition-all ${
                    isCurrentSong
                      ? 'border-primary bg-primary/10 scale-105'
                      : isPastSong
                      ? 'border-white/5 bg-white/5 opacity-50'
                      : 'border-white/10 hover:bg-white/5 cursor-move'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Drag Handle */}
                    <button className="text-muted-foreground hover:text-foreground">
                      <GripVertical className="w-4 h-4" />
                    </button>
                    
                    {/* Position */}
                    <span className="text-muted-foreground w-8 text-right text-sm">
                      {index + 1}
                    </span>
                    
                    {/* Cover */}
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold truncate ${isCurrentSong ? 'text-primary' : ''}`}>
                        {song.title}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                    </div>
                    
                    {/* Duration */}
                    <span className="text-sm text-muted-foreground">
                      {formatDuration(song.duration)}
                    </span>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromQueue(index)}
                      disabled={isCurrentSong}
                      className={`p-2 rounded-lg transition-colors ${
                        isCurrentSong
                          ? 'opacity-30 cursor-not-allowed'
                          : 'hover:bg-red-500/20 hover:text-red-500'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Footer */}
        {queue.length > 0 && (
          <div className="p-4 border-t border-white/10">
            <button
              onClick={clearQueue}
              className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-xl font-semibold transition-colors"
            >
              Clear Queue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
