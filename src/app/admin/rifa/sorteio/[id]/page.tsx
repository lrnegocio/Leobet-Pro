'use client';

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, RefreshCcw, Database, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';

const ANIMAIS_FAZENDINHA = [
  "AVESTRUZ", "ÁGUIA", "BURRO", "BORBOLETA", "CACHORRO", "CABRA", "CARNEIRO", "CAMELO", "COBRA", "COELHO",
  "CAVALO", "ELEFANTE", "GALO", "GATO", "JACARÉ", "LEÃO", "MACACO", "PORCO", "PAVÃO", "PERU", "TOURO", "TIGRE", "URSO", "VEADO", "VACA"
];

export default function RifaSorteioPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise);
  const { toast } = useToast();
  const [rifa, setRifa] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentNum, setCurrentNum] = useState<number | string>(0);
  const [winner, setWinner] = useState<any>(null);
  const [finished, setFinished] = useState(false);

  const loadData = async () => {
    const resolvedParams = await params;
    const { data: rData } = await supabase.from('rifas').select('*').eq('id', resolvedParams.id).single();
    if (rData) {
      setRifa(rData);
      if (rData.ganhador_numero) {
        setWinner({ numero: rData.ganhador_numero, nome: rData.ganhador_nome });
        setFinished(true);
        setCurrentNum(rData.tipo === 'fazendinha' ? ANIMAIS_FAZENDINHA[rData.ganhador_numero - 1] : rData.ganhador_numero);
      }
    }
    // Auditoria: Apenas bilhetes PAGOS concorrem
    const { data: tData } = await supabase.from('tickets').select('*').eq('evento_id', resolvedParams.id).eq('status', 'pago');
    setTickets(tData || []);
  };

  useEffect(() => { loadData(); }, []);

  const startSorteio = () => {
    if (finished || tickets.length === 0) {
      if (tickets.length === 0) toast({ variant: "destructive", title: "SEM BILHETES VALIDADOS", description: "Não há apostas pagas para sortear." });
      return;
    }
    setIsSpinning(true);
    let count = 0;
    const max = rifa.tipo === 'fazendinha' ? 25 : rifa.total_numeros;

    const interval = setInterval(() => {
      const rand = Math.floor(Math.random() * max) + 1;
      setCurrentNum(rifa.tipo === 'fazendinha' ? ANIMAIS_FAZENDINHA[rand - 1] : rand);
      count++;
      if (count > 40) {
        clearInterval(interval);
        finalizeSorteio();
      }
    }, 80);
  };

  const finalizeSorteio = async () => {
    const allSoldNumbers: number[] = [];
    tickets.forEach(receipt => {
      receipt.tickets_data?.forEach((t: any) => {
        if (t.n && t.n.length > 0) allSoldNumbers.push(Number(t.n[0]));
      });
    });

    if (allSoldNumbers.length === 0) {
      setIsSpinning(false);
      return toast({ variant: "destructive", title: "ERRO DE AUDITORIA", description: "Cotas pagas não encontradas." });
    }

    const winningNum = allSoldNumbers[Math.floor(Math.random() * allSoldNumbers.length)];
    setCurrentNum(rifa.tipo === 'fazendinha' ? ANIMAIS_FAZENDINHA[winningNum - 1] : winningNum);
    setIsSpinning(false);

    let winnerName = "GANHADOR";
    tickets.forEach(receipt => {
      receipt.tickets_data?.forEach((t: any) => {
        if (Number(t.n?.[0]) === winningNum) winnerName = receipt.cliente;
      });
    });

    setWinner({ numero: winningNum, nome: winnerName });
    setFinished(true);

    await supabase.from('rifas').update({
      ganhador_numero: winningNum,
      ganhador_nome: winnerName,
      status: 'finalizado'
    }).eq('id', rifa.id);

    toast({ title: "RIFA FINALIZADA!", description: `Ganhador: ${winnerName}` });
  };

  if (!rifa) return <div className="h-screen flex items-center justify-center font-black uppercase text-primary">Carregando Globo...</div>;

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <Link href="/admin/rifa" className="flex items-center gap-2 text-primary font-black text-[10px] uppercase"><ArrowLeft className="w-3 h-3" /> Voltar</Link>
            <div className="flex items-center gap-2 bg-white px-6 py-2 rounded-2xl border shadow-sm">
               <ShieldCheck className="w-4 h-4 text-green-600" />
               <p className="text-[10px] font-black uppercase text-primary">Globo Virtual Auditado</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[3.5rem] bg-primary text-white p-12 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden border-8 border-white/10">
               <div className="absolute inset-0 opacity-10 pointer-events-none">
                 <Database className="w-full h-full p-20" />
               </div>
               <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.3em] mb-6">Visor do Sorteio Live</p>
               <div className={cn(
                 "w-56 h-56 rounded-full bg-white text-primary flex items-center justify-center font-black border-[12px] border-accent shadow-inner transition-all duration-300",
                 isSpinning ? "animate-pulse scale-105" : "scale-100",
                 rifa.tipo === 'fazendinha' ? "text-2xl px-4 text-center leading-tight" : "text-7xl"
               )}>
                 {currentNum || '--'}
               </div>
               {!finished && (
                 <Button onClick={startSorteio} disabled={isSpinning} className="mt-10 bg-accent hover:bg-accent/90 h-16 px-16 rounded-3xl font-black uppercase text-xl shadow-xl gap-3">
                   {isSpinning ? "GIRANDO..." : "SORTEAR AGORA"}
                 </Button>
               )}
            </Card>

            <div className="space-y-6">
               <Card className="rounded-[2.5rem] bg-white p-8 shadow-lg border-none">
                  <h3 className="text-xs font-black uppercase text-primary mb-6 flex items-center gap-2"><Trophy className="w-5 h-5 text-accent" /> Resultado do Globo</h3>
                  {finished ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <div className="p-6 bg-green-50 border-2 border-green-200 rounded-[2rem]">
                          <p className="text-[10px] font-black uppercase text-green-600 mb-1">Ganhador Oficial</p>
                          <p className="text-2xl font-black text-primary uppercase leading-tight">{winner?.nome}</p>
                       </div>
                       <div className="p-6 bg-muted/20 rounded-[2rem] border">
                          <p className="text-[10px] font-black uppercase opacity-60 mb-1">Cota Sorteada</p>
                          <p className="text-3xl font-black text-primary uppercase">{winner?.numero} - {rifa.tipo === 'fazendinha' ? ANIMAIS_FAZENDINHA[winner?.numero - 1] : 'BILHETE'}</p>
                       </div>
                    </div>
                  ) : (
                    <div className="py-16 text-center opacity-30">
                       <RefreshCcw className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
                       <p className="font-black uppercase text-xs tracking-widest">Aguardando Sorteio</p>
                    </div>
                  )}
               </Card>
               
               <Card className="rounded-[2rem] bg-white p-8 shadow-sm border-l-8 border-l-primary">
                  <p className="text-[9px] font-black uppercase opacity-60 mb-2">Campanha Selecionada</p>
                  <p className="font-black text-primary uppercase text-lg leading-tight">{rifa.nome}</p>
                  <div className="mt-4 flex gap-4">
                     <div><p className="text-[8px] font-black uppercase opacity-50">Cotas Liquidadas</p><p className="font-black text-sm">{tickets.length} Válidas</p></div>
                     <div><p className="text-[8px] font-black uppercase opacity-50">Tipo</p><p className="font-black text-sm uppercase">{rifa.tipo}</p></div>
                  </div>
               </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
