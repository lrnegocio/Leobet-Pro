"use client"

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ADMIN_EMAIL = 'seu@email.com'; // MUDE PARA SEU EMAIL

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    // Verifica se o usuário é admin (você implementaria com JWT/session)
    // Por enquanto, apenas check se tem um token admin no localStorage
    const adminToken = localStorage.getItem('admin_token');
    const adminEmail = localStorage.getItem('admin_email');

    if (adminToken && adminEmail === ADMIN_EMAIL) {
      setIsAuthorized(true);
    } else {
      // Redireciona para login
      router.push('/admin/login');
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Será redirecionado
  }

  return <>{children}</>;
}

