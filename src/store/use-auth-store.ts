
import { create } from 'zustand';
import { UserProfile } from '@/types/auth';

interface AuthStore {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: {
    id: 'admin-master',
    nome: 'Administrador LEOBET',
    email: 'admin@leobet.pro',
    role: 'admin',
    balance: 999999999, // Saldo ilimitado para Admin
    commissionBalance: 0,
    pendingBalance: 0,
    status: 'approved',
    createdAt: new Date().toISOString(),
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('is_master_admin');
    localStorage.removeItem('logged_user');
    set({ user: null });
  },
}));
