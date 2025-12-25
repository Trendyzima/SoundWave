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
  play: (song: Song, newQueue?: Song[]) => void;
  pause: () => void;
  togglePlay: () => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  addToQueue: (song: Song) => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  handleSongEnd: () => void;
  clearQueue: () => void;
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
    const { repeatMode, queue, currentIndex } = get();
    
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
}));
