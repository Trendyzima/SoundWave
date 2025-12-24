import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Database types
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          username: string | null;
          email: string;
        };
      };
      songs: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          artist: string;
          album: string | null;
          genre: string | null;
          duration: number;
          audio_url: string;
          cover_url: string | null;
          release_date: string | null;
          plays: number;
          likes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          artist: string;
          album?: string | null;
          genre?: string | null;
          duration: number;
          audio_url: string;
          cover_url?: string | null;
          release_date?: string | null;
          plays?: number;
          likes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      playlists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          cover_url: string | null;
          is_public: boolean;
          is_ai_generated: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      comments: {
        Row: {
          id: string;
          song_id: string;
          user_id: string;
          parent_id: string | null;
          content: string;
          likes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          song_id: string;
          user_id: string;
          parent_id?: string | null;
          content: string;
          likes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      listening_history: {
        Row: {
          id: string;
          user_id: string;
          song_id: string;
          played_at: string;
          duration_listened: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          song_id: string;
          played_at?: string;
          duration_listened?: number;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          song_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          song_id: string;
          created_at?: string;
        };
      };
    };
  };
};
