
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
  Users,
  Home,
  UserCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Início', href: '/', icon: <Home className="w-5 h-5" />, roles: ['admin', 'cambista', 'gerente', 'cliente'] },
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['admin'] },
  { label: 'Meu Painel', href: '/gerente/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['gerente'] },
  { label: 'Meus Cambistas', href: '/gerente/cambistas', icon: <Users className="w-5 h-5" />, roles: ['gerente'] },
  { label: 'Meu Painel', href: '/cambista/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['cambista'] },
  { label: 'Área do Apostador', href: '/cliente/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['cliente'] },
  { label: 'Terminal Vendas', href: '/admin/venda', icon: <ShoppingCart className="w-5 h-5" />, roles: ['admin', 'cambista', 'gerente'] },
  { label: 'Conferir Bilhete', href: '/resultados', icon: <Search className="w-5 h-5" />, roles: ['admin', 'cambista', 'gerente', 'cliente'] },
  { label: 'Meu Perfil', href: '/perfil', icon: <UserCircle className="w-5 h-5" />, roles: ['admin', 'cambista', 'gerente', 'cliente'] },
  { label: 'Gestão Bingos', href: '/admin/bingo', icon: <Grid3X3 className="w-5 h-5" />, roles: ['admin'] },
  { label: 'Gestão Bolões', href: '/admin/bolao', icon: <Trophy className="w-5 h-5" />, roles: ['admin'] },
  { label: 'Financeiro Master', href: '/admin/financeiro', icon: <Wallet className="w-5 h-5" />, roles: ['admin'] },
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
    <div className="w-64 bg-white border-r h-full flex flex-col shadow-2xl z-20">
      <div className="p-8 border-b bg-primary text-white">
        <h2 className="text-2xl font-black font-headline tracking-tighter">LEOBET PRO</h2>
        <div className="flex items-center gap-2 mt-2">
           <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
           <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{user.role}</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all uppercase tracking-tight",
              pathname === item.href 
                ? "bg-primary text-white shadow-lg scale-105" 
                : "text-muted-foreground hover:bg-muted hover:text-primary"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t bg-muted/30">
        <div className="bg-white p-4 rounded-2xl shadow-sm border mb-4">
           <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Logado como</p>
           <p className="text-xs font-black text-primary truncate">{user.nome}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-black text-destructive hover:bg-destructive/10 transition-colors uppercase"
        >
          <LogOut className="w-5 h-5" />
          Sair do Sistema
        </button>
      </div>
    </div>
  );
}
