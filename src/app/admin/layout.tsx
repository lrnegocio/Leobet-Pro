"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkAuth = () => {
      const isMaster = localStorage.getItem('is_master_admin') === 'true';
      const storedUser = localStorage.getItem('logged_user');
      
      // Se for o acesso master, reconstrói o objeto de forma segura
      if (isMaster) {
        if (!user) {
          setUser({
            id: 'admin-master',
            nome: 'Administrador LEOBET',
            email: 'admin@leobet.pro',
            role: 'admin',
            balance: 1000000,
            commissionBalance: 0,
            pendingBalance: 0,
            status: 'approved',
            createdAt: new Date().toISOString(),
          });
        }
        setLoading(false);
        return;
      }

      if (!user && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setLoading(false);
          return;
        } catch (e) {
          console.error("Auth sync error");
        }
      }

      if (!user && !isMaster && !storedUser) {
        router.push('/auth/login');
      } else if (user && !['admin', 'cambista', 'gerente'].includes(user.role)) {
        router.push('/');
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [user, router, setUser]);

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="font-black uppercase tracking-widest text-[10px]">Protegendo sua Conexão...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
