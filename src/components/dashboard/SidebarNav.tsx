
"use client"

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
  Users,
  UserCircle,
  FileText,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['admin'] },
  { label: 'Meu Painel', href: '/gerente/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['gerente'] },
  { label: 'Minha Rede', href: '/gerente/cambistas', icon: <Users className="w-5 h-5" />, roles: ['gerente'] },
  { label: 'Meu Painel', href: '/cambista/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['cambista'] },
  { label: 'Área do Apostador', href: '/cliente/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['cliente'] },
  { label: 'Terminal Vendas', href: '/admin/venda', icon: <ShoppingCart className="w-5 h-5" />, roles: ['admin', 'cambista', 'gerente'] },
  { label: 'Relatórios', href: '/relatorios', icon: <FileText className="w-5 h-5" />, roles: ['admin', 'cambista', 'gerente', 'cliente'] },
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
  const [open, setOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Persistir estado do menu no PC
  useEffect(() => {
    const saved = localStorage.getItem('leobet_sidebar_collapsed');
    if (saved === 'true') setIsCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('leobet_sidebar_collapsed', String(newState));
  };

  if (!user) return null;

  const filteredItems = navItems.filter(item => item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const NavContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex flex-col h-full bg-white transition-all duration-300">
      <div className={cn(
        "p-6 border-b bg-primary text-white transition-all duration-300 flex flex-col shrink-0",
        collapsed ? "p-4 items-center justify-center" : "p-6"
      )}>
        <h2 className={cn(
          "font-black font-headline tracking-tighter transition-all duration-300 leading-none",
          collapsed ? "text-xl" : "text-2xl"
        )}>
          {collapsed ? "LB" : "LEOBET PRO"}
        </h2>
        {!collapsed && (
          <div className="flex items-center gap-2 mt-2">
             <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{user.role}</p>
          </div>
        )}
      </div>
      
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        <TooltipProvider delayDuration={0}>
          {filteredItems.map((item) => (
            <Tooltip key={item.href} disableHoverableContent={!collapsed}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-black transition-all uppercase tracking-tight relative group",
                    pathname === item.href 
                      ? "bg-primary text-white shadow-lg" 
                      : "text-muted-foreground hover:bg-muted",
                    collapsed ? "px-0 justify-center h-12 w-12 mx-auto" : ""
                  )}
                >
                  <div className="shrink-0">{item.icon}</div>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-black uppercase text-[10px] bg-primary">
                {item.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>

      <div className="p-3 border-t bg-muted/30 shrink-0 space-y-2">
        <TooltipProvider delayDuration={0}>
          <Tooltip disableHoverableContent={!collapsed}>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            <TooltipContent side="right" className="font-black uppercase text-[10px] bg-destructive text-white">
              Sair do Sistema
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Toggle Button for Desktop/Tablet */}
        <button 
          onClick={toggleCollapse}
          className="hidden md:flex items-center justify-center w-full h-10 text-muted-foreground hover:text-primary transition-colors bg-white/50 rounded-xl border border-dashed border-muted-foreground/20"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Trigger - Escondido em telas maiores que MD (768px) */}
      <div className="md:hidden fixed top-4 left-4 z-50">
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

      {/* Desktop/Tablet Sidebar - Ocupa menos espaço se estiver 'collapsed' */}
      <div className={cn(
        "hidden md:flex border-r h-full flex-col shadow-2xl z-20 shrink-0 transition-all duration-300 bg-white ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <NavContent collapsed={isCollapsed} />
      </div>
    </>
  );
}
