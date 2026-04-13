"use client"

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const checkAuth = () => {
      const storedUser = localStorage.getItem('logged_user');
      
      let currentUser = user;
      if (!currentUser && storedUser) {
        try {
          currentUser = JSON.parse(storedUser);
          if (currentUser) setUser(currentUser);
        } catch (e) {
          console.error("Erro ao ler sessão local");
        }
      }

      if (!currentUser) {
        router.replace('/auth/login?role=admin');
        return;
      }

      // PERMISSÃO ESPECIAL: ADMIN MASTER ou ROLE ADMIN
      if (currentUser.id === 'MASTER-ADMIN' || currentUser.role === 'admin') {
        setLoading(false);
        return;
      }

      // Rotas que outros cargos podem acessar (Venda, Relatórios, etc)
      const isSharedRoute = pathname.includes('/admin/venda') || 
                            pathname.includes('/relatorios') || 
                            pathname.includes('/perfil') || 
                            pathname.includes('/resultados');
      
      if (!isSharedRoute) {
        router.replace(`/${currentUser.role}/dashboard`);
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [user, router, setUser, mounted, pathname]);

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="font-black uppercase tracking-widest text-[10px]">Validando Acesso Seguro...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
