'use client';

import React, { useState, useEffect } from 'react';
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
  UserCircle,
  FileText,
  Menu,
  ChevronLeft,
  ChevronRight,
  Settings as SettingsIcon
} from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { label: 'Terminal Vendas', href: '/admin/venda', icon: ShoppingCart, roles: ['admin', 'cambista', 'gerente'] },
  { label: 'Relatórios', href: '/relatorios', icon: FileText, roles: ['admin', 'cambista', 'gerente', 'cliente'] },
  { label: 'Conferir Bilhete', href: '/resultados', icon: Search, roles: ['admin', 'cambista', 'gerente', 'cliente'] },
  { label: 'Gestão Bingos', href: '/admin/bingo', icon: Grid3X3, roles: ['admin'] },
  { label: 'Gestão Bolões', href: '/admin/bolao', icon: Trophy, roles: ['admin'] },
  { label: 'Financeiro Master', href: '/admin/financeiro', icon: Wallet, roles: ['admin'] },
  { label: 'Configurações', href: '/admin/settings', icon: SettingsIcon, roles: ['admin'] },
  { label: 'Meu Perfil', href: '/perfil', icon: UserCircle, roles: ['admin', 'cambista', 'gerente', 'cliente'] },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('leobet_sidebar_collapsed');
    if (saved === 'true') setIsCollapsed(true);
  }, []);

  if (!mounted || !user) return null;

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('leobet_sidebar_collapsed', String(newState));
  };

  const filteredItems = navItems.filter(item => item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const NavContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex flex-col h-full bg-white transition-all duration-300 relative border-r">
      <div className={cn(
        "bg-primary text-white transition-all duration-300 flex flex-col shrink-0 overflow-hidden",
        collapsed ? "p-4 items-center justify-center h-20" : "p-6 h-24"
      )}>
        <h2 className={cn(
          "font-black tracking-tighter transition-all duration-300 leading-none whitespace-nowrap",
          collapsed ? "text-xl" : "text-2xl"
        )}>
          {collapsed ? "LB" : "LEOBET PRO"}
        </h2>
        {!collapsed && (
          <div className="flex items-center gap-2 mt-2">
             <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-70 truncate">{user.role}</p>
          </div>
        )}
      </div>
      
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        <TooltipProvider delayDuration={0}>
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-black transition-all uppercase tracking-tight relative group",
                      isActive 
                        ? "bg-primary text-white shadow-lg" 
                        : "text-muted-foreground hover:bg-muted",
                      collapsed ? "px-0 justify-center h-12 w-12 mx-auto" : ""
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="font-black uppercase text-[10px] bg-primary text-white border-none z-[100]">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>

      <div className="p-3 border-t bg-muted/30 shrink-0">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-4 py-4 w-full rounded-xl text-sm font-black text-destructive hover:bg-destructive/10 transition-colors uppercase",
            collapsed ? "px-0 justify-center h-12 w-12 mx-auto" : ""
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>

      {/* Seta de controle centralizada verticalmente */}
      <button 
        onClick={toggleCollapse}
        type="button"
        className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 bg-white border-2 border-primary/20 text-primary w-8 h-8 rounded-full items-center justify-center shadow-xl hover:bg-primary hover:text-white transition-all z-[60]"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <>
      <div className="md:hidden fixed top-4 left-4 z-50 print:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="default" size="icon" className="h-12 w-12 rounded-2xl shadow-xl bg-primary">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-none">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      <aside className={cn(
        "hidden md:flex h-screen flex-col z-20 shrink-0 transition-all duration-300 ease-in-out relative bg-white print:hidden",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <NavContent collapsed={isCollapsed} />
      </aside>
    </>
  );
}
