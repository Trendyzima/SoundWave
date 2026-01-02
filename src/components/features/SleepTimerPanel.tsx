import { useState, useEffect } from 'react';
import { X, Timer, Plus } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';

interface SleepTimerPanelProps {
  onClose: () => void;
}

export default function SleepTimerPanel({ onClose }: SleepTimerPanelProps) {
  const { sleepTimer, setSleepTimer, pause } = usePlayerStore();
  const [customMinutes, setCustomMinutes] = useState('');
  
  const presets = [5, 10, 15, 30, 45, 60];
  
  useEffect(() => {
    if (sleepTimer === null) return;
    
    const interval = setInterval(() => {
      setSleepTimer(sleepTimer - 1);
      
      if (sleepTimer <= 1) {
        pause();
        setSleepTimer(null);
        onClose();
      }
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [sleepTimer, pause, setSleepTimer, onClose]);
  
  const handleSetTimer = (minutes: number) => {
    setSleepTimer(minutes);
  };
  
  const handleCustomTimer = () => {
    const minutes = parseInt(customMinutes);
    if (!isNaN(minutes) && minutes > 0) {
      setSleepTimer(minutes);
      setCustomMinutes('');
    }
  };
  
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-background via-background/95 to-background/90 border border-white/10 rounded-2xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Timer className="w-6 h-6" />
            Sleep Timer
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Current Timer */}
        {sleepTimer !== null && (
          <div className="mb-6 p-4 bg-primary/20 border border-primary/30 rounded-xl text-center">
            <p className="text-sm text-muted-foreground mb-1">Music will stop in</p>
            <p className="text-3xl font-bold text-primary">{formatTime(sleepTimer)}</p>
            <button
              onClick={() => setSleepTimer(null)}
              className="mt-3 text-sm text-red-500 hover:text-red-400 transition-colors"
            >
              Cancel Timer
            </button>
          </div>
        )}
        
        {/* Preset Times */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-3">Quick Select</p>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((minutes) => (
              <button
                key={minutes}
                onClick={() => handleSetTimer(minutes)}
                className={`p-3 rounded-xl border transition-all hover:scale-105 ${
                  sleepTimer === minutes
                    ? 'border-primary bg-primary/20 text-primary font-semibold'
                    : 'border-white/10 hover:bg-white/5'
                }`}
              >
                {formatTime(minutes)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Custom Time */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">Custom Time</p>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="999"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              placeholder="Enter minutes"
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
            <button
              onClick={handleCustomTimer}
              disabled={!customMinutes}
              className="px-4 py-3 bg-primary hover:bg-primary/90 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Set
            </button>
          </div>
        </div>
        
        {/* Info */}
        <p className="mt-6 text-xs text-muted-foreground text-center">
          Music playback will automatically pause when the timer ends
        </p>
      </div>
    </div>
  );
}
