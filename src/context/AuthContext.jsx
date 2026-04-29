import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

// Development mode - instant login without real Supabase
const DEV_MODE = import.meta.env.VITE_DEV_AUTH === 'true';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user session on mount
  useEffect(() => {
    async function initAuth() {
      // DEV_MODE: Skip Supabase, create mock user immediately
      if (DEV_MODE) {
        console.log('[DEV_MODE] Skipping Supabase auth, creating mock user');
        const mockUser = {
          id: 'dev-user-001',
          email: 'dev@vaani.app',
          created_at: new Date().toISOString(),
        };
        setUser(mockUser);
        setProfile({
          id: mockUser.id,
          preferred_lang: 'hi',
          vaani_score: 0,
        });
        setLoading(false);
        return;
      }
      
      // Real Supabase flow
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setLoading(false);
      }
    }

    initAuth();

    // Only listen for auth changes in production (Supabase connected)
    if (DEV_MODE) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    if (DEV_MODE) return; // No profile loading in dev mode

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setProfile(data);
      } else if (error?.code === 'PGRST116') {
        const newProfile = {
          id: userId,
          preferred_lang: 'hi',
          vaani_score: 0,
        };
        
        const { data: created } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();
        
        if (created) {
          setProfile(created);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  async function signInWithPhone(phone) {
    if (DEV_MODE) {
      console.log('[DEV MODE] OTP requested for:', phone);
      return { message: 'OTP sent (mock)' };
    }
    
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        channel: 'whatsapp',
      },
    });
    
    if (error) throw error;
    return data;
  }

  async function verifyOTP(email, token) {
    // DEV_MODE: Accept any OTP, create mock user
    if (DEV_MODE) {
      console.log('[DEV_MODE] OTP verified, creating mock user');
      
      const mockUser = {
        id: 'dev-user-' + btoa(email || 'default').replace(/[^a-zA-Z0-9]/g, '').slice(-8),
        email: email || 'dev@vaani.app',
        created_at: new Date().toISOString(),
      };
      
      setUser(mockUser);
      setProfile({
        id: mockUser.id,
        preferred_lang: 'hi',
        vaani_score: 0,
      });
      
      return { user: mockUser };
    }
    
    // Real Supabase flow
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: token,
      type: 'email',
    });
    
    if (error) throw error;
    
    if (data.user) {
      await loadProfile(data.user.id);
    }
    
    return data;
  }

  async function signInWithEmail(email) {
    if (DEV_MODE) {
      return { message: 'OTP sent (mock)' };
    }
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
    });
    
    if (error) throw error;
    return data;
  }

  async function signOut() {
    if (DEV_MODE) {
      setUser(null);
      setProfile(null);
      return;
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
  }

  async function updateProfile(updates) {
    if (DEV_MODE) {
      setProfile(prev => ({ ...prev, ...updates }));
      return profile;
    }
    
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    
    if (data) {
      setProfile(data);
    }
    
    if (error) throw error;
    return data;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithPhone,
        verifyOTP,
        signInWithEmail,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}