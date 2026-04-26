import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

// Development mode - accepts any 6-digit OTP without SMS
const DEV_MODE = import.meta.env.VITE_DEV_AUTH === 'true';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user session on mount
  useEffect(() => {
    async function initAuth() {
      try {
        // Get current session
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

    // Listen for auth changes
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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setProfile(data);
      } else if (error?.code === 'PGRST116') {
        // Profile doesn't exist, create one
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
    
    // Format phone number with +91 prefix
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        channel: 'sms',
      },
    });
    
    if (error) throw error;
    return data;
  }

  async function verifyOTP(phone, token) {
    // Development mode - accept any 6-digit OTP
    if (DEV_MODE) {
      console.log('[DEV MODE] OTP verified for:', phone, 'Token:', token);
      
      // Create a mock user for development
      const mockUser = {
        id: 'dev-user-' + phone.replace(/\D/g, '').slice(-8),
        phone: phone,
        email: null,
        created_at: new Date().toISOString(),
      };
      
      // Sign in with mock user
      const { data, error } = await supabase.auth.updateUser({
        data: { phone: phone }
      }).then(async ({ data: updateData }) => {
        // Try to get existing user or create session
        const { data: sessionData } = await supabase.auth.getSession();
        return { data: sessionData };
      }).catch(async () => {
        // If update fails, try to sign in anonymously
        const { data: anonData } = await supabase.auth.signInAnonymously().catch(() => null);
        if (anonData?.user) {
          // Update the anonymous user with phone
          const { data: updated } = await supabase.auth.updateUser({
            data: { phone: phone }
          });
          return { data: updated };
        }
        return { data: null };
      });
      
      // For development, just create a mock user and profile
      setUser(mockUser);
      setProfile({
        id: mockUser.id,
        preferred_lang: 'hi',
        vaani_score: 0,
      });
      
      return { user: mockUser };
    }
    
    // Format phone number with +91 prefix
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: token,
      type: 'sms',
    });
    
    if (error) throw error;
    
    // Load profile after successful verification
    if (data.user) {
      await loadProfile(data.user.id);
    }
    
    return data;
  }

  async function signInWithEmail(email) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
    });
    
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
  }

  async function updateProfile(updates) {
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
