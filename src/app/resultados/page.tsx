
"use client"

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Trophy, XCircle, Clock, ArrowLeft, CheckCircle2, Ticket } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

function ResultadosContent() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const ticketCode = searchParams.get('c');
    if (ticketCode) {
      setCode(ticketCode);
      handleSearch(ticketCode);
    }
  }, [searchParams]);

  const handleSearch = (searchCode?: string) => {
    const codeToSearch = searchCode || code;
    if (codeToSearch.length < 11) return;

    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    let found = null;

    allReceipts.forEach((receipt: any) => {
      const ticket = receipt.tickets.find((t: any) => t.id === codeToSearch);
      if (ticket) {
        found = { 
          ...ticket, 
          receiptInfo: receipt,
          currentStatus: ticket.status || receipt.status 
        };
      }
    });

    setResult(found);
    setSearched(true);
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-2xl w-full space-y-8">
        <Link href="/" className="flex items-center gap-2 text-primary hover:underline font-bold transition-all">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </Link>

        <div className="text-center space-y-2">
          <div className="bg-primary text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4">
             <Trophy className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black font-headline uppercase text-primary leading-tight tracking-tighter">Central de Resultados</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em]">Confira seu prêmio em tempo real</p>
        </div>

        <Card className="border-t-8 border-t-accent shadow-2xl overflow-hidden rounded-3xl">
          <CardContent className="p-8 space-y-8">
            <div className="space-y-4">
               <label className="text-xs font-black uppercase text-muted-foreground block text-center">Insira o código do seu bilhete</label>
               <div className="flex gap-2">
                <Input 
                  placeholder="DIGITE OS 11 DÍGITOS" 
                  className="h-16 font-black text-center text-2xl tracking-[0.3em] border-2 focus:border-primary rounded-2xl uppercase" 
                  maxLength={11}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
                <Button onClick={() => handleSearch()} className="h-16 bg-primary hover:bg-primary/90 font-black uppercase px-8 rounded-2xl shadow-lg">
                  <Search className="w-6 h-6" />
                </Button>
              </div>
            </div>

            {result ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <div className={`p-8 rounded-3xl border-4 border-dashed relative overflow-hidden ${
                  result.currentStatus === 'ganhou' ? 'bg-green-50 border-green-200' : 
                  result.currentStatus === 'pago' ? 'bg-blue-50 border-blue-200' : 'bg-muted/50 border-muted'
                }`}>
                  <div className="flex justify-between items-center relative z-10">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Status do Bilhete</p>
                      {result.currentStatus === 'ganhou' ? (
                        <div className="flex items-center gap-3 text-green-600 font-black uppercase text-2xl">
                          <Trophy className="w-8 h-8 animate-bounce" /> VOCÊ GANHOU!
                        </div>
                      ) : result.currentStatus === 'pago' ? (
                        <div className="flex items-center gap-3 text-blue-600 font-black uppercase text-2xl">
                          <CheckCircle2 className="w-8 h-8" /> PRÊMIO PAGO
                        </div>
                      ) : result.currentStatus === 'perdeu' ? (
                        <div className="flex items-center gap-3 text-destructive font-black uppercase text-2xl">
                          <XCircle className="w-8 h-8" /> NÃO PREMIADO
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-orange-600 font-black uppercase text-2xl">
                          <Clock className="w-8 h-8" /> EM ABERTO
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Valor Estimado</p>
                      <p className={`font-black text-3xl ${result.currentStatus === 'ganhou' || result.currentStatus === 'pago' ? 'text-primary' : 'text-muted-foreground'}`}>
                        R$ {result.receiptInfo.valorTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-white p-6 rounded-2xl border-2 border-primary/10 shadow-sm flex flex-col items-center gap-2">
                      <p className="text-[9px] font-black uppercase text-muted-foreground">Concurso</p>
                      <p className="font-black text-primary uppercase text-center leading-tight">{result.receiptInfo.eventoNome}</p>
                   </div>
                   <div className="bg-white p-6 rounded-2xl border-2 border-primary/10 shadow-sm flex flex-col items-center gap-2">
                      <p className="text-[9px] font-black uppercase text-muted-foreground">Identificação</p>
                      <p className="font-black text-primary uppercase">{result.id}</p>
                   </div>
                </div>

                {result.numeros && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4">
                       <div className="h-[2px] bg-muted flex-1"></div>
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Sua Cartela</p>
                       <div className="h-[2px] bg-muted flex-1"></div>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      {result.numeros.map((n: number) => (
                        <div key={n} className="aspect-square flex items-center justify-center bg-white border-2 border-primary/20 rounded-2xl font-black text-xl text-primary shadow-sm hover:border-accent hover:scale-105 transition-all">
                          {n.toString().padStart(2, '0')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.palpite && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4">
                       <div className="h-[2px] bg-muted flex-1"></div>
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Seu Palpite (1-X-2)</p>
                       <div className="h-[2px] bg-muted flex-1"></div>
                    </div>
                    <div className="p-6 bg-primary text-white text-center rounded-3xl font-mono text-4xl tracking-[0.5em] shadow-xl border-4 border-white/20">
                      {result.palpite}
                    </div>
                  </div>
                )}

                <div className="p-8 bg-accent text-white rounded-3xl text-center shadow-xl space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Suporte e Recebimento</p>
                  <p className="font-black text-2xl mt-1 tracking-tighter">(82) 99334-3941</p>
                  <p className="text-[9px] font-bold uppercase opacity-60">Procure um cambista oficial com seu código de 11 dígitos.</p>
                </div>
              </div>
            ) : searched && code.length === 11 && (
              <div className="text-center py-20 animate-in fade-in zoom-in-95">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 opacity-20">
                   <Ticket className="w-10 h-10" />
                </div>
                <h3 className="font-black uppercase text-muted-foreground tracking-widest text-lg">Bilhete não encontrado</h3>
                <p className="text-xs font-bold text-muted-foreground mt-2 max-w-xs mx-auto">
                  Verifique se digitou corretamente o código de 11 dígitos impresso no seu recibo.
                </p>
                <Button variant="link" onClick={() => setSearched(false)} className="mt-4 text-primary font-black uppercase">Tentar novamente</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResultadosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando Resultados...</div>}>
      <ResultadosContent />
    </Suspense>
  );
}
