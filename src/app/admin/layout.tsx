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
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const checkAuth = () => {
      const storedUser = localStorage.getItem('logged_user');
      
      // Bypass master removido por segurança. 
      // O admin deve ser um usuário real no banco com role 'admin'.
      if (!user && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.role === 'admin') {
            setUser(parsedUser);
            setLoading(false);
            return;
          }
        } catch (e) {}
      }

      if (!user || user.role !== 'admin') {
        router.push('/auth/login?role=admin');
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [user, router, setUser, mounted]);

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="font-black uppercase tracking-widest text-[10px]">Protegendo Conexão...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}