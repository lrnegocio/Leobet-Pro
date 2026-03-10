
"use client"

import { redirect } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';
import { useEffect, useState } from 'react';

export default function GerenteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((state) => state.user);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Busca usuário no localStorage se não estiver no store
    const storedUser = localStorage.getItem('logged_user');
    
    if (!user && !storedUser) {
      redirect('/auth/login?role=gerente');
      return;
    }

    const currentUser = user || JSON.parse(storedUser!);

    if (currentUser.role !== 'gerente' && currentUser.role !== 'admin') {
      redirect('/');
      return;
    }

    if (currentUser.status === 'pending') {
      redirect('/auth/login?status=pending');
      return;
    }

    setIsReady(true);
  }, [user]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="text-white font-black uppercase tracking-widest text-xs animate-pulse">
          Validando Acesso Gerente...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
