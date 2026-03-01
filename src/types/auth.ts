
export type UserRole = 'admin' | 'cambista' | 'cliente';

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  rg?: string;
  cpf?: string;
  birthDate?: string;
  pixKey?: string;
  phone?: string;
  balance: number;
  status: 'pending' | 'approved';
  createdAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
}
