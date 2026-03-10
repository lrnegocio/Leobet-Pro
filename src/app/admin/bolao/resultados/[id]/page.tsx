
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Trophy, CheckCircle2, History, AlertTriangle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function ResultadosBolaoPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise);
  const { toast } = useToast();
  const [bolao, setBolao] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [results, setResults] = useState<string[]>(Array(10).fill(''));
  const [saving, setSaving] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem('leobet_boloes') || '[]');
    const current = all.find((b: any) => String(b.id) === String(params.id));
    setBolao(current);

    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    setTickets(allReceipts.filter((r: any) => String(r.eventoId) === String(params.id) && r.status === 'pago'));

    if (current?.resultados) {
      setResults(current.resultados);
    }
  }, [params.id]);

  const totalArrecadado = useMemo(() => {
    return tickets.reduce((acc, t) => acc + (t.valorTotal || 0), 0);
  }, [tickets]);

  const premios = useMemo(() => {
    const pool = totalArrecadado * 0.65;
    return {
      bronze: pool * 0.20,
      prata: pool * 0.30,
      ouro: pool * 0.50
    };
  }, [totalArrecadado]);

  const handleUpdateResult = (index: number, val: string) => {
    const newResults = [...results];
    newResults[index] = val.toUpperCase();
    setResults(newResults);
  };

  const calculateWinners = () => {
    if (results.some(r => !r)) {
      toast({ variant: "destructive", title: "PLACAR INCOMPLETO", description: "Informe o resultado (1, X ou 2) para todos os jogos." });
      return;
    }

    setSaving(true);
    
    setTimeout(() => {
      const levelHits = { ouro: 10, prata: 9, bronze: 8 };
      const roundWinners: any = { ouro: [], prata: [], bronze: [] };

      tickets.forEach(receipt => {
        receipt.tickets.forEach((t: any) => {
          if (!t.palpite) return;
          const userGuesses = t.palpite.split('-');
          let hits = 0;
          userGuesses.forEach((g: string, i: number) => {
            if (g === results[i]) hits++;
          });

          if (hits === 10) roundWinners.ouro.push({ ticketId: t.id, cliente: receipt.cliente, userId: receipt.vendedorId });
          else if (hits === 9) roundWinners.prata.push({ ticketId: t.id, cliente: receipt.cliente, userId: receipt.vendedorId });
          else if (hits === 8) roundWinners.bronze.push({ ticketId: t.id, cliente: receipt.cliente, userId: receipt.vendedorId });
        });
      });

      // Atualiza status e prêmios dos ganhadores
      const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
      const updatedReceipts = allReceipts.map((r: any) => {
        if (String(r.eventoId) !== String(params.id)) return r;
        return {
          ...r,
          tickets: r.tickets.map((t: any) => {
            let winLevel: 'ouro' | 'prata' | 'bronze' | null = null;
            if (roundWinners.ouro.find((w: any) => w.ticketId === t.id)) winLevel = 'ouro';
            else if (roundWinners.prata.find((w: any) => w.ticketId === t.id)) winLevel = 'prata';
            else if (roundWinners.bronze.find((w: any) => w.ticketId === t.id)) winLevel = 'bronze';

            if (winLevel) {
              const count = roundWinners[winLevel].length;
              const individual = premios[winLevel] / count;
              return { ...t, status: 'ganhou', valorPremio: individual };
            }
            return { ...t, status: 'perdeu' };
          })
        };
      });

      localStorage.setItem('leobet_tickets', JSON.stringify(updatedReceipts));

      // Salva resultados no bolão
      const allBoloes = JSON.parse(localStorage.getItem('leobet_boloes') || '[]');
      const updatedBoloes = allBoloes.map((b: any) => 
        String(b.id) === String(params.id) ? { ...b, resultados: results, status: 'finalizado' } : b
      );
      localStorage.setItem('leobet_boloes', JSON.stringify(updatedBoloes));

      setBolao({ ...bolao, status: 'finalizado', resultados: results });
      setSaving(false);
      toast({ title: "AUDITORIA FINALIZADA!", description: "Ganhadores identificados e prêmios creditados." });
    }, 1000);
  };

  if (!bolao) return null;

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Link href="/admin/bolao" className="flex items-center gap-2 text-primary hover:underline font-black text-xs uppercase">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black uppercase text-primary leading-none">{bolao.nome}</h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Lançamento de Resultados Oficiais</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-muted-foreground">Arrecadação Líquida (Prêmios)</p>
              <p className="text-xl font-black text-green-600">R$ {(totalArrecadado * 0.65).toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-t-4 border-t-accent shadow-xl">
              <CardHeader><CardTitle className="text-sm font-black uppercase">Placar da Rodada (1 - X - 2)</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {Array.from({ length: 10 }).map((_, i) => (
                   <div key={i} className="flex items-center gap-3 p-3 bg-white border rounded-xl hover:border-accent transition-all">
                      <Badge className="font-black text-[9px] h-6 w-8 justify-center">#{i+1}</Badge>
                      <Input 
                        placeholder="Resultado" 
                        value={results[i]} 
                        onChange={e => handleUpdateResult(i, e.target.value)} 
                        maxLength={1}
                        className="h-10 text-center font-black text-xl border-primary/20 w-16"
                        disabled={bolao.status === 'finalizado'}
                      />
                      <p className="text-[9px] font-bold text-muted-foreground uppercase leading-tight">Vencedor:<br/>1, X ou 2</p>
                   </div>
                 ))}
              </CardContent>
              {bolao.status !== 'finalizado' && (
                <div className="p-6 border-t bg-muted/30">
                  <Button onClick={calculateWinners} disabled={saving} className="w-full h-14 bg-accent hover:bg-accent/90 font-black uppercase text-lg shadow-lg">
                    {saving ? "PROCESSANDO AUDITORIA..." : "FINALIZAR E IDENTIFICAR GANHADORES"}
                  </Button>
                </div>
              )}
            </Card>

            <div className="space-y-4">
               <Card className="bg-primary text-white border-none shadow-xl rounded-2xl">
                 <CardHeader><CardTitle className="text-xs font-black uppercase text-white/60">Estimativa de Prêmios</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                       <span className="text-[10px] font-black uppercase">10 HITS (OURO)</span>
                       <span className="font-black">R$ {premios.ouro.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                       <span className="text-[10px] font-black uppercase">09 HITS (PRATA)</span>
                       <span className="font-black">R$ {premios.prata.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-[10px] font-black uppercase">08 HITS (BRONZE)</span>
                       <span className="font-black">R$ {premios.bronze.toFixed(2)}</span>
                    </div>
                 </CardContent>
               </Card>

               <Card className="border-none shadow-sm bg-orange-50 border-orange-200">
                  <CardContent className="p-4 flex gap-3">
                     <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
                     <p className="text-[9px] font-bold text-orange-800 uppercase leading-relaxed">
                       A conferência é definitiva. Certifique-se de que os placares estão corretos conforme a súmula oficial antes de finalizar.
                     </p>
                  </CardContent>
               </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
