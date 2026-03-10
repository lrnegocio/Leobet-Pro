
"use client"

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Plus, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NovoBolaoPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(10);
  const [drawDate, setDrawDate] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Inicializa 10 partidas vazias
  const [partidas, setPartidas] = useState(Array(10).fill(null).map(() => ({ 
    time1: '', 
    time2: '', 
    data: '' 
  })));

  const handleUpdatePartida = (index: number, field: string, value: string) => {
    const newPartidas = [...partidas];
    newPartidas[index] = { ...newPartidas[index], [field]: value };
    setPartidas(newPartidas);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (partidas.some(p => !p.time1 || !p.time2)) {
      alert("Preencha todos os times das 10 partidas.");
      return;
    }

    setSaving(true);
    
    const newBolao = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      nome: title,
      preco: price,
      dataFim: drawDate, // Data da primeira partida (trava de vendas)
      partidas: partidas, // Salva o array completo com nomes dos times
      vendidas: 0,
      status: 'aberto',
      tipo: 'bolao',
      createdAt: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem('leobet_boloes') || '[]');
    localStorage.setItem('leobet_boloes', JSON.stringify([...existing, newBolao]));

    setTimeout(() => {
      router.push('/admin/bolao');
    }, 500);
  };

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Link href="/admin/bolao" className="flex items-center gap-2 text-primary hover:underline font-black text-xs uppercase">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>

          <div className="flex items-center gap-4">
            <div className="bg-primary p-4 rounded-3xl shadow-lg">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-primary leading-none">Novo Bolão Esportivo</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-black tracking-widest mt-1">Configure a Rodada de 10 Jogos</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-8 pb-20">
            <Card className="border-t-8 border-t-primary shadow-2xl rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-muted/50 border-b">
                <CardTitle className="text-xs font-black uppercase flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Configurações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Nome da Rodada</Label>
                  <Input 
                    value={title} 
                    onChange={e => setTitle(e.target.value.toUpperCase())} 
                    placeholder="EX: BRASILEIRÃO SÉRIE A" 
                    required 
                    className="h-12 font-bold border-2 focus:border-primary rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Preço por Aposta (R$)</Label>
                  <Input 
                    type="number" 
                    value={price} 
                    onChange={e => setPrice(Number(e.target.value))} 
                    required 
                    className="h-12 font-black text-xl border-2 focus:border-primary rounded-xl text-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Data Início (Trava Vendas)</Label>
                  <Input 
                    type="datetime-local" 
                    value={drawDate} 
                    onChange={e => setDrawDate(e.target.value)} 
                    required 
                    className="h-12 font-bold border-2 focus:border-primary rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
               <h3 className="text-sm font-black uppercase flex items-center gap-2 text-primary">
                 <Plus className="w-5 h-5 text-accent" /> Lista de Partidas da Grade
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partidas.map((p, i) => (
                    <Card key={i} className="rounded-2xl border-none shadow-md overflow-hidden bg-white hover:shadow-xl transition-all">
                       <div className="bg-primary/5 p-3 flex items-center justify-between border-b">
                          <Badge className="bg-primary text-white font-black text-[9px] uppercase px-3">JOGO #{i+1}</Badge>
                          <Input 
                            type="datetime-local" 
                            value={p.data}
                            onChange={(e) => handleUpdatePartida(i, 'data', e.target.value)}
                            className="w-36 h-7 text-[9px] font-bold border-none bg-transparent shadow-none p-0 text-right" 
                          />
                       </div>
                       <CardContent className="p-4 space-y-4">
                          <div className="grid grid-cols-3 items-center gap-2">
                             <div className="space-y-1 text-center">
                               <Label className="text-[8px] font-black uppercase opacity-40">Mandante</Label>
                               <Input 
                                 placeholder="TIME A" 
                                 className="text-center font-black h-10 border-2 rounded-xl text-xs uppercase" 
                                 value={p.time1}
                                 onChange={(e) => handleUpdatePartida(i, 'time1', e.target.value.toUpperCase())} 
                                 required
                               />
                             </div>
                             <div className="text-center">
                               <span className="text-xl font-black text-accent">VS</span>
                             </div>
                             <div className="space-y-1 text-center">
                               <Label className="text-[8px] font-black uppercase opacity-40">Visitante</Label>
                               <Input 
                                 placeholder="TIME B" 
                                 className="text-center font-black h-10 border-2 rounded-xl text-xs uppercase" 
                                 value={p.time2}
                                 onChange={(e) => handleUpdatePartida(i, 'time2', e.target.value.toUpperCase())} 
                                 required
                               />
                             </div>
                          </div>
                       </CardContent>
                    </Card>
                  ))}
               </div>
            </div>

            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-50">
               <div className="bg-white p-4 rounded-[2rem] shadow-2xl border-4 border-primary flex gap-4">
                 <Button type="submit" className="flex-1 bg-primary h-14 font-black uppercase text-lg rounded-2xl shadow-xl transition-all active:scale-95" disabled={saving}>
                   {saving ? 'Publicando...' : 'Publicar Rodada'}
                 </Button>
                 <Link href="/admin/bolao" className="flex-1">
                   <Button type="button" variant="outline" className="w-full h-14 font-black uppercase border-2 rounded-2xl">Descartar</Button>
                 </Link>
               </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
