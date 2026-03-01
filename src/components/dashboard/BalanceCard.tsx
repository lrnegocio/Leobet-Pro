
"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, ArrowUpCircle, ArrowDownCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/use-auth-store';
import Link from 'next/link';

export function BalanceCard() {
  const user = useAuthStore(state => state.user);

  if (!user) return null;

  return (
    <Card className="bg-primary text-white overflow-hidden relative border-none">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Wallet className="w-24 h-24" />
      </div>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-white/70">Meu Saldo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-4xl font-bold">R$ {user.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        
        {user.role === 'admin' ? (
          <Link href="/admin/financeiro" className="block">
            <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white gap-2">
              <ExternalLink className="w-4 h-4" /> Gerenciar Finanças
            </Button>
          </Link>
        ) : (
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 border-white/20 hover:bg-white/10 text-white gap-2">
              <ArrowUpCircle className="w-4 h-4" /> Depósito
            </Button>
            <Button variant="outline" className="flex-1 border-white/20 hover:bg-white/10 text-white gap-2">
              <ArrowDownCircle className="w-4 h-4" /> Saque
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
