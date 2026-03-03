"use client"

import { redirect } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';
import { useEffect } from 'react';

export default function CambistaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      redirect('/auth/login?role=cambista');
    }
    if (user.role !== 'cambista') {
      redirect('/');
    }
  }, [user]);

  return <>{children}</>;
}
