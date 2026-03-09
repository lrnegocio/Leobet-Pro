
"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se o usuário na store é admin
    if (!user || user.role !== 'admin') {
      // Se não estiver na store, verifica o master login no localStorage como fallback de sessão
      const isMaster = localStorage.getItem('is_master_admin') === 'true';
      if (!isMaster) {
        router.push('/auth/login?role=admin');
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="font-black uppercase tracking-widest text-xs">Autenticando LEOBET PRO...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
