
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Trophy, RefreshCcw, Database } from 'lucide-react';
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
    const { data: rData } = await supabase.from('rifas').select('*').eq('id', params.id).single();
    if (rData) {
      setRifa(rData);
      if (rData.ganhador_numero) {
        setWinner({ numero: rData.ganhador_numero, nome: rData.ganhador_nome });
        setFinished(true);
        setCurrentNum(rData.tipo === 'fazendinha' ? ANIMAIS_FAZENDINHA[rData.ganhador_numero - 1] : rData.ganhador_numero);
      }
    }
    const { data: tData } = await supabase.from('tickets').select('*').eq('evento_id', params.id).eq('status', 'pago');
    setTickets(tData || []);
  };

  useEffect(() => { loadData(); }, [params.id]);

  const startSorteio = () => {
    if (finished) return;
    setIsSpinning(true);
    let count = 0;
    const max = rifa.tipo === 'fazendinha' ? 25 : rifa.total_numeros;

    const interval = setInterval(() => {
      const rand = Math.floor(Math.random() * max) + 1;
      setCurrentNum(rifa.tipo === 'fazendinha' ? ANIMAIS_FAZENDINHA[rand - 1] : rand);
      count++;
      if (count > 30) {
        clearInterval(interval);
        finalizeSorteio(max);
      }
    }, 100);
  };

  const finalizeSorteio = async (maxRange: number) => {
    const winningNum = Math.floor(Math.random() * maxRange) + 1;
    setCurrentNum(rifa.tipo === 'fazendinha' ? ANIMAIS_FAZENDINHA[winningNum - 1] : winningNum);
    setIsSpinning(false);

    // Busca ganhador nos bilhetes
    let winnerName = "S/ GANHADOR";
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

    toast({ title: "SORTEIO CONCLUÍDO!", description: `Número: ${winningNum} - Ganhador: ${winnerName}` });
  };

  if (!rifa) return <div className="h-screen flex items-center justify-center font-black uppercase text-primary">Aguardando Cloud...</div>;

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <Link href="/admin/rifa" className="flex items-center gap-2 text-primary font-black text-[10px] uppercase"><ArrowLeft className="w-3 h-3" /> Voltar</Link>
            <Badge className="bg-primary text-white h-8 px-6 font-black uppercase text-[10px]">GLOBO VIRTUAL</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[3rem] bg-primary text-white p-12 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Database className="w-24 h-24" /></div>
               <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-4">Número Sorteado</p>
               <div className={cn(
                 "w-48 h-48 rounded-full bg-white text-primary flex items-center justify-center font-black border-8 border-accent shadow-xl transition-all duration-300",
                 isSpinning ? "animate-bounce scale-110" : "scale-100",
                 rifa.tipo === 'fazendinha' ? "text-2xl" : "text-6xl"
               )}>
                 {currentNum || '--'}
               </div>
               {!finished && (
                 <Button onClick={startSorteio} disabled={isSpinning} className="mt-8 bg-accent hover:bg-accent/90 h-16 px-12 rounded-2xl font-black uppercase text-lg shadow-xl gap-3">
                   <Play className="w-6 h-6" /> {isSpinning ? "SORTEANDO..." : "RODAR GLOBO"}
                 </Button>
               )}
            </Card>

            <div className="space-y-4">
               <Card className="rounded-[2.5rem] bg-white p-8 shadow-lg border-none">
                  <h3 className="text-sm font-black uppercase text-primary mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-accent" /> Resultado Oficial</h3>
                  {finished ? (
                    <div className="space-y-4">
                       <div className="p-4 bg-green-50 border-2 border-green-200 rounded-2xl">
                          <p className="text-[10px] font-black uppercase text-green-600">Ganhador</p>
                          <p className="text-xl font-black text-primary">{winner?.nome}</p>
                       </div>
                       <div className="p-4 bg-muted/20 rounded-2xl">
                          <p className="text-[10px] font-black uppercase opacity-60">Número da Sorte</p>
                          <p className="text-2xl font-black text-primary">{winner?.numero} - {rifa.tipo === 'fazendinha' ? ANIMAIS_FAZENDINHA[winner?.numero - 1] : 'NUMÉRICA'}</p>
                       </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center opacity-30">
                       <RefreshCcw className="w-12 h-12 mx-auto mb-2 animate-spin" />
                       <p className="font-black uppercase text-xs">Aguardando Sorteio Live</p>
                    </div>
                  )}
               </Card>
               
               <Card className="rounded-[2rem] bg-white p-6 shadow-sm">
                  <p className="text-[9px] font-black uppercase opacity-60 mb-2">Detalhes da Campanha</p>
                  <p className="font-black text-primary uppercase text-sm">{rifa.nome}</p>
                  <p className="text-xs font-bold text-muted-foreground mt-2 leading-relaxed">{rifa.descricao || 'Sem descrição cadastrada.'}</p>
               </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
