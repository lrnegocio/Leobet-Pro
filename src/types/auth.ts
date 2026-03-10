
export type UserRole = 'admin' | 'gerente' | 'cambista' | 'cliente';

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
  commissionBalance: number; 
  pendingBalance: number;    
  gerenteId?: string;        // ID do Gerente ao qual o cambista pertence
  status: 'pending' | 'approved';
  createdAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
}
