'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, Loader2, Trophy, Clock, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

function ResultadosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [code, setCode] = useState('');
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSearch = async (searchCode?: string) => {
    const codeToSearch = (searchCode || code).trim().toUpperCase();
    if (codeToSearch.length < 3) return;
    setLoading(true);
    try {
      const { data: found } = await supabase.from('tickets').select('*').eq('id', codeToSearch).maybeSingle();
      if (found) {
        setReceipt(found);
      } else {
        setReceipt(null);
        toast({ variant: "destructive", title: "BILHETE NÃO ENCONTRADO" });
      }
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "ERRO DE CONEXÃO" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      const ticketCode = searchParams.get('c');
      if (ticketCode) { setCode(ticketCode); handleSearch(ticketCode); }
    }
  }, [searchParams, mounted]);

  const statsGanhos = useMemo(() => {
    if (!receipt || !receipt.tickets_data) return { total: 0, count: 0, hasPending: false, isPaid: false };
    
    // RESGATE UNIFICADO: Soma todos os prêmios do mesmo código
    const winners = receipt.tickets_data.filter((t: any) => (t.s || t.status) === 'ganhou');
    const total = winners.reduce((acc: number, t: any) => acc + (Number(t.v || t.vp || t.valor_premio || 0)), 0);
    
    return { 
      total, 
      count: winners.length, 
      hasPending: total > 0 && receipt.status !== 'pendente-resgate' && receipt.status !== 'premio_pago',
      isPaid: receipt.status === 'premio_pago'
    };
  }, [receipt]);

  const handleClaimAll = async () => {
    if (!receipt || statsGanhos.total <= 0) return;
    setClaiming(true);
    try {
      const { error } = await supabase.from('tickets').update({ status: 'pendente-resgate' }).eq('id', receipt.id);
      if (error) throw error;
      
      toast({ 
        title: "RESGATE SOLICITADO!", 
        description: `Prêmio total de R$ ${statsGanhos.total.toFixed(2)} enviado para análise.` 
      });
      handleSearch(receipt.id);
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO AO RESGATAR", description: err.message });
    } finally {
      setClaiming(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-muted/30 p-2 md:p-8 flex flex-col items-center font-body">
      <div className="max-w-4xl w-full space-y-6">
        <Button onClick={() => router.push('/')} variant="outline" className="h-11 px-5 rounded-xl border-2 font-black uppercase text-[10px]">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <h1 className="text-4xl md:text-6xl font-black uppercase text-primary text-center">Auditoria Digital</h1>
        
        <Card className="rounded-[2.5rem] shadow-2xl bg-white p-6 md:p-12">
          <div className="flex gap-2 mb-8">
            <input 
              placeholder="CÓDIGO DO BILHETE" 
              className="w-full h-16 font-black text-center text-2xl border-2 rounded-3xl uppercase" 
              value={code} 
              onChange={e => setCode(e.target.value.toUpperCase())} 
            />
            <Button onClick={() => handleSearch()} className="h-16 bg-primary px-8 rounded-3xl shadow-xl">
              {loading ? <Loader2 className="animate-spin" /> : <Search />}
            </Button>
          </div>

          {receipt && (
            <div className="space-y-6">
              {statsGanhos.total > 0 && (
                <div className={cn(
                  "p-8 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl",
                  statsGanhos.isPaid ? "bg-blue-600" : (receipt.status === 'pendente-resgate' ? "bg-orange-500" : "bg-green-600 animate-pulse")
                )}>
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-60">Prêmios Acumulados ({statsGanhos.count})</p>
                    <p className="text-4xl font-black">R$ {statsGanhos.total.toFixed(2)}</p>
                  </div>
                  
                  {statsGanhos.hasPending ? (
                    <Button onClick={handleClaimAll} disabled={claiming} className="bg-white text-green-700 hover:bg-white/90 h-16 px-10 font-black uppercase rounded-2xl shadow-lg">
                      {claiming ? <Loader2 className="animate-spin mr-2" /> : <Trophy className="w-5 h-5 mr-2" />}
                      {claiming ? "Enviando..." : "RESGATAR TODOS"}
                    </Button>
                  ) : (
                    <div className="bg-white/10 px-6 py-4 rounded-2xl flex items-center gap-2">
                       {statsGanhos.isPaid ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                       <p className="font-black uppercase text-xs">{statsGanhos.isPaid ? "PAGO" : "EM ANÁLISE"}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-primary/5 p-8 rounded-[2rem] border-2 border-primary/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                   <div><p className="text-[10px] font-black text-muted-foreground uppercase">Cliente</p><p className="text-xl font-black text-primary">{receipt.cliente}</p></div>
                   <div><p className="text-[10px] font-black text-muted-foreground uppercase">Concurso</p><p className="text-xl font-black text-primary">{receipt.evento_nome}</p></div>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {receipt.tickets_data?.map((t: any, idx: number) => {
                    const isWinner = (t.s || t.status) === 'ganhou';
                    const nums = t.n || t.numeros;
                    const pals = t.p || t.palpites;
                    return (
                      <div key={idx} className={cn(
                        "p-4 rounded-2xl border-2 flex justify-between items-center", 
                        isWinner ? "bg-green-50 border-green-400" : "bg-white opacity-60"
                      )}>
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase">Cartela #{idx+1}</p>
                          {nums && <p className="font-black text-sm tracking-widest">{nums.join(' ')}</p>}
                          {pals && <p className="font-black text-sm uppercase">PALPITE: {pals}</p>}
                        </div>
                        {isWinner && (
                          <div className="text-right">
                             <Badge className="bg-green-600 text-white font-black text-[9px] uppercase">PREMIADA</Badge>
                             <p className="font-black text-green-600">R$ {(t.v || t.vp || t.valor_premio || 0).toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ResultadosPage() {
  return <Suspense fallback={<div className="h-screen flex items-center justify-center font-black uppercase text-xs">Acessando Auditoria...</div>}><ResultadosContent /></Suspense>;
}