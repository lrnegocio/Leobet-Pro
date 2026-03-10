
"use client"

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Trophy, ArrowLeft, CheckCircle2, Ticket, Clock, XCircle, Info, AlertTriangle, Youtube } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

function ResultadosContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [receipt, setReceipt] = useState<any>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [pixKey, setPixKey] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const handleSearch = (searchCode?: string) => {
    const codeToSearch = searchCode || code;
    if (codeToSearch.length < 11) return;

    setLoading(true);
    setSearched(true);
    
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
    const settings = JSON.parse(localStorage.getItem('leobet_settings') || '{}');
    setYoutubeUrl(settings.youtubeUrl || '');

    const ticketCode = searchParams.get('c');
    if (ticketCode) {
      setCode(ticketCode);
      handleSearch(ticketCode);
    }
  }, [searchParams]);

  const handleClaim = (ticketId: string) => {
    if (!pixKey || pixKey.trim().length < 5) {
      toast({ variant: "destructive", title: "CHAVE PIX OBRIGATÓRIA" });
      return;
    }

    setClaiming(ticketId);
    setTimeout(() => {
      const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
      const updated = allReceipts.map((r: any) => {
        if (!r.tickets.find((t: any) => t.id === ticketId)) return r;
        return {
          ...r,
          tickets: r.tickets.map((t: any) => 
            t.id === ticketId ? { ...t, status: 'pendente-resgate', pixResgate: pixKey } : t
          )
        };
      });
      localStorage.setItem('leobet_tickets', JSON.stringify(updated));
      handleSearch(ticketId);
      setClaiming(null);
      toast({ title: "SOLICITAÇÃO ENVIADA!", description: "Aguarde a conferência e pagamento do Admin." });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8 flex flex-col items-center font-body">
      <div className="max-w-3xl w-full space-y-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-primary hover:underline font-black text-xs uppercase transition-all">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Início
          </Link>
          {youtubeUrl && (
            <Button onClick={() => window.open(youtubeUrl, '_blank')} className="bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] h-9 gap-2 rounded-xl shadow-lg">
              <Youtube className="w-4 h-4" /> Assistir Sorteio ao Vivo
            </Button>
          )}
        </div>

        <div className="text-center space-y-4">
          <div className="bg-primary text-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl mb-4">
             <Trophy className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-black font-headline uppercase text-primary leading-tight tracking-tighter">Central de Auditoria</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Conferência em Tempo Real 365 Dias</p>
        </div>

        <Card className="border-t-[12px] border-t-accent shadow-2xl overflow-hidden rounded-[2.5rem] border-none">
          <CardContent className="p-8 md:p-12 space-y-10">
            <div className="space-y-4">
               <label className="text-xs font-black uppercase text-muted-foreground block text-center opacity-60">Insira o código do seu bilhete</label>
               <div className="flex flex-col md:flex-row gap-3">
                <Input 
                  placeholder="CÓDIGO DO BILHETE" 
                  className="h-16 font-black text-center text-3xl tracking-[0.4em] border-2 focus:border-primary rounded-2xl uppercase shadow-inner" 
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
                <Button onClick={() => handleSearch()} className="h-16 bg-primary hover:bg-primary/90 font-black uppercase px-12 rounded-2xl shadow-xl" disabled={loading}>
                  {loading ? <Clock className="animate-spin w-6 h-6" /> : <Search className="w-7 h-7" />}
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <Clock className="w-12 h-12 text-primary animate-spin" />
                <p className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Consultando Auditoria...</p>
              </div>
            ) : receipt ? (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
                <div className="bg-primary/5 p-8 rounded-[2rem] border-2 border-primary/10 space-y-6 relative overflow-hidden">
                   <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                      <div className="text-center md:text-left">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Apostador</p>
                        <p className="font-black text-primary text-3xl tracking-tight leading-none">{receipt.cliente.toUpperCase()}</p>
                      </div>
                      <div className="text-center md:text-right bg-white px-6 py-4 rounded-2xl shadow-sm border border-primary/10">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Valor do Bilhete</p>
                        <p className="font-black text-primary text-2xl">R$ {receipt.valorTotal.toFixed(2)}</p>
                      </div>
                   </div>
                   <div className="border-t border-primary/10 pt-6 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Evento</p>
                        <p className="font-black uppercase text-lg text-primary">{receipt.eventoNome}</p>
                      </div>
                      <Badge className={`${receipt.status === 'pago' ? 'bg-primary' : 'bg-orange-600'} text-white border-none font-black uppercase h-8 px-4 rounded-xl`}>
                        {receipt.status === 'pago' ? '✓ VALIDADO' : '⚠ AGUARDANDO PAGAMENTO'}
                      </Badge>
                   </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xs font-black uppercase text-muted-foreground tracking-[0.3em]">Minhas Apostas ({receipt.tickets.length})</h3>
                     <Badge variant="outline" className="font-black text-[9px] uppercase border-dashed">ID RECIBO: {receipt.id}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {receipt.tickets.map((t: any, idx: number) => {
                      const isWinner = t.status === 'ganhou';
                      const isPending = t.status === 'pendente-resgate';
                      const isPaid = t.status === 'pago';
                      const isLost = t.status === 'perdeu';
                      
                      return (
                        <Card key={idx} className={`rounded-[2rem] border-2 transition-all hover:shadow-xl overflow-hidden ${
                          isWinner ? 'bg-green-50 border-green-200 ring-4 ring-green-100 shadow-green-100' : 
                          isPaid ? 'bg-blue-50 border-blue-200' : 
                          isPending ? 'bg-orange-50 border-orange-200' :
                          isLost ? 'bg-red-50/30 border-red-100 opacity-80' :
                          'bg-white border-muted-foreground/10'
                        }`}>
                           <CardContent className="p-0">
                             <div className="flex flex-col md:flex-row items-stretch">
                               <div className="p-6 flex-1 space-y-4">
                                  <div className="flex justify-between items-center">
                                     <div className="flex items-center gap-2">
                                       <Ticket className="w-4 h-4 text-primary opacity-40" />
                                       <span className="font-black text-[10px] uppercase text-muted-foreground tracking-widest">Bilhete {idx + 1} • {t.id}</span>
                                     </div>
                                     {isWinner ? (
                                       <Badge className="bg-green-600 font-black uppercase text-[10px] animate-pulse">🔥 PREMIADO!</Badge>
                                     ) : isPaid ? (
                                       <Badge className="bg-blue-600 font-black uppercase text-[10px]">✓ PRÊMIO PAGO</Badge>
                                     ) : isPending ? (
                                       <Badge className="bg-orange-600 font-black uppercase text-[10px]">⌚ RESGATE PENDENTE</Badge>
                                     ) : isLost ? (
                                       <Badge variant="destructive" className="font-black uppercase text-[10px]">NÃO PREMIADO</Badge>
                                     ) : (
                                       <Badge className="bg-primary/20 text-primary font-black uppercase text-[10px] flex gap-1">
                                          <Clock className="w-3 h-3" /> EM DISPUTA
                                       </Badge>
                                     )}
                                  </div>

                                  {t.numeros ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {t.numeros.map((n: number) => (
                                        <div key={n} className="w-8 h-8 flex items-center justify-center bg-white border-2 rounded-xl font-black text-[10px] text-primary shadow-sm">
                                          {n.toString().padStart(2, '0')}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="p-4 bg-muted/30 rounded-2xl text-center font-mono font-black text-2xl tracking-[0.5em] text-primary border-2 border-dashed">
                                      {t.palpite}
                                    </div>
                                  )}
                               </div>

                               {(isWinner || isPending || isPaid) && (
                                 <div className={`p-6 flex flex-col items-center justify-center border-l-2 md:w-80 text-center ${
                                   isWinner ? 'bg-green-600' : isPaid ? 'bg-blue-600' : 'bg-orange-600'
                                 } text-white`}>
                                    {isWinner ? (
                                      <div className="w-full space-y-4">
                                        <div>
                                          <p className="font-black uppercase text-[9px] tracking-widest opacity-60">Seu Prêmio:</p>
                                          <p className="text-3xl font-black">R$ {(t.valorPremio || 0).toFixed(2)}</p>
                                        </div>
                                        
                                        <div className="text-left space-y-1.5">
                                           <Label className="text-[10px] font-black uppercase text-white/70">Digite seu PIX para receber:</Label>
                                           <Input 
                                            value={pixKey} 
                                            onChange={e => setPixKey(e.target.value)}
                                            placeholder="CPF, Email ou Celular"
                                            className="h-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 text-xs font-bold"
                                           />
                                        </div>

                                        <p className="text-[8px] font-bold text-white/50 flex items-start gap-1 leading-tight text-left">
                                          <AlertTriangle className="w-3 h-3 shrink-0" />
                                          Atenção: A banca não se responsabiliza por erros de digitação.
                                        </p>

                                        <Button 
                                          onClick={() => handleClaim(t.id)} 
                                          className="bg-white text-green-700 hover:bg-white/90 font-black uppercase text-[10px] h-12 w-full rounded-xl shadow-lg"
                                          disabled={claiming === t.id}
                                        >
                                          {claiming === t.id ? "REQUISITANDO..." : "SOLICITAR PAGAMENTO"}
                                        </Button>
                                      </div>
                                    ) : isPaid ? (
                                      <>
                                        <CheckCircle2 className="w-10 h-10 mb-2" />
                                        <p className="font-black uppercase text-[10px] tracking-widest leading-tight">PREMIAÇÃO PAGA!</p>
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-10 h-10 mb-2 animate-pulse" />
                                        <p className="font-black uppercase text-[10px] tracking-widest">RESGATE PENDENTE</p>
                                        <p className="text-[8px] mt-2 opacity-50 uppercase font-black">Chave: {t.pixResgate}</p>
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

                <div className="p-10 bg-primary text-white rounded-[3rem] text-center shadow-2xl space-y-4 relative overflow-hidden">
                  <Info className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-[11px] font-black uppercase tracking-[0.5em] opacity-80">Suporte ao Apostador</p>
                  <p className="font-black text-4xl mt-1 tracking-tighter">(82) 99334-3941</p>
                </div>
              </div>
            ) : searched && (
              <div className="text-center py-20">
                <XCircle className="w-24 h-24 mx-auto mb-8 opacity-20" />
                <h3 className="font-black uppercase text-muted-foreground tracking-widest text-2xl">Bilhete Não Localizado</h3>
                <Button variant="link" onClick={() => setSearched(false)} className="mt-8 font-black uppercase text-primary">Tentar Novamente</Button>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black uppercase text-xs">Conectando ao Globo LEOBET...</div>}>
      <ResultadosContent />
    </Suspense>
  );
}
