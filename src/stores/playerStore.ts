import { create } from 'zustand';
import { Song } from '../types';
import { supabase } from '../lib/supabase';

type RepeatMode = 'off' | 'one' | 'all';

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  originalQueue: Song[]; // For shuffle
  currentTime: number;
  volume: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  currentIndex: number;
  playbackSpeed: number;
  crossfadeEnabled: boolean;
  crossfadeDuration: number;
  sleepTimer: number | null; // Minutes remaining
  equalizer: {
    enabled: boolean;
    preset: string;
    bass: number;
    mid: number;
    treble: number;
  };
  showMiniPlayer: boolean;
  showLyrics: boolean;
  showQueue: boolean;
  audioQuality: 'low' | 'normal' | 'high' | 'lossless';
  dataSaverMode: boolean;
  play: (song: Song, newQueue?: Song[]) => void;
  pause: () => void;
  togglePlay: () => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  handleSongEnd: () => void;
  clearQueue: () => void;
  setPlaybackSpeed: (speed: number) => void;
  toggleCrossfade: () => void;
  setCrossfadeDuration: (duration: number) => void;
  setSleepTimer: (minutes: number | null) => void;
  setEqualizer: (settings: Partial<PlayerState['equalizer']>) => void;
  toggleMiniPlayer: () => void;
  toggleLyrics: () => void;
  toggleQueue: () => void;
  setAudioQuality: (quality: PlayerState['audioQuality']) => void;
  toggleDataSaver: () => void;
}

// Shuffle array helper
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  queue: [],
  originalQueue: [],
  currentTime: 0,
  volume: 0.7,
  isShuffled: false,
  repeatMode: 'off',
  currentIndex: 0,
  playbackSpeed: 1.0,
  crossfadeEnabled: false,
  crossfadeDuration: 5,
  sleepTimer: null,
  equalizer: {
    enabled: false,
    preset: 'flat',
    bass: 0,
    mid: 0,
    treble: 0,
  },
  showMiniPlayer: false,
  showLyrics: false,
  showQueue: false,
  audioQuality: 'normal',
  dataSaverMode: false,
  
  play: async (song, newQueue) => {
    const state = get();
    
    // If new queue provided, set it up
    if (newQueue) {
      const queue = state.isShuffled ? shuffleArray(newQueue) : newQueue;
      const index = queue.findIndex(s => s.id === song.id);
      
      set({ 
        currentSong: song, 
        isPlaying: true, 
        currentTime: 0,
        queue,
        originalQueue: newQueue,
        currentIndex: index >= 0 ? index : 0,
      });
    } else {
      set({ 
        currentSong: song, 
        isPlaying: true, 
        currentTime: 0,
      });
    }
    
    // Track play in listening history (if user is logged in)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('listening_history').insert({
          user_id: user.id,
          song_id: song.id,
          duration_listened: 0,
        });
        
        // Update play count
        await supabase
          .from('songs')
          .update({ plays: song.plays + 1 })
          .eq('id', song.id);
      }
    } catch (error) {
      console.error('Error tracking play:', error);
    }
  },
  
  pause: () => set({ isPlaying: false }),
  
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  setCurrentTime: (time) => set({ currentTime: time }),
  
  setVolume: (volume) => set({ volume }),
  
  addToQueue: (song) => set((state) => ({ 
    queue: [...state.queue, song],
    originalQueue: [...state.originalQueue, song],
  })),
  
  removeFromQueue: (index) => set((state) => {
    const newQueue = [...state.queue];
    newQueue.splice(index, 1);
    
    const newOriginalQueue = [...state.originalQueue];
    const originalIndex = newOriginalQueue.findIndex(s => s.id === state.queue[index].id);
    if (originalIndex >= 0) {
      newOriginalQueue.splice(originalIndex, 1);
    }
    
    return { 
      queue: newQueue,
      originalQueue: newOriginalQueue,
      currentIndex: index < state.currentIndex ? state.currentIndex - 1 : state.currentIndex,
    };
  }),
  
  reorderQueue: (fromIndex, toIndex) => set((state) => {
    const newQueue = [...state.queue];
    const [removed] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, removed);
    
    return { 
      queue: newQueue,
      currentIndex: fromIndex === state.currentIndex ? toIndex : state.currentIndex,
    };
  }),
  
  playNext: () => {
    const { queue, currentIndex, repeatMode } = get();
    
    if (queue.length === 0) return;
    
    let nextIndex = currentIndex + 1;
    
    // Handle repeat all - loop back to start
    if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        // End of queue, stop playing
        set({ isPlaying: false });
        return;
      }
    }
    
    const nextSong = queue[nextIndex];
    if (nextSong) {
      get().play(nextSong);
      set({ currentIndex: nextIndex });
    }
  },
  
  playPrevious: () => {
    const { queue, currentIndex, currentTime } = get();
    
    // If more than 3 seconds into song, restart it
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }
    
    // Otherwise go to previous song
    if (currentIndex > 0) {
      const prevSong = queue[currentIndex - 1];
      if (prevSong) {
        get().play(prevSong);
        set({ currentIndex: currentIndex - 1 });
      }
    } else {
      // At start of queue, restart current song
      set({ currentTime: 0 });
    }
  },
  
  toggleShuffle: () => {
    const { isShuffled, originalQueue, currentSong } = get();
    
    if (isShuffled) {
      // Turn off shuffle - restore original order
      const index = originalQueue.findIndex(s => s.id === currentSong?.id);
      set({ 
        isShuffled: false, 
        queue: originalQueue,
        currentIndex: index >= 0 ? index : 0,
      });
    } else {
      // Turn on shuffle
      const shuffled = shuffleArray(originalQueue);
      const index = shuffled.findIndex(s => s.id === currentSong?.id);
      set({ 
        isShuffled: true, 
        queue: shuffled,
        currentIndex: index >= 0 ? index : 0,
      });
    }
  },
  
  cycleRepeat: () => {
    const { repeatMode } = get();
    const modes: RepeatMode[] = ['off', 'one', 'all'];
    const currentModeIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    set({ repeatMode: nextMode });
  },
  
  handleSongEnd: () => {
    const { repeatMode } = get();
    
    if (repeatMode === 'one') {
      // Repeat current song
      set({ currentTime: 0, isPlaying: true });
    } else {
      // Play next song
      get().playNext();
    }
  },
  
  clearQueue: () => {
    set({ 
      queue: [], 
      originalQueue: [],
      currentIndex: 0,
    });
  },
  
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  
  toggleCrossfade: () => set((state) => ({ crossfadeEnabled: !state.crossfadeEnabled })),
  
  setCrossfadeDuration: (duration) => set({ crossfadeDuration: duration }),
  
  setSleepTimer: (minutes) => set({ sleepTimer: minutes }),
  
  setEqualizer: (settings) => set((state) => ({
    equalizer: { ...state.equalizer, ...settings },
  })),
  
  toggleMiniPlayer: () => set((state) => ({ showMiniPlayer: !state.showMiniPlayer })),
  
  toggleLyrics: () => set((state) => ({ showLyrics: !state.showLyrics })),
  
  toggleQueue: () => set((state) => ({ showQueue: !state.showQueue })),
  
  setAudioQuality: (quality) => set({ audioQuality: quality }),
  
  toggleDataSaver: () => set((state) => ({ dataSaverMode: !state.dataSaverMode })),
}));
