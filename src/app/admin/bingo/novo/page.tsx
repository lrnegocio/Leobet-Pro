"use client"

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NovoBingoPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [prize, setPrize] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [price, setPrice] = useState(10);
  const [drawDate, setDrawDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Simulação de persistência
      console.log({ title, prize, quantity, price, drawDate });
      
      // Aqui seriam adicionados os dados ao Firebase/Supabase futuramente
      setTimeout(() => {
        router.push('/admin/bingo');
      }, 500);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <Link href="/admin/bingo" className="flex items-center gap-2 text-primary hover:underline font-bold">
            <ArrowLeft className="w-4 h-4" /> Voltar para Gerenciamento
          </Link>

          <div>
            <h1 className="text-3xl font-black font-headline uppercase">Novo Concurso de Bingo</h1>
            <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Defina as regras e prêmios do sorteio</p>
          </div>

          <Card className="bg-white border-t-4 border-t-accent shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase">Configuração do Bingo</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase">Nome do Concurso</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Bingo da Virada"
                    className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase">Prêmio Principal</label>
                    <input
                      type="text"
                      value={prize}
                      onChange={(e) => setPrize(e.target.value)}
                      placeholder="Ex: R$ 1.000,00"
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase">Valor da Cartela (R$)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase">Qtd. Máxima de Cartelas</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      min="1"
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                      required
                    />
                    <p className="text-[9px] text-muted-foreground italic">Sem limite máximo definido.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase">Data e Hora do Sorteio</label>
                    <input
                      type="datetime-local"
                      value={drawDate}
                      onChange={(e) => setDrawDate(e.target.value)}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 h-12 font-black uppercase text-xs" disabled={saving}>
                    {saving ? 'Salvando Bingo...' : 'Publicar Concurso'}
                  </Button>
                  <Link href="/admin/bingo" className="flex-1">
                    <Button type="button" variant="outline" className="w-full h-12 font-black uppercase text-xs">Descartar</Button>
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