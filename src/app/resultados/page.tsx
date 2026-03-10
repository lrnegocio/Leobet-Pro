
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
  const [receipt, setReceipt] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (searchCode?: string) => {
    const codeToSearch = searchCode || code;
    if (codeToSearch.length < 11) return;

    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    let foundReceipt = null;
    let foundTicket = null;

    allReceipts.forEach((r: any) => {
      const ticket = r.tickets.find((t: any) => t.id === codeToSearch);
      if (ticket) {
        foundReceipt = r;
        foundTicket = ticket;
      }
    });

    if (foundReceipt) {
      setReceipt(foundReceipt);
      setResult(foundTicket);
    } else {
      setReceipt(null);
      setResult(null);
    }
    setSearched(true);
  };

  useEffect(() => {
    const ticketCode = searchParams.get('c');
    if (ticketCode) {
      setCode(ticketCode);
      handleSearch(ticketCode);
    }
  }, [searchParams]);

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
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em]">Confira suas apostas em tempo real</p>
        </div>

        <Card className="border-t-8 border-t-accent shadow-2xl overflow-hidden rounded-3xl">
          <CardContent className="p-8 space-y-8">
            <div className="space-y-4">
               <label className="text-xs font-black uppercase text-muted-foreground block text-center">Insira o código de qualquer bilhete do seu recibo</label>
               <div className="flex gap-2">
                <Input 
                  placeholder="DIGITE OS 11 DÍDIGITOS" 
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

            {receipt ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                <div className="bg-primary/5 p-6 rounded-3xl border-2 border-primary/10 space-y-4">
                   <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Cliente</p>
                        <p className="font-black text-primary text-lg">{receipt.cliente.toUpperCase()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Valor Total</p>
                        <p className="font-black text-primary text-lg">R$ {receipt.valorTotal.toFixed(2)}</p>
                      </div>
                   </div>
                   <div className="border-t pt-4">
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Concurso</p>
                      <p className="font-black uppercase text-sm">{receipt.eventoNome}</p>
                   </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-center text-xs font-black uppercase text-muted-foreground tracking-widest">Suas Apostas ({receipt.tickets.length})</h3>
                  {receipt.tickets.map((t: any, idx: number) => {
                    const status = t.status || receipt.status;
                    return (
                      <div key={idx} className={`p-6 rounded-2xl border-2 transition-all ${
                        status === 'ganhou' ? 'bg-green-50 border-green-200 shadow-md' : 
                        status === 'pago' ? 'bg-blue-50 border-blue-200' : 'bg-white border-muted'
                      }`}>
                         <div className="flex justify-between items-center mb-4">
                            <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest border-primary/20">BILHETE {idx + 1} - {t.id}</Badge>
                            {status === 'ganhou' ? (
                              <Badge className="bg-green-600 font-black uppercase text-[9px]">GANHOU!</Badge>
                            ) : status === 'pago' ? (
                              <Badge className="bg-blue-600 font-black uppercase text-[9px]">PAGO</Badge>
                            ) : status === 'perdeu' ? (
                              <Badge variant="destructive" className="font-black uppercase text-[9px]">PERDEU</Badge>
                            ) : (
                              <Badge className="bg-orange-500 font-black uppercase text-[9px]">ABERTO</Badge>
                            )}
                         </div>

                         {t.numeros ? (
                           <div className="grid grid-cols-5 gap-2">
                             {t.numeros.map((n: number) => (
                               <div key={n} className="aspect-square flex items-center justify-center bg-white border rounded-xl font-bold text-sm text-primary shadow-sm">
                                 {n.toString().padStart(2, '0')}
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="p-4 bg-muted rounded-xl text-center font-mono font-black text-xl tracking-[0.3em]">
                             {t.palpite}
                           </div>
                         )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-8 bg-accent text-white rounded-3xl text-center shadow-xl space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Suporte e Recebimento</p>
                  <p className="font-black text-2xl mt-1 tracking-tighter">(82) 99334-3941</p>
                  <p className="text-[9px] font-bold uppercase opacity-60">Vá até o seu cambista ou entre em contato direto.</p>
                </div>
              </div>
            ) : searched && code.length === 11 && (
              <div className="text-center py-20 animate-in fade-in zoom-in-95">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 opacity-20">
                   <Ticket className="w-10 h-10" />
                </div>
                <h3 className="font-black uppercase text-muted-foreground tracking-widest text-lg">Bilhete não encontrado</h3>
                <p className="text-xs font-bold text-muted-foreground mt-2 max-w-xs mx-auto">
                  Verifique se digitou corretamente o código impresso no seu recibo.
                </p>
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
