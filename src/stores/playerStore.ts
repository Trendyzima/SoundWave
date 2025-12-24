import { create } from 'zustand';
import { Song } from '../types';
import { supabase } from '../lib/supabase';

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  currentTime: number;
  volume: number;
  play: (song: Song) => void;
  pause: () => void;
  togglePlay: () => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  addToQueue: (song: Song) => void;
  playNext: () => void;
  playPrevious: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  queue: [],
  currentTime: 0,
  volume: 0.7,
  
  play: async (song) => {
    set({ currentSong: song, isPlaying: true, currentTime: 0 });
    
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
  
  addToQueue: (song) => set((state) => ({ queue: [...state.queue, song] })),
  
  playNext: () => {
    const { queue } = get();
    if (queue.length > 0) {
      const [nextSong, ...restQueue] = queue;
      get().play(nextSong);
      set({ queue: restQueue });
    }
  },
  
  playPrevious: () => {
    set({ currentTime: 0 });
  },
}));
