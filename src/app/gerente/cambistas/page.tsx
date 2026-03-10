
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/use-auth-store';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Send } from 'lucide-react';

export default function MeusCambistasPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [cambistas, setCambistas] = useState<any[]>([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');

  const loadData = () => {
    const all = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    setCambistas(all.filter((u: any) => u.role === 'cambista' && u.gerenteId === user?.id));
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = {
      id: Math.random().toString(36).substring(7),
      nome,
      email,
      role: 'cambista',
      gerenteId: user?.id,
      balance: 0,
      status: 'approved',
      createdAt: new Date().toISOString()
    };
    const all = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    localStorage.setItem('leobet_users', JSON.stringify([...all, newUser]));
    toast({ title: "CAMBISTA CADASTRADO!" });
    setNome(''); setEmail('');
    loadData();
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <h1 className="text-3xl font-black uppercase text-primary">Meus Cambistas</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1">
              <CardHeader><CardTitle className="text-sm font-black uppercase">Novo Cambista</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <Input placeholder="NOME" value={nome} onChange={e => setNome(e.target.value)} required />
                  <Input placeholder="USUÁRIO/EMAIL" value={email} onChange={e => setEmail(e.target.value)} required />
                  <Button type="submit" className="w-full">Cadastrar</Button>
                </form>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
              {cambistas.map((c, i) => (
                <Card key={i} className="flex justify-between items-center p-4">
                  <div>
                    <p className="font-black uppercase">{c.nome}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">R$ {c.balance.toFixed(2)}</p>
                    <Badge variant="outline" className="text-[8px] uppercase">Ativo</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
