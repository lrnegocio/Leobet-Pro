"use client"

import React, { Suspense } from 'react';
import LoginContent from './login-content';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl text-muted-foreground">Carregando...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
