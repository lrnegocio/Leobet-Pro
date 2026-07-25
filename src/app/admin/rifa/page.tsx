
'use client';

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Trash2, Clock, Ticket, Database, RefreshCcw, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function GestaoRifasPage() {
  const [rifas, setRifas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase
        .from('rifas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRifas(data || []);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao carregar", description: err.message });
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const deleteRifa = async (id: string) => {
    if (confirm("EXCLUIR RIFA DEFINITIVAMENTE?")) {
      const { error } = await supabase.from('rifas').delete().eq('id', id);
      if (!error) {
        toast({ title: "RIFA EXCLUÍDA!" });
        loadData();
      }
    }
  };

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black uppercase text-primary flex items-center gap-3">
                Gestão de Rifas <Ticket className="w-6 h-6 text-accent" />
              </h1>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Numérica & Fazendinha • Sorteio Live</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadData} className="h-12 w-12 rounded-xl" disabled={syncing}>
                <RefreshCcw className={cn("w-5 h-5", syncing && "animate-spin")} />
              </Button>
              <Link href="/admin/rifa/novo"><Button className="gap-2 bg-accent h-12 rounded-xl font-black uppercase"><Plus className="w-4 h-4" /> Nova Rifa</Button></Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loading ? <div className="py-20 text-center animate-pulse font-black uppercase text-xs">Acessando Cloud...</div> : rifas.map((rifa) => (
              <Card key={rifa.id} className="hover:shadow-md border-l-8 border-l-primary rounded-3xl overflow-hidden bg-white">
                <CardContent className="p-0 flex flex-col md:flex-row">
                  <div className="p-6 flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black uppercase text-primary">{rifa.nome}</h3>
                      <Badge className="font-black text-[9px] uppercase">{rifa.tipo}</Badge>
                      <Badge variant="secondary" className="font-black text-[9px] uppercase">{rifa.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1"><p className="text-[9px] font-black uppercase opacity-60">Sorteio</p><p className="text-[10px] font-bold flex items-center gap-1"><Clock className="w-3 h-3 text-accent" /> {new Date(rifa.data_sorteio).toLocaleString()}</p></div>
                      <div className="space-y-1"><p className="text-[9px] font-black uppercase opacity-60">Valor</p><p className="text-[10px] font-black text-primary">R$ {(rifa.preco || 0).toFixed(2)}</p></div>
                      <div className="space-y-1"><p className="text-[9px] font-black uppercase opacity-60">Números</p><p className="text-[10px] font-black">{rifa.vendidos || 0} / {rifa.total_numeros}</p></div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase opacity-60">Imagem</p>
                        {rifa.imagem_url ? <ImageIcon className="w-4 h-4 text-green-600" /> : <span className="text-[8px] font-bold">SEM FOTO</span>}
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-6 flex items-center gap-3 border-l">
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      <Link href={`/admin/rifa/sorteio/${rifa.id}`}>
                        <Button className="w-full bg-primary h-12 font-black uppercase text-xs">Abrir Globo</Button>
                      </Link>
                      <Link href={`/admin/rifa/editar/${rifa.id}`}>
                        <Button variant="outline" className="w-full h-10 font-black uppercase text-[10px]">Editar</Button>
                      </Link>
                    </div>
                    <Button onClick={() => deleteRifa(rifa.id)} variant="ghost" size="icon" className="h-12 w-12 text-destructive border rounded-2xl bg-white"><Trash2 className="w-5 h-5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
