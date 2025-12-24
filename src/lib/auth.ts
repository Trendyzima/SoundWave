import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { User as AuthUser } from '../types';

export class AuthService {
  // Map Supabase user to app user (synchronous, no DB queries)
  mapUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email!,
      username: user.user_metadata?.username || user.email!.split('@')[0],
      avatarUrl: user.user_metadata?.avatar_url || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop`,
      bio: user.user_metadata?.bio || '',
      joinedDate: user.created_at,
      followers: 0,
      following: 0,
    };
  }

  // Send OTP to email
  async sendOtp(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  }

  // Verify OTP and set password + username
  async verifyOtpAndSetPassword(email: string, token: string, password: string, username?: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw error;

    const finalUsername = username || email.split('@')[0];
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password,
      data: { username: finalUsername },
    });
    if (updateError) throw updateError;

    return updateData.user!;
  }

  // Sign in with email and password
  async signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  }

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
}

export const authService = new AuthService();
