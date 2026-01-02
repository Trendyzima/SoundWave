import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, ListMusic, Shuffle, Repeat, Repeat1, MoreHorizontal, Sliders, Timer, FileText } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { formatDuration } from '../../lib/utils';
import { useEffect, useRef, useState } from 'react';
import QueuePanel from '../features/QueuePanel';
import SleepTimerPanel from '../features/SleepTimerPanel';
import EqualizerPanel from '../features/EqualizerPanel';
import LyricsPanel from '../features/LyricsPanel';

export default function Player() {
  const { 
    currentSong, 
    isPlaying, 
    currentTime, 
    volume, 
    isShuffled,
    repeatMode,
    playbackSpeed,
    sleepTimer,
    togglePlay, 
    playNext, 
    playPrevious, 
    setCurrentTime, 
    setVolume, 
    pause,
    toggleShuffle,
    cycleRepeat,
    handleSongEnd,
    setPlaybackSpeed,
  } = usePlayerStore();
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  // Load audio when song changes
  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.src = currentSong.audioUrl;
      audioRef.current.load();
      setIsReady(false);
    }
  }, [currentSong]);
  
  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current || !isReady) return;
    
    if (isPlaying) {
      audioRef.current.play().catch((error) => {
        console.error('Error playing audio:', error);
        pause();
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, isReady, pause]);
  
  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  // Update playback speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);
  
  // Sync current time
  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 1) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime]);
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(Math.floor(audioRef.current.currentTime));
    }
  };
  
  const handleEnded = () => {
    handleSongEnd();
  };
  
  const handleCanPlay = () => {
    setIsReady(true);
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };
  
  if (!currentSong) return null;
  
  const progress = currentSong.duration > 0 ? (currentTime / currentSong.duration) * 100 : 0;
  
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !currentSong) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = Math.floor(percentage * currentSong.duration);
    setCurrentTime(newTime);
  };
  
  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeRef.current) return;
    const rect = volumeRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    setVolume(Math.max(0, Math.min(1, percentage)));
  };
  
  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;
  
  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  
  return (
    <>
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onCanPlay={handleCanPlay}
        preload="auto"
      />
      
      {/* Player UI */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-64 lg:left-72 h-20 glass-card border-t border-white/10 z-50">
        <div className="h-full px-4 flex items-center gap-4">
          {/* Song Info */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 sm:flex-initial sm:w-80">
            <img
              src={currentSong.coverUrl}
              alt={currentSong.title}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setShowLyrics(true)}
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm sm:text-base font-semibold text-foreground truncate">{currentSong.title}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{currentSong.artist}</p>
            </div>
            <button className="hidden sm:block text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0">
              <Heart className="w-5 h-5" />
            </button>
          </div>
          
          {/* Controls */}
          <div className="hidden sm:flex flex-col items-center gap-2 flex-1 max-w-2xl">
            <div className="flex items-center gap-4">
              {/* Shuffle */}
              <button
                onClick={toggleShuffle}
                className={`transition-colors ${
                  isShuffled 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </button>
              
              {/* Previous */}
              <button
                onClick={playPrevious}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Previous"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                disabled={!isReady}
                className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              
              {/* Next */}
              <button
                onClick={playNext}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Next"
              >
                <SkipForward className="w-5 h-5" />
              </button>
              
              {/* Repeat */}
              <button
                onClick={cycleRepeat}
                className={`transition-colors ${
                  repeatMode !== 'off' 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                <RepeatIcon className="w-4 h-4" />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-10 text-right">
                {formatDuration(currentTime)}
              </span>
              <div
                ref={progressRef}
                onClick={handleProgressClick}
                className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer group"
              >
                <div
                  className="h-full bg-gradient-primary rounded-full relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <span className="text-xs text-muted-foreground w-10">
                {formatDuration(currentSong.duration)}
              </span>
            </div>
          </div>
          
          {/* Mobile Play Button */}
          <button
            onClick={togglePlay}
            disabled={!isReady}
            className="sm:hidden w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 disabled:opacity-50"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          
          {/* Right Controls */}
          <div className="hidden lg:flex items-center gap-3 w-64">
            {/* Playback Speed */}
            <div className="relative group">
              <button className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                {playbackSpeed}x
              </button>
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
                <div className="bg-background border border-white/10 rounded-lg p-2 space-y-1">
                  {speedOptions.map(speed => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`block w-full px-3 py-1 text-sm rounded transition-colors ${
                        playbackSpeed === speed
                          ? 'bg-primary text-white'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Lyrics */}
            <button
              onClick={() => setShowLyrics(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Lyrics"
            >
              <FileText className="w-5 h-5" />
            </button>
            
            {/* Queue */}
            <button
              onClick={() => setShowQueue(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Queue"
            >
              <ListMusic className="w-5 h-5" />
            </button>
            
            {/* More Options */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="More"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              
              {showMoreMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowMoreMenu(false)}
                  />
                  <div className="absolute bottom-full right-0 mb-2 bg-background border border-white/10 rounded-lg p-2 space-y-1 min-w-[180px] z-50">
                    <button
                      onClick={() => {
                        setShowEqualizer(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-3 py-2 text-sm rounded hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      <Sliders className="w-4 h-4" />
                      Equalizer
                    </button>
                    <button
                      onClick={() => {
                        setShowSleepTimer(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-3 py-2 text-sm rounded hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      <Timer className="w-4 h-4" />
                      Sleep Timer
                      {sleepTimer && (
                        <span className="ml-auto text-xs text-primary">
                          {sleepTimer}m
                        </span>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
            
            {/* Volume */}
            <Volume2 className="w-5 h-5 text-muted-foreground" />
            <div
              ref={volumeRef}
              onClick={handleVolumeClick}
              className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer group"
            >
              <div
                className="h-full bg-gradient-primary rounded-full relative"
                style={{ width: `${volume * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Panels */}
      {showQueue && <QueuePanel onClose={() => setShowQueue(false)} />}
      {showSleepTimer && <SleepTimerPanel onClose={() => setShowSleepTimer(false)} />}
      {showEqualizer && <EqualizerPanel onClose={() => setShowEqualizer(false)} />}
      {showLyrics && <LyricsPanel onClose={() => setShowLyrics(false)} />}
    </>
  );
}
