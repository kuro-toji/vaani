import { createContext, useContext, useEffect, useState } from 'react';

// Test mode - completely disable Supabase for local testing
const TEST_MODE = true;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  // Start with loading=true to allow the effect to run first
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In test mode, simulate async load
    if (TEST_MODE) {
      // Keep loading=true briefly then set to false
      setTimeout(() => {
        setLoading(false);
      }, 50);
    }
  }, []);

  async function signInWithPhone(phone) {
    if (TEST_MODE) {
      console.log('[Test] OTP sent to', phone);
      return;
    }
  }

  async function verifyOTP(phone, token) {
    if (TEST_MODE) {
      console.log('[Test] Verified OTP for', phone);
      // Create mock user - use a consistent ID based on phone
      const mockUser = {
        id: 'test-user-' + phone.replace(/\D/g, '').slice(-8),
        phone: phone,
      };
      setUser(mockUser);
      setProfile({
        id: mockUser.id,
        preferred_lang: 'hi',
        vaani_score: 0,
      });
      return { user: mockUser };
    }
  }

  async function signInWithEmail(email) {
    if (TEST_MODE) {
      console.log('[Test] Email signin for', email);
    }
  }

  async function signOut() {
    setUser(null);
    setProfile(null);
  }

  async function updateProfile(updates) {
    setProfile(prev => ({ ...prev, ...updates }));
    return { ...profile, ...updates };
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