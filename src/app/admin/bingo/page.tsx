
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Lock, PlayCircle, Trash2, Clock, CheckCircle2, Database, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function BingoPage() {
  const [bingos, setBingos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('bingos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBingos(data || []);
    } catch (err) {
      console.error("Supabase load error");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'aberto' ? 'encerrado' : 'aberto';
    const { error } = await supabase.from('bingos').update({ status: newStatus }).eq('id', id);
    if (!error) {
      toast({ title: "STATUS ATUALIZADO!" });
      loadData();
    }
  };

  const deleteBingo = async (id: string) => {
    if (confirm("ATENÇÃO: Deseja realmente excluir este Bingo? Esta ação apagará o registro do Supabase permanentemente.")) {
      const { error } = await supabase.from('bingos').delete().eq('id', id);
      if (!error) {
        toast({ title: "BINGO EXCLUÍDO", variant: "destructive" });
        loadData();
      }
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase text-primary flex items-center gap-3">
                Gestão de Bingos <Database className="w-6 h-6 text-green-600" />
              </h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Base de Dados Auditada em Tempo Real</p>
            </div>
            <Link href="/admin/bingo/novo">
              <Button className="gap-2 bg-accent hover:bg-accent/90 font-black uppercase h-12 rounded-xl shadow-lg">
                <Plus className="w-4 h-4" /> Novo Concurso
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <div className="py-20 text-center animate-pulse font-black uppercase text-muted-foreground">Sincronizando Banco de Dados...</div>
            ) : bingos.map((bingo) => {
              const now = new Date();
              const drawDate = new Date(bingo.data_sorteio);
              const isFinished = bingo.status === 'finalizado';
              const isSalesClosed = bingo.status === 'encerrado' || isFinished || now >= drawDate;
              
              return (
                <Card key={bingo.id} className={`hover:shadow-md transition-all border-l-8 overflow-hidden rounded-2xl ${isFinished ? 'border-l-green-600' : 'border-l-primary'}`}>
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
                            <div className="space-y-1">
                               <p className="text-[9px] font-black uppercase text-muted-foreground">Sorteio</p>
                               <p className="text-[10px] font-bold flex items-center gap-1">
                                 <Clock className="w-3 h-3 text-accent" /> {drawDate.toLocaleString('pt-BR')}
                               </p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[9px] font-black uppercase text-muted-foreground">Preço</p>
                               <p className="text-[10px] font-black text-primary">R$ {(bingo.preco || 0).toFixed(2)}</p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[9px] font-black uppercase text-muted-foreground">Vendidos</p>
                               <p className="text-[10px] font-black">{bingo.vendidas || 0}</p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[9px] font-black uppercase text-muted-foreground">ID Supabase</p>
                               <p className="text-[7px] font-black uppercase text-primary/40 truncate w-32">{bingo.id}</p>
                            </div>
                          </div>
                       </div>

                       <div className="bg-muted/50 p-6 flex items-center gap-3 border-l shrink-0">
                          <div className="flex flex-col gap-2 min-w-[140px] w-full md:w-auto">
                             {!isFinished && (
                               <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="font-black text-[10px] uppercase gap-2 h-9 border-primary/20 bg-white"
                                  onClick={() => toggleStatus(bingo.id, bingo.status)}
                               >
                                  {isSalesClosed ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <Lock className="w-3 h-3 text-orange-600" />}
                                  {isSalesClosed ? "Reabrir Vendas" : "Encerrar Vendas"}
                               </Button>
                             )}
                             
                             <Link href={isFinished ? `/admin/financeiro` : `/admin/bingo/sorteio/${bingo.id}`} className="w-full">
                               <Button 
                                 className={`w-full gap-2 font-black uppercase text-xs h-10 shadow-lg ${isFinished ? 'bg-green-600 hover:bg-green-700' : 'bg-primary'}`}
                                 disabled={!isSalesClosed && !isFinished}
                                >
                                 {isFinished ? <History className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                                 {isFinished ? "Ver Auditoria" : "Iniciar Sorteio"}
                                </Button>
                             </Link>
                          </div>
                          <div className="flex flex-col gap-2">
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl border border-destructive/20 bg-white shadow-sm"
                               onClick={() => deleteBingo(bingo.id)}
                             >
                               <Trash2 className="w-5 h-5" />
                             </Button>
                          </div>
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
