"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tenta recuperar o estado de mestre para evitar tela branca
    const checkAuth = () => {
      const isMaster = localStorage.getItem('is_master_admin') === 'true';
      const storedUser = localStorage.getItem('logged_user');
      
      if (isMaster) {
        // Se for master, garante que a Store tenha os dados para evitar tela branca
        if (!user || user.id !== 'admin-master') {
          setUser({
            id: 'admin-master',
            nome: 'Administrador LEOBET',
            email: 'admin@leobet.pro',
            role: 'admin',
            balance: 1000000,
            status: 'approved',
            createdAt: new Date().toISOString(),
          });
        }
        setLoading(false);
        return;
      }

      if (!user && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role === 'admin') {
          setUser(parsedUser);
          setLoading(false);
          return;
        }
      }

      if (!user || user.role !== 'admin') {
        router.push('/auth/login?role=admin');
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [user, router, setUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="font-black uppercase tracking-widest text-[10px]">Autenticando LEOBET PRO...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}