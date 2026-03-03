"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ADMIN_EMAIL = 'seu@email.com'; // MUDE PARA SEU EMAIL
const ADMIN_PASSWORD = 'senha123'; // MUDE PARA SENHA FORTE

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validação simples (deveria ser com backend real)
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Salva token no localStorage
      localStorage.setItem('admin_token', 'token_' + Date.now());
      localStorage.setItem('admin_email', email);
      
      router.push('/admin/dashboard');
    } else {
      setError('Email ou senha incorretos');
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 to-accent/10">
      <Card className="w-full max-w-md bg-white">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-black font-headline">
            LEOBET ADMIN
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Área Administrativa
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            <Link href="/" className="text-primary hover:underline">
              Voltar para home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
