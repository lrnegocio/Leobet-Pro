"use client"

import React, { Suspense } from 'react';
import RegisterContent from './register-content';

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl text-muted-foreground">Carregando...</div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
