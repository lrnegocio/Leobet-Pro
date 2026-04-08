
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Trophy, Settings2, Trash2, Calendar, Users, History, Clock, Edit2, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';

export default function BolaoPage() {
  const [boloes, setBoloes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('boloes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBoloes(data || []);
    } catch (err: any) {
      console.error("Erro Supabase:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const deleteBolao = async (id: string) => {
    if (confirm("ATENÇÃO: Deseja realmente excluir este Bolão?")) {
      const { error } = await supabase.from('boloes').delete().eq('id', id);
      if (!error) {
        toast({ title: "BOLÃO EXCLUÍDO", variant: "destructive" });
        loadData();
      }
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase tracking-tight text-primary flex items-center gap-3">
                Gestão de Bolões <Database className="w-6 h-6 text-green-600" />
              </h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Base de Dados Supabase • Atualização Global</p>
            </div>
            <Link href="/admin/bolao/novo"><Button className="gap-2 bg-accent h-12 rounded-xl font-black uppercase shadow-lg"><Plus className="w-4 h-4" /> Novo Bolão</Button></Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <div className="py-20 text-center animate-pulse font-black uppercase text-xs">Conectando...</div>
            ) : boloes.map((bolao) => {
              const now = new Date();
              const startDate = bolao.data_fim ? new Date(bolao.data_fim) : new Date(0); 
              
              // REGRA: 1 MINUTO ANTES
              const isSalesClosedTime = bolao.data_fim ? now >= new Date(startDate.getTime() - 60000) : true;
              const isFinished = bolao.status === 'finalizado';
              const isSalesClosed = bolao.status === 'encerrado' || isFinished || isSalesClosedTime;
              
              return (
                <Card key={bolao.id} className={cn(
                  "hover:shadow-md transition-all border-l-4 overflow-hidden",
                  isFinished ? 'border-l-green-600' : 'border-l-accent'
                )}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-black uppercase text-primary leading-none">{bolao.nome}</h3>
                          <Badge variant={isFinished ? 'secondary' : (isSalesClosed ? 'destructive' : 'default')} className="font-black text-[10px] uppercase">
                            {isFinished ? 'Auditado' : (isSalesClosed ? 'Fechado' : 'Aberto')}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><Clock className="w-3.5 h-3.5 text-accent" /><span>Início: {startDate.toLocaleString('pt-BR')}</span></div>
                          <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><Trophy className="w-3.5 h-3.5 text-accent" /><span>{bolao.partidas?.length || 0} Jogos</span></div>
                          <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><Users className="w-3.5 h-3.5 text-accent" /><span>{bolao.vendidas || 0} Apostas</span></div>
                          <div className="flex items-center gap-2 text-xs font-black uppercase text-primary"><span className="bg-primary/10 px-2 py-1 rounded">R$ {(bolao.preco || 0).toFixed(2)}</span></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/admin/bolao/resultados/${bolao.id}`}><Button className={cn("gap-2 font-black uppercase text-xs h-10", isFinished ? 'bg-green-600' : 'bg-accent')}>{isFinished ? "Ver Auditoria" : "Lançar Placares"}</Button></Link>
                        {!isFinished && <Link href={`/admin/bolao/editar/${bolao.id}`}><Button variant="outline" size="icon" className="h-10 w-10"><Edit2 className="w-4 h-4" /></Button></Link>}
                        <Button variant="ghost" size="icon" onClick={() => deleteBolao(bolao.id)} className="h-10 w-10 text-destructive"><Trash2 className="w-4 h-4" /></Button>
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
