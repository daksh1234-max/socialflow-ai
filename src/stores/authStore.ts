import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  ai_credits: number;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isInitialized: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setInitialized: (isInitialized: boolean) => void;
  decrementCreditsLocally: () => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isInitialized: false,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  decrementCreditsLocally: () => set((state) => ({ 
    profile: state.profile ? { ...state.profile, ai_credits: Math.max(0, state.profile.ai_credits - 1) } : null 
  })),
  signOut: () => set({ session: null, user: null, profile: null }),
}));
