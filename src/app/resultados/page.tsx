
"use client"

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Trophy, ArrowLeft, CheckCircle2, Ticket, Clock, XCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

function ResultadosContent() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [receipt, setReceipt] = useState<any>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = (searchCode?: string) => {
    const codeToSearch = searchCode || code;
    if (codeToSearch.length < 11) return;

    setLoading(true);
    setSearched(true);
    
    // Simula delay de rede para ficar mais profissional
    setTimeout(() => {
      const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
      let foundReceipt = null;

      allReceipts.forEach((r: any) => {
        const ticket = r.tickets.find((t: any) => t.id === codeToSearch);
        if (ticket) foundReceipt = r;
      });

      setReceipt(foundReceipt);
      setLoading(false);
    }, 600);
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
      <div className="max-w-3xl w-full space-y-8">
        <Link href="/" className="flex items-center gap-2 text-primary hover:underline font-black text-xs uppercase transition-all">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </Link>

        <div className="text-center space-y-4">
          <div className="bg-primary text-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl mb-4 rotate-3">
             <Trophy className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-black font-headline uppercase text-primary leading-tight tracking-tighter">Central de Resultados</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Acompanhamento LEOBET PRO em Tempo Real</p>
        </div>

        <Card className="border-t-[12px] border-t-accent shadow-2xl overflow-hidden rounded-[2.5rem] border-none">
          <CardContent className="p-8 md:p-12 space-y-10">
            <div className="space-y-4">
               <label className="text-xs font-black uppercase text-muted-foreground block text-center opacity-60">Insira o código de 11 dígitos do seu bilhete</label>
               <div className="flex flex-col md:flex-row gap-3">
                <Input 
                  placeholder="EX: 45151322893" 
                  className="h-16 font-black text-center text-3xl tracking-[0.4em] border-2 focus:border-primary rounded-2xl uppercase shadow-inner" 
                  maxLength={11}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
                <Button onClick={() => handleSearch()} className="h-16 bg-primary hover:bg-primary/90 font-black uppercase px-12 rounded-2xl shadow-xl transition-all active:scale-95" disabled={loading}>
                  {loading ? <Clock className="animate-spin w-6 h-6" /> : <Search className="w-7 h-7" />}
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center gap-4 animate-pulse">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                   <Clock className="w-8 h-8 text-primary" />
                </div>
                <p className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Consultando Base de Dados...</p>
              </div>
            ) : receipt ? (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
                <div className="bg-primary/5 p-8 rounded-[2rem] border-2 border-primary/10 space-y-6 relative overflow-hidden">
                   <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full"></div>
                   <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                      <div className="text-center md:text-left">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Apostador Oficial</p>
                        <p className="font-black text-primary text-3xl tracking-tight leading-none">{receipt.cliente.toUpperCase()}</p>
                      </div>
                      <div className="text-center md:text-right bg-white px-6 py-4 rounded-2xl shadow-sm border border-primary/10">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Investido</p>
                        <p className="font-black text-primary text-2xl">R$ {receipt.valorTotal.toFixed(2)}</p>
                      </div>
                   </div>
                   <div className="border-t border-primary/10 pt-6 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Concurso Ativo</p>
                        <p className="font-black uppercase text-lg text-primary">{receipt.eventoNome}</p>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-none font-black uppercase h-8 px-4">
                        {receipt.status === 'pago' ? 'VALIDADO' : 'AGUARDANDO'}
                      </Badge>
                   </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xs font-black uppercase text-muted-foreground tracking-[0.3em]">Minhas Apostas ({receipt.tickets.length})</h3>
                     <Badge variant="outline" className="font-black text-[9px] uppercase border-dashed">ID COMPRA: {receipt.id}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {receipt.tickets.map((t: any, idx: number) => {
                      const status = t.status || receipt.status;
                      const isWinner = status === 'ganhou' || status === 'pago';
                      
                      return (
                        <Card key={idx} className={`rounded-3xl border-2 transition-all hover:shadow-xl overflow-hidden ${
                          status === 'ganhou' ? 'bg-green-50 border-green-200 ring-4 ring-green-100' : 
                          status === 'pago' ? 'bg-blue-50 border-blue-200' : 
                          status === 'perdeu' ? 'bg-red-50/30 border-red-100 opacity-80' :
                          'bg-white border-muted-foreground/10'
                        }`}>
                           <CardContent className="p-0">
                             <div className="flex flex-col md:flex-row items-stretch">
                               <div className="p-6 flex-1 space-y-4">
                                  <div className="flex justify-between items-center">
                                     <div className="flex items-center gap-2">
                                       <Ticket className="w-4 h-4 text-primary opacity-40" />
                                       <span className="font-black text-[10px] uppercase text-muted-foreground tracking-widest">Bilhete #{idx + 1} • {t.id}</span>
                                     </div>
                                     {status === 'ganhou' ? (
                                       <Badge className="bg-green-600 font-black uppercase text-[10px] animate-bounce">🔥 VOCÊ GANHOU!</Badge>
                                     ) : status === 'pago' ? (
                                       <Badge className="bg-blue-600 font-black uppercase text-[10px]">💰 PRÊMIO RESGATADO</Badge>
                                     ) : status === 'perdeu' ? (
                                       <Badge variant="destructive" className="font-black uppercase text-[10px]">NÃO PREMIADO</Badge>
                                     ) : (
                                       <Badge className="bg-orange-500 font-black uppercase text-[10px] flex gap-1">
                                          <Clock className="w-3 h-3" /> EM DISPUTA
                                       </Badge>
                                     )}
                                  </div>

                                  {t.numeros ? (
                                    <div className="grid grid-cols-5 md:grid-cols-15 gap-2">
                                      {t.numeros.map((n: number) => (
                                        <div key={n} className="aspect-square flex items-center justify-center bg-white border-2 rounded-xl font-black text-sm text-primary shadow-sm hover:scale-110 transition-transform cursor-default">
                                          {n.toString().padStart(2, '0')}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="p-6 bg-muted/30 rounded-2xl text-center font-mono font-black text-3xl tracking-[0.5em] text-primary border-2 border-dashed">
                                      {t.palpite}
                                    </div>
                                  )}
                               </div>

                               {isWinner && (
                                 <div className={`p-6 flex flex-col items-center justify-center border-l-2 md:w-48 text-center ${status === 'ganhou' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                                    {status === 'ganhou' ? (
                                      <>
                                        <CheckCircle2 className="w-10 h-10 mb-2" />
                                        <p className="font-black uppercase text-[10px] tracking-widest leading-tight">Vá até o seu<br/>cambista!</p>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-10 h-10 mb-2" />
                                        <p className="font-black uppercase text-[10px] tracking-widest">Saldo Creditado</p>
                                      </>
                                    )}
                                 </div>
                               )}
                             </div>
                           </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <div className="p-10 bg-primary text-white rounded-[3rem] text-center shadow-2xl space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-full bg-accent opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  <Info className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-[11px] font-black uppercase tracking-[0.5em] opacity-80">Suporte e Recebimento Oficial</p>
                  <p className="font-black text-4xl mt-1 tracking-tighter">(82) 99334-3941</p>
                  <p className="text-xs font-bold uppercase opacity-60 max-w-sm mx-auto">
                    Para resgatar seu prêmio, apresente seu código de 11 dígitos ao seu cambista ou entre em contato direto.
                  </p>
                </div>
              </div>
            ) : searched && code.length === 11 && (
              <div className="text-center py-20 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-8 opacity-20">
                   <XCircle className="w-12 h-12" />
                </div>
                <h3 className="font-black uppercase text-muted-foreground tracking-widest text-2xl">Bilhete não encontrado</h3>
                <p className="text-sm font-bold text-muted-foreground mt-4 max-w-xs mx-auto opacity-60">
                  Verifique se o código de 11 dígitos está correto. Caso o concurso seja muito recente, aguarde 1 minuto para o sistema processar.
                </p>
                <Button variant="link" onClick={() => setSearched(false)} className="mt-8 font-black uppercase text-primary">Tentar Novamente</Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <p className="text-center text-[9px] font-black uppercase text-muted-foreground/40 tracking-[0.5em] pt-8">
           LEOBET PRO © SISTEMA DE AUDITORIA PERMANENTE 365 DIAS
        </p>
      </div>
    </div>
  );
}

export default function ResultadosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black uppercase text-xs">Conectando ao Globo LEOBET...</div>}>
      <ResultadosContent />
    </Suspense>
  );
}
