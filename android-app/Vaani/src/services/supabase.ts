import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { COLORS, API_CONFIG } from '../constants';

// Create Supabase client
export const supabase = createClient(
  API_CONFIG.SUPABASE_URL,
  API_CONFIG.SUPABASE_ANON_KEY,
  {
    auth: {
      storage: {
        getItem: (key: string) => SecureStore.getItemAsync(key),
        setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Auth types
export interface AuthState {
  user: User | null;
  session: any;
  loading: boolean;
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
  user_metadata?: {
    preferred_lang?: string;
    visual_mode?: string;
    haptic_enabled?: boolean;
    slow_speech?: boolean;
  };
}

// Phone OTP Auth
export async function sendPhoneOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      phone: `+91${phone}`,
    });
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function verifyPhoneOtp(phone: string, token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.verifyOtp({
      phone: `+91${phone}`,
      token: token,
      type: 'sms',
    });
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Email Auth
export async function signInWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Sign out
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// Get current session
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Get current user
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// Update user profile
export async function updateProfile(updates: Partial<User['user_metadata']>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      data: updates,
    });
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Listen to auth changes
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
