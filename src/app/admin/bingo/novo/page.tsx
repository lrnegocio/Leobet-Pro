
"use client"

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Info, CloudSync } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function NovoBingoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(10);
  const [quantity, setQuantity] = useState(0); 
  const [drawDate, setDrawDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('bingos')
        .insert([{
          nome: title.toUpperCase(),
          preco: price,
          total_cartelas: quantity === 0 ? 999999 : quantity,
          data_sorteio: new Date(drawDate).toISOString(),
          status: 'aberto',
          regras: 'Bingo 1-90 auditado. Prêmios líquidos: Bingo (50%), Quina (30%), Quadra (20%).'
        }]);

      if (error) throw error;

      toast({ title: "BINGO PUBLICADO NO SUPABASE!", description: "O sorteio já está visível para toda a rede." });
      
      // Mantemos o localStorage como redundância/cache se desejar
      const newBingoLocal = { id: Math.random().toString(), nome: title, preco: price, status: 'aberto' };
      const existing = JSON.parse(localStorage.getItem('leobet_bingos') || '[]');
      localStorage.setItem('leobet_bingos', JSON.stringify([...existing, newBingoLocal]));

      router.push('/admin/bingo');
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO AO SALVAR", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <Link href="/admin/bingo" className="flex items-center gap-2 text-primary hover:underline font-bold">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>

          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase tracking-tight">Novo Bingo</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Sincronização em Tempo Real via Supabase</p>
            </div>
            <CloudSync className="w-8 h-8 text-green-600 animate-pulse" />
          </div>

          <Card className="border-t-4 border-t-accent shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase">Configurações do Banco de Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground">Nome do Concurso</label>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: GRANDE BINGO DE DOMINGO"
                    className="h-12 border-2 rounded-xl font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground">Preço por Cartela (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="h-12 border-2 rounded-xl font-black text-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground">Limite de Cartelas (0 = Ilimitado)</label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="h-12 border-2 rounded-xl font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground">Data e Hora do Sorteio</label>
                  <Input
                    type="datetime-local"
                    value={drawDate}
                    onChange={(e) => setDrawDate(e.target.value)}
                    className="h-12 border-2 rounded-xl font-bold"
                    required
                  />
                  <p className="text-[10px] text-orange-600 font-bold flex items-center gap-1">
                    <Info className="w-3 h-3" /> O sistema fechará as vendas automaticamente no horário escolhido.
                  </p>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 h-14 font-black uppercase" disabled={saving}>
                    {saving ? 'SINCRONIZANDO...' : 'PUBLICAR NO SISTEMA'}
                  </Button>
                  <Link href="/admin/bingo" className="flex-1">
                    <Button type="button" variant="outline" className="w-full h-14 font-black uppercase">Cancelar</Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
