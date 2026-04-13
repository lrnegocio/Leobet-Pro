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

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;

    const checkAuth = () => {
      const storedUser = localStorage.getItem('logged_user');
      let currentUser = user;

      if (!currentUser && storedUser) {
        try {
          currentUser = JSON.parse(storedUser);
          if (currentUser) setUser(currentUser);
        } catch (e) { console.error("Erro sessão"); }
      }

      if (!currentUser) {
        router.replace('/auth/login?role=admin');
        return;
      }

      // REGRA DE OURO: Somente Admin ou Master entra aqui.
      const isMaster = currentUser.id === 'MASTER-ADMIN' || currentUser.email === 'lrnegocio0@leobet.pro';
      const isAdmin = currentUser.role === 'admin';

      if (isMaster || isAdmin) {
        setLoading(false);
        return;
      }

      // Cambistas e Gerentes só podem acessar a tela de VENDA se ela estiver no admin
      if (pathname === '/admin/venda') {
        setLoading(false);
        return;
      }

      // Bloqueio Total: Expulsa para o dashboard correto
      router.replace(`/${currentUser.role}/dashboard`);
    };

    checkAuth();
  }, [user, router, setUser, mounted, pathname]);

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="font-black uppercase tracking-widest text-[10px]">Validando Acesso Master...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
