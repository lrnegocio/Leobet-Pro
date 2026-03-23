'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';

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
      const { data: found } = await supabase.from('tickets').select('*').or(`id.eq.${codeToSearch},barcode.eq.${codeToSearch}`).maybeSingle();
      if (found) {
        setReceipt(found);
      } else {
        setReceipt(null);
        toast({ variant: "destructive", title: "BILHETE NÃO ENCONTRADO" });
      }
    } catch (err: any) {
      console.error(err);
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
    const winners = receipt.tickets_data.filter((t: any) => t.status === 'ganhou' || t.s === 'ganhou');
    const total = winners.reduce((acc: number, t: any) => acc + (Number(t.valorPremio || t.vp || 0)), 0);
    return { 
      total, 
      count: winners.length, 
      hasPending: winners.length > 0 && receipt.status !== 'pendente-resgate' && receipt.status !== 'premio_pago',
      isPaid: receipt.status === 'premio_pago'
    };
  }, [receipt]);

  const handleClaimAll = async () => {
    if (!receipt || statsGanhos.total <= 0) return;
    setClaiming(true);
    try {
      const { error } = await supabase.from('tickets').update({ status: 'pendente-resgate' }).eq('id', receipt.id);
      if (error) throw error;
      toast({ title: "RESGATE SOLICITADO!", description: `Valor de R$ ${statsGanhos.total.toFixed(2)} enviado para análise.` });
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
        <Button onClick={() => router.push('/')} variant="outline" className="h-11 px-5 rounded-xl border-2 font-black uppercase text-[10px]"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
        <h1 className="text-4xl md:text-6xl font-black uppercase text-primary text-center">Auditoria Digital</h1>
        
        <Card className="rounded-[2.5rem] shadow-2xl bg-white p-6 md:p-12">
          <div className="flex gap-2 mb-8">
            <input placeholder="CÓDIGO" className="w-full h-16 font-black text-center text-2xl border-2 rounded-3xl uppercase" value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
            <Button onClick={() => handleSearch()} className="h-16 bg-primary px-8 rounded-3xl shadow-xl">{loading ? <Loader2 className="animate-spin" /> : <Search />}</Button>
          </div>

          {receipt && (
            <div className="space-y-6">
              {statsGanhos.hasPending && (
                <div className="bg-green-600 p-8 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
                  <div><p className="text-[10px] font-black uppercase opacity-60">Prêmios Acumulados ({statsGanhos.count} cartelas)</p><p className="text-4xl font-black">R$ {statsGanhos.total.toFixed(2)}</p></div>
                  <Button onClick={handleClaimAll} disabled={claiming} className="bg-white text-green-700 h-16 px-10 font-black uppercase rounded-2xl">{claiming ? "PROCESSANDO..." : "RESGATAR TUDO AGORA"}</Button>
                </div>
              )}

              {receipt.status === 'pendente-resgate' && <div className="bg-orange-500 p-6 rounded-[2rem] text-white text-center font-black">⌚ RESGATE EM ANÁLISE (R$ {statsGanhos.total.toFixed(2)})</div>}
              {statsGanhos.isPaid && <div className="bg-blue-600 p-6 rounded-[2rem] text-white text-center font-black">🏆 PRÊMIO PAGO ✓</div>}

              <div className="bg-primary/5 p-8 rounded-[2rem] border-2 border-primary/10">
                <p className="text-[10px] font-black text-muted-foreground uppercase">Apostador: <span className="text-primary text-xl ml-2">{receipt.cliente}</span></p>
                <p className="text-[10px] font-black text-muted-foreground uppercase mt-2">Concurso: <span className="text-primary text-xl ml-2">{receipt.evento_nome}</span></p>
                <div className="mt-6 space-y-2">
                  {receipt.tickets_data?.map((t: any, idx: number) => (
                    <div key={idx} className={cn("p-4 rounded-2xl border-2 flex justify-between items-center", (t.status === 'ganhou' || t.s === 'ganhou') ? "bg-green-50 border-green-400" : "bg-white")}>
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground">BILHETE #{idx+1} ({t.id})</p>
                        {t.n && <p className="font-black text-sm">{t.n.join(' ')}</p>}
                        {t.p && <p className="font-black text-sm">P: {t.p}</p>}
                      </div>
                      {(t.status === 'ganhou' || t.s === 'ganhou') && <p className="font-black text-green-600">R$ {(t.valorPremio || t.vp || 0).toFixed(2)}</p>}
                    </div>
                  ))}
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
  return <Suspense fallback={<div>Auditando...</div>}><ResultadosContent /></Suspense>;
}