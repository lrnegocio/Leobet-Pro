
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, RefreshCcw, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function EditarBingoPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise);
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(0); 
  const [drawDate, setDrawDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadBingo = async () => {
      const { data, error } = await supabase
        .from('bingos')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (data) {
        setTitle(data.nome);
        setPrice(data.preco);
        setQuantity(data.total_cartelas === 999999 ? 0 : data.total_cartelas);
        const date = new Date(data.data_sorteio);
        setDrawDate(date.toISOString().slice(0, 16));
      }
      setLoading(false);
    };
    loadBingo();
  }, [params.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('bingos')
        .update({
          nome: title.toUpperCase(),
          preco: price,
          total_cartelas: quantity === 0 ? 999999 : quantity,
          data_sorteio: new Date(drawDate).toISOString(),
        })
        .eq('id', params.id);

      if (error) throw error;

      toast({ title: "BINGO ATUALIZADO!" });
      router.push('/admin/bingo');
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO AO SALVAR", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black uppercase text-xs">Carregando Bingo...</div>;

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8 pt-20 lg:pt-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <Link href="/admin/bingo" className="flex items-center gap-2 text-primary hover:underline font-bold">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>

          <div>
            <h1 className="text-3xl font-black font-headline uppercase tracking-tight text-primary">Editar Bingo</h1>
            <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Ajuste de Informações no Supabase</p>
          </div>

          <Card className="border-t-4 border-t-primary shadow-xl rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="text-xs font-black uppercase text-primary">Informações do Concurso</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground opacity-60">Nome do Concurso</label>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
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
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <Button type="submit" className="flex-1 bg-primary h-14 font-black uppercase rounded-2xl shadow-xl" disabled={saving}>
                    {saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
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
    </div>
  );
}
