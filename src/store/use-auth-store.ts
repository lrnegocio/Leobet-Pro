import { create } from 'zustand';
import { UserProfile } from '@/types/auth';

interface AuthStore {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  // Iniciamos como null para não expor estruturas de dados a scrapers no bundle inicial
  user: null,
  setUser: (user) => set({ user }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('is_master_admin');
      localStorage.removeItem('logged_user');
    }
    set({ user: null });
  },
}));
