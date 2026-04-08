
'use client';

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Trash2, Clock, History, RefreshCcw, Edit2, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function BingoPage() {
  const [bingos, setBingos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    if (!mounted) return;
    setSyncing(true);
    try {
      const { data, error } = await supabase
        .from('bingos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBingos(data || []);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro de Sincronização",
        description: err.message
      });
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadData();
    }
  }, [mounted]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'aberto' ? 'encerrado' : 'aberto';
    const { error } = await supabase.from('bingos').update({ status: newStatus }).eq('id', id);
    if (!error) {
      toast({ title: "STATUS ATUALIZADO!" });
      loadData();
    }
  };

  const deleteBingo = async (id: string) => {
    if (confirm("ATENÇÃO: Deseja realmente excluir este Bingo? Esta ação é irreversível.")) {
      try {
        const { error } = await supabase.from('bingos').delete().eq('id', id);
        if (error) throw error;
        toast({ title: "BINGO EXCLUÍDO", variant: "destructive" });
        loadData();
      } catch (err: any) {
        toast({ variant: "destructive", title: "FALHA AO EXCLUIR" });
      }
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center px-4 md:px-0">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase text-primary flex items-center gap-3">
                Gestão de Bingos <Database className="w-6 h-6 text-green-600" />
              </h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Painel Administrativo LEOBET PRO</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadData} className="h-12 w-12 rounded-xl" disabled={syncing}>
                <RefreshCcw className={cn("w-5 h-5", syncing && "animate-spin")} />
              </Button>
              <Link href="/admin/bingo/novo"><Button className="gap-2 bg-accent h-12 rounded-xl font-black uppercase"><Plus className="w-4 h-4" /> Novo</Button></Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 px-4 md:px-0">
            {loading ? (
              <div className="py-20 text-center animate-pulse font-black uppercase text-xs">Consultando Banco...</div>
            ) : bingos.map((bingo) => {
              const drawDate = bingo.data_sorteio ? new Date(bingo.data_sorteio) : new Date();
              const now = new Date();
              // REGRA: 1 MINUTO ANTES
              const isSalesClosedTime = now >= new Date(drawDate.getTime() - 60000);
              const isFinished = bingo.status === 'finalizado';
              const isSalesClosed = bingo.status === 'encerrado' || isFinished || isSalesClosedTime;
              
              return (
                <Card key={bingo.id} className={cn(
                  "hover:shadow-md transition-all border-l-8 overflow-hidden rounded-3xl",
                  isFinished ? 'border-l-green-600' : 'border-l-primary'
                )}>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row items-stretch">
                       <div className="p-6 flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl md:text-2xl font-black uppercase text-primary leading-none">{bingo.nome}</h3>
                            <Badge variant={isFinished ? 'secondary' : (isSalesClosed ? 'destructive' : 'default')} className="font-black text-[9px] uppercase">
                              {isFinished ? 'Finalizado' : (isSalesClosed ? 'Vendas Encerradas' : 'Vendas Abertas')}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1"><p className="text-[9px] font-black uppercase opacity-60">Sorteio</p><p className="text-[10px] font-bold flex items-center gap-1"><Clock className="w-3 h-3 text-accent" /> {drawDate.toLocaleString('pt-BR')}</p></div>
                            <div className="space-y-1"><p className="text-[9px] font-black uppercase opacity-60">Valor</p><p className="text-[10px] font-black text-primary">R$ {(Number(bingo.preco) || 0).toFixed(2)}</p></div>
                            <div className="space-y-1"><p className="text-[9px] font-black uppercase opacity-60">Vendas</p><p className="text-[10px] font-black">{bingo.vendidas || 0}</p></div>
                            <div className="space-y-1"><p className="text-[9px] font-black uppercase opacity-60">Status</p><Badge className="text-[7px] uppercase h-4">{bingo.status}</Badge></div>
                          </div>
                       </div>
                       <div className="bg-muted/50 p-6 flex items-center gap-3 border-l shrink-0">
                          <div className="flex flex-col gap-2 min-w-[140px] w-full">
                             {!isFinished && (
                               <div className="flex gap-2">
                                 <Button variant="outline" size="sm" className="flex-1 font-black text-[10px] uppercase h-10 bg-white" onClick={() => toggleStatus(bingo.id, bingo.status)}>
                                    {bingo.status === 'encerrado' ? "Reabrir" : "Fechar"}
                                 </Button>
                                 <Link href={`/admin/bingo/editar/${bingo.id}`} className="flex-1"><Button variant="outline" size="sm" className="w-full font-black text-[10px] uppercase h-10 bg-white">Editar</Button></Link>
                               </div>
                             )}
                             <Link href={isFinished ? `/admin/financeiro` : `/admin/bingo/sorteio/${bingo.id}`} className="w-full">
                               <Button className={cn("w-full gap-2 font-black uppercase text-xs h-12", isFinished ? 'bg-green-600' : 'bg-primary')} disabled={!isSalesClosed && !isFinished}>
                                 {isFinished ? "Auditoria" : "Sortear"}
                                </Button>
                             </Link>
                          </div>
                          <Button variant="ghost" size="icon" className="h-12 w-12 text-destructive border rounded-2xl bg-white" onClick={() => deleteBingo(bingo.id)}><Trash2 className="w-5 h-5" /></Button>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
