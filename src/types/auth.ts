
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
  commissionBalance: number; // Saldo de comissões disponíveis
  pendingBalance: number;    // Saldo pendente de aprovação
  gerenteId?: string;        // Se for cambista, aponta para o gerente
  status: 'pending' | 'approved';
  createdAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
}
