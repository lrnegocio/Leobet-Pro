
"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Trophy, 
  Grid3X3, 
  LogOut,
  Wallet,
  Search,
  ShoppingCart,
  Users
} from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['admin'] },
  { label: 'Meu Painel', href: '/gerente/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['gerente'] },
  { label: 'Vendas', href: '/cambista/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['cambista'] },
  { label: 'Meus Cambistas', href: '/gerente/cambistas', icon: <Users className="w-5 h-5" />, roles: ['gerente'] },
  { label: 'Terminal Vendas', href: '/admin/venda', icon: <ShoppingCart className="w-5 h-5" />, roles: ['admin', 'cambista', 'gerente'] },
  { label: 'Conferir Bilhete', href: '/resultados', icon: <Search className="w-5 h-5" />, roles: ['admin', 'cambista', 'gerente', 'cliente'] },
  { label: 'Bingo', href: '/admin/bingo', icon: <Grid3X3 className="w-5 h-5" />, roles: ['admin'] },
  { label: 'Bolão', href: '/admin/bolao', icon: <Trophy className="w-5 h-5" />, roles: ['admin'] },
  { label: 'Financeiro', href: '/admin/financeiro', icon: <Wallet className="w-5 h-5" />, roles: ['admin'] },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const filteredItems = navItems.filter(item => item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="w-64 bg-white border-r h-full flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-primary font-headline">LEOBET PRO</h2>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{user.role}</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              pathname === item.href 
                ? "bg-primary text-white" 
                : "text-muted-foreground hover:bg-muted hover:text-primary"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </div>
  );
}
