import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Mock user for V1.0
const mockUser: User = {
  id: 'user-1',
  username: 'MusicLover23',
  email: 'user@example.com',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
  bio: 'Music enthusiast | R&B & Hip-Hop lover | Always discovering new sounds 🎵',
  joinedDate: '2024-01-15',
  followers: 1234,
  following: 567,
};

export const useAuthStore = create<AuthState>((set) => ({
  user: localStorage.getItem('isLoggedIn') === 'true' ? mockUser : null,
  isAuthenticated: localStorage.getItem('isLoggedIn') === 'true',
  
  login: async (email: string, password: string) => {
    // Mock login - in V1.0 we just set the user
    await new Promise(resolve => setTimeout(resolve, 1000));
    localStorage.setItem('isLoggedIn', 'true');
    set({ user: mockUser, isAuthenticated: true });
  },
  
  signup: async (username: string, email: string, password: string) => {
    // Mock signup
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newUser = { ...mockUser, username, email };
    localStorage.setItem('isLoggedIn', 'true');
    set({ user: newUser, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('isLoggedIn');
    set({ user: null, isAuthenticated: false });
  },
}));
