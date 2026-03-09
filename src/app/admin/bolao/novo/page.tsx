"use client"

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NovoBolaoPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(10);
  const [drawDate, setDrawDate] = useState('');
  const [saving, setSaving] = useState(false);
  
  // 10 jogos padrão
  const [partidas, setPartidas] = useState(Array(10).fill({ time1: '', time2: '', data: '' }));

  const handleUpdatePartida = (index: number, field: string, value: string) => {
    const newPartidas = [...partidas];
    newPartidas[index] = { ...newPartidas[index], [field]: value };
    setPartidas(newPartidas);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      router.push('/admin/bolao');
    }, 800);
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Link href="/admin/bolao" className="flex items-center gap-2 text-primary hover:underline font-bold">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase">Criar Bolão Esportivo</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Prêmio Líquido de 65% Acumulado</p>
            </div>
            <Trophy className="w-12 h-12 text-accent opacity-20" />
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            <Card className="border-t-4 border-t-primary shadow-lg">
              <CardHeader><CardTitle className="text-sm font-black uppercase">Informações do Bolão</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase">Título do Bolão</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Brasileirão Rodada 10" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase">Valor Aposta (R$)</Label>
                  <Input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase">Data 1º Jogo (Encerramento)</Label>
                  <Input type="datetime-local" value={drawDate} onChange={e => setDrawDate(e.target.value)} required />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
               <h3 className="text-sm font-black uppercase flex items-center gap-2">
                 <Plus className="w-4 h-4 text-primary" /> Definir Jogos
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partidas.map((_, i) => (
                    <Card key={i} className="p-4 bg-white border-l-4 border-l-accent shadow-sm">
                       <div className="flex items-center justify-between mb-3">
                          <Badge className="font-black text-[9px] uppercase">JOGO #{i+1}</Badge>
                          <Input type="datetime-local" className="w-32 h-7 text-[10px] font-bold" />
                       </div>
                       <div className="grid grid-cols-3 items-center gap-2">
                          <Input placeholder="Time Casa" className="text-center font-bold h-9" onChange={(e) => handleUpdatePartida(i, 'time1', e.target.value)} />
                          <span className="text-center font-black text-primary">VS</span>
                          <Input placeholder="Time Fora" className="text-center font-bold h-9" onChange={(e) => handleUpdatePartida(i, 'time2', e.target.value)} />
                       </div>
                       <p className="text-[8px] font-black uppercase text-center mt-3 text-muted-foreground">Palpites aceitos: 1 - X - 2</p>
                    </Card>
                  ))}
               </div>
            </div>

            <div className="flex gap-4 p-6 bg-white rounded-xl shadow-lg border-2 border-primary sticky bottom-8">
               <Button type="submit" className="flex-1 bg-primary h-14 font-black uppercase text-lg shadow-md" disabled={saving}>
                 {saving ? 'Processando...' : 'Publicar Bolão Agora'}
               </Button>
               <Link href="/admin/bolao" className="flex-1">
                 <Button type="button" variant="outline" className="w-full h-14 font-black uppercase">Descartar</Button>
               </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}