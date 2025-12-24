import { create } from 'zustand';
import { Song } from '../types';

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
  
  play: (song) => {
    set({ currentSong: song, isPlaying: true, currentTime: 0 });
    // Add to listening history
    const history = JSON.parse(localStorage.getItem('listeningHistory') || '[]');
    history.push({
      songId: song.id,
      playedAt: new Date().toISOString(),
      duration: 0,
    });
    localStorage.setItem('listeningHistory', JSON.stringify(history));
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
      set({ currentSong: nextSong, queue: restQueue, isPlaying: true, currentTime: 0 });
    }
  },
  
  playPrevious: () => {
    set({ currentTime: 0 });
  },
}));
