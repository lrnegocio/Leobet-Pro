import { Suspense } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-primary">
      <div className="text-white text-xl">Carregando...</div>
    </div>}>
      {children}
    </Suspense>
  );
}
