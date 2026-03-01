import { create } from 'zustand';
import { supabase } from '@/supabase/client';
import { signIn, signUp, signOut, getCurrentUser } from '@/supabase/auth';

interface AuthStore {
  user: any | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => {
  // Listen to auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      set({ user: session.user, loading: false });
    } else {
      set({ user: null, loading: false });
    }
  });

  return {
    user: null,
    loading: true,
    error: null,

    login: async (email: string, password: string) => {
      try {
        set({ loading: true, error: null });
        await signIn(email, password);
        const user = await getCurrentUser();
        set({ user, loading: false });
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    register: async (email: string, password: string) => {
      try {
        set({ loading: true, error: null });
        await signUp(email, password);
        set({ loading: false });
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    logout: async () => {
      try {
        set({ loading: true });
        await signOut();
        set({ user: null, loading: false });
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    checkAuth: async () => {
      try {
        const user = await getCurrentUser();
        set({ user, loading: false });
      } catch (error: any) {
        set({ error: error.message, loading: false });
      }
    },
  };
});
