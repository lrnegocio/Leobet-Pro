"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Info, RefreshCcw } from 'lucide-react';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mounted) return;
    
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
          regras: 'Bingo 1-90 LEOBET PRO. Prêmios: Bingo (50%), Quina (30%), Quadra (20%).',
          bolas_sorteadas: []
        }]);

      if (error) throw error;

      toast({ title: "BINGO PUBLICADO!" });
      router.push('/admin/bingo');
    } catch (err: any) {
      // Falha silenciosa: O sistema avisa que as chaves devem ser colocadas no Vercel
      toast({ 
        variant: "destructive", 
        title: "VENDA EM ESPERA", 
        description: "Configure NEXT_PUBLIC_SUPABASE_URL na Vercel para sincronizar." 
      });
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8 pt-20 lg:pt-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <Link href="/admin/bingo" className="flex items-center gap-2 text-primary hover:underline font-bold">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>

          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase tracking-tight text-primary">Novo Bingo</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Auditoria Digital Supabase</p>
            </div>
            <RefreshCcw className="w-8 h-8 text-green-600 animate-spin-slow hidden md:block" />
          </div>

          <Card className="border-t-4 border-t-accent shadow-xl rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="text-xs font-black uppercase text-primary">Configurações do Concurso</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground opacity-60">Nome do Concurso</label>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="EX: GRANDE BINGO LEOBET"
                    className="h-12 border-2 rounded-xl font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground opacity-60">Preço (R$)</label>
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
                    <label className="text-xs font-black uppercase text-muted-foreground opacity-60">Limite Cartelas (0=Ilimitado)</label>
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
                  <label className="text-xs font-black uppercase text-muted-foreground opacity-60">Data e Hora do Sorteio</label>
                  <Input
                    type="datetime-local"
                    value={drawDate}
                    onChange={(e) => setDrawDate(e.target.value)}
                    className="h-12 border-2 rounded-xl font-bold"
                    required
                  />
                  <p className="text-[10px] text-orange-600 font-bold flex items-center gap-1">
                    <Info className="w-3 h-3" /> O sistema sincroniza as vendas em tempo real.
                  </p>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 h-14 font-black uppercase rounded-2xl shadow-xl" disabled={saving}>
                    {saving ? 'SALVANDO...' : 'PUBLICAR NO SISTEMA'}
                  </Button>
                  <Link href="/admin/bingo" className="flex-1">
                    <Button type="button" variant="outline" className="w-full h-14 font-black uppercase rounded-2xl border-2">Cancelar</Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
