"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tenta recuperar do localStorage para evitar tela branca em refresh
    const checkAuth = () => {
      const isMaster = localStorage.getItem('is_master_admin') === 'true';
      
      if (!user && isMaster) {
        // Restaura usuário master na store se ele existir no storage
        setUser({
          id: 'admin-master',
          nome: 'Administrador LEOBET',
          email: 'admin@leobet.pro',
          role: 'admin',
          balance: 1000000,
          status: 'approved',
          createdAt: new Date().toISOString(),
        });
        setLoading(false);
        return;
      }

      if (!user || user.role !== 'admin') {
        if (!isMaster) {
          router.push('/auth/login?role=admin');
        } else {
          setLoading(false);
        }
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