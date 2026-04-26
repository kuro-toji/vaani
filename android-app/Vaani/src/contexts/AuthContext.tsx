import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, sendPhoneOtp, verifyPhoneOtp, signOut, getCurrentUser, onAuthStateChange } from '../services/supabase';
import { initDatabase, setSetting, getSetting } from '../database';
import { COLORS } from '../constants';

interface User {
  id: string;
  phone?: string;
  email?: string;
  preferred_lang: string;
  visual_mode: 'normal' | 'large_text' | 'traffic_light';
  haptic_enabled: boolean;
  slow_speech: boolean;
}

const DEFAULT_USER: Partial<User> = {
  preferred_lang: 'hi',
  visual_mode: 'normal',
  haptic_enabled: true,
  slow_speech: false,
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserSettings: (settings: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);

  // Initialize database and check auth
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize SQLite database
        await initDatabase();
        setDbReady(true);
        
        // Check for existing session
        const currentUser = await getCurrentUser();
        if (currentUser) {
          const settings = await loadUserSettings(currentUser.id);
          setUser({
            id: currentUser.id,
            phone: currentUser.phone || undefined,
            email: currentUser.email || undefined,
            ...DEFAULT_USER,
            ...settings,
          } as User);
        }
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, []);

  // Listen to auth changes
  useEffect(() => {
    if (!dbReady) return;
    
    const { data } = onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const settings = await loadUserSettings(session.user.id);
        setUser({
          id: session.user.id,
          phone: session.user.phone || undefined,
          email: session.user.email || undefined,
          ...DEFAULT_USER,
          ...settings,
        } as User);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });
    
    return () => {
      data.subscription.unsubscribe();
    };
  }, [dbReady]);

  const loadUserSettings = async (userId: string): Promise<Partial<User>> => {
    try {
      const lang = await getSetting(`user_${userId}_lang`) || 'hi';
      const visualMode = (await getSetting(`user_${userId}_visual_mode`) || 'normal') as User['visual_mode'];
      const haptic = await getSetting(`user_${userId}_haptic`) || 'true';
      const slowSpeech = await getSetting(`user_${userId}_slow_speech`) || 'false';
      
      return {
        preferred_lang: lang,
        visual_mode: visualMode,
        haptic_enabled: haptic === 'true',
        slow_speech: slowSpeech === 'true',
      };
    } catch (error) {
      return DEFAULT_USER;
    }
  };

  const login = useCallback(async (phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await sendPhoneOtp(phone);
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await verifyPhoneOtp(phone, otp);
      if (result.success) {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          const settings = await loadUserSettings(currentUser.id);
          setUser({
            id: currentUser.id,
            phone: currentUser.phone || undefined,
            email: currentUser.email || undefined,
            ...DEFAULT_USER,
            ...settings,
          } as User);
        }
      }
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const updateUserSettings = useCallback(async (settings: Partial<User>): Promise<void> => {
    if (!user) return;
    
    try {
      // Save to SQLite
      if (settings.preferred_lang) {
        await setSetting(`user_${user.id}_lang`, settings.preferred_lang);
      }
      if (settings.visual_mode) {
        await setSetting(`user_${user.id}_visual_mode`, settings.visual_mode);
      }
      if (settings.haptic_enabled !== undefined) {
        await setSetting(`user_${user.id}_haptic`, settings.haptic_enabled.toString());
      }
      if (settings.slow_speech !== undefined) {
        await setSetting(`user_${user.id}_slow_speech`, settings.slow_speech.toString());
      }
      
      // Update state
      setUser(prev => prev ? { ...prev, ...settings } : null);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    verifyOtp,
    logout,
    updateUserSettings,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
