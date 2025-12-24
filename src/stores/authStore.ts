import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  
  login: (user) => set({ user, isAuthenticated: true, loading: false }),
  
  logout: () => set({ user: null, isAuthenticated: false, loading: false }),
  
  setLoading: (loading) => set({ loading }),
}));

// Auth hook for components
export const useAuth = () => {
  const { user, isAuthenticated, loading, logout } = useAuthStore();
  return { user, isAuthenticated, loading, logout };
};
