
"use client"

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Trophy, ArrowLeft, CheckCircle2, Ticket, Clock, XCircle, Info, AlertTriangle, Youtube, Printer, ShieldCheck } from 'lucide-react';
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
  const [eventoData, setEventoData] = useState<any>(null);

  const handleSearch = (searchCode?: string) => {
    const codeToSearch = (searchCode || code).trim().toUpperCase();
    if (codeToSearch.length < 5) return;

    setLoading(true);
    setSearched(true);
    
    setTimeout(() => {
      const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
      let foundReceipt = null;

      allReceipts.forEach((r: any) => {
        const ticketMatch = r.tickets.find((t: any) => String(t.id) === codeToSearch);
        const receiptMatch = String(r.id) === codeToSearch;
        if (ticketMatch || receiptMatch) foundReceipt = r;
      });

      if (foundReceipt) {
        setReceipt(foundReceipt);
        const allBingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]');
        const allBoloes = JSON.parse(localStorage.getItem('leobet_boloes') || '[]');
        const ev = [...allBingos, ...allBoloes].find(e => String(e.id) === String(foundReceipt.eventoId));
        setEventoData(ev);
      } else {
        setReceipt(null);
      }
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
      toast({ title: "SOLICITAÇÃO ENVIADA!", description: "Seu prêmio entrará na fila de pagamento Master." });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8 flex flex-col items-center font-body">
      <div className="max-w-4xl w-full space-y-8">
        <div className="flex justify-between items-center print:hidden">
          <Link href="/" className="flex items-center gap-2 text-primary hover:underline font-black text-xs uppercase">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Início
          </Link>
          {youtubeUrl && (
            <Button onClick={() => window.open(youtubeUrl, '_blank')} className="bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] h-9 gap-2 rounded-xl">
              <Youtube className="w-4 h-4" /> Assistir Ao Vivo
            </Button>
          )}
        </div>

        <div className="text-center space-y-4 print:hidden">
          <div className="bg-primary text-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl mb-4">
             <Trophy className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-black font-headline uppercase text-primary leading-tight tracking-tighter">Central de Auditoria</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Conferência de Bilhetes 365 Dias</p>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-white print:shadow-none print:border-none">
          <CardContent className="p-8 md:p-12 space-y-10">
            <div className="space-y-4 print:hidden">
               <label className="text-xs font-black uppercase text-muted-foreground block text-center opacity-60">Insira o código do seu bilhete ou recibo</label>
               <div className="flex flex-col md:flex-row gap-3">
                <Input 
                  placeholder="CÓDIGO" 
                  className="h-16 font-black text-center text-3xl tracking-[0.4em] border-2 focus:border-primary rounded-2xl uppercase shadow-inner" 
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
                <div className="bg-primary/5 p-8 rounded-[2rem] border-2 border-primary/10 space-y-6">
                   <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="text-center md:text-left">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Apostador</p>
                        <p className="font-black text-primary text-3xl tracking-tight leading-none">{receipt.cliente.toUpperCase()}</p>
                      </div>
                      <div className="text-center md:text-right bg-white px-6 py-4 rounded-2xl shadow-sm border border-primary/10">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Valor do Recibo</p>
                        <p className="font-black text-primary text-2xl">R$ {receipt.valorTotal.toFixed(2)}</p>
                      </div>
                   </div>
                   <div className="border-t border-primary/10 pt-6 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Concurso Oficial</p>
                        <p className="font-black uppercase text-lg text-primary">{receipt.eventoNome}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={`${receipt.status === 'pago' ? 'bg-primary' : 'bg-orange-600'} text-white border-none font-black uppercase h-8 px-4 rounded-xl`}>
                          {receipt.status === 'pago' ? '✓ VALIDADO' : '⚠ AGUARDANDO PAGAMENTO'}
                        </Badge>
                        <p className="text-[9px] font-black uppercase text-muted-foreground">ID Recibo: {receipt.id}</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase text-muted-foreground tracking-[0.3em] px-4">Meus Bilhetes ({receipt.tickets.length})</h3>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {receipt.tickets.map((t: any, idx: number) => {
                      const isWinner = t.status === 'ganhou';
                      const isPending = t.status === 'pendente-resgate';
                      const isPaid = t.status === 'pago';
                      const isLost = t.status === 'perdeu';
                      
                      const guesses = (t.palpite || receipt.palpite || '').split('-');
                      const results = eventoData?.resultados || [];
                      const matches = eventoData?.partidas || [];
                      
                      return (
                        <Card key={idx} className={`rounded-[2.5rem] border-2 transition-all overflow-hidden ${
                          isWinner ? 'bg-green-50 border-green-200 shadow-xl' : 
                          isPaid ? 'bg-blue-50 border-blue-600 shadow-xl' : 
                          isPending ? 'bg-orange-50 border-orange-200' :
                          isLost ? 'bg-red-50/30 border-red-100 opacity-80' :
                          'bg-white border-muted-foreground/10'
                        }`}>
                           <CardContent className="p-0">
                             <div className="flex flex-col md:flex-row items-stretch">
                               <div className="p-8 flex-1 space-y-6">
                                  <div className="flex justify-between items-center">
                                     <div className="flex items-center gap-2">
                                       <Ticket className="w-4 h-4 text-primary opacity-40" />
                                       <span className="font-black text-[10px] uppercase text-muted-foreground">Bilhete ID: {t.id}</span>
                                     </div>
                                     {isWinner ? (
                                       <Badge className="bg-green-600 font-black uppercase text-[10px] animate-bounce">🔥 PREMIADO!</Badge>
                                     ) : isPaid ? (
                                       <Badge className="bg-blue-600 text-white font-black uppercase text-[10px] flex items-center gap-1">
                                          <ShieldCheck className="w-3 h-3" /> ✓ PRÊMIO PAGO
                                       </Badge>
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
                                    <div className="flex flex-wrap gap-2">
                                      {t.numeros.map((n: number) => {
                                        const isDrawn = eventoData?.bolasSorteadas?.includes(n);
                                        return (
                                          <div key={n} className={`w-10 h-10 flex items-center justify-center border-2 rounded-2xl font-black text-sm shadow-sm ${
                                            isDrawn ? 'bg-green-600 border-green-700 text-white' : 'bg-white text-primary'
                                          }`}>
                                            {n.toString().padStart(2, '0')}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                       <p className="text-[10px] font-black uppercase text-muted-foreground">Palpites da Rodada:</p>
                                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                                          {guesses.length > 1 && guesses.map((g: string, i: number) => {
                                            const match = matches[i];
                                            const officialResult = results[i];
                                            const isCorrect = officialResult && officialResult === g;
                                            const isWrong = officialResult && officialResult !== g;
                                            
                                            return (
                                              <div key={i} className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 ${
                                                isCorrect ? 'bg-green-600 border-green-700 text-white shadow-lg' : 
                                                isWrong ? 'bg-red-500 border-red-600 text-white' : 
                                                'bg-white'
                                              }`}>
                                                <div className={`text-[7px] font-black uppercase opacity-60 text-center leading-tight mb-1 truncate w-full ${isCorrect || isWrong ? 'text-white' : ''}`}>
                                                  {match?.time1 || 'CASA'} vs {match?.time2 || 'FORA'}
                                                </div>
                                                <span className="text-xl font-black">{g}</span>
                                                {officialResult && (
                                                  <span className="text-[8px] font-bold uppercase">Oficial: {officialResult}</span>
                                                )}
                                              </div>
                                            );
                                          })}
                                       </div>
                                    </div>
                                  )}
                               </div>

                               {(isWinner || isPending || isPaid) && (
                                 <div className={`p-8 flex flex-col items-center justify-center border-l-2 md:w-80 text-center ${
                                   isWinner ? 'bg-green-600' : isPaid ? 'bg-blue-600' : 'bg-orange-600'
                                 } text-white`}>
                                    {isWinner ? (
                                      <div className="w-full space-y-6">
                                        <div className="bg-white/10 p-4 rounded-2xl">
                                          <p className="font-black uppercase text-[9px] tracking-widest opacity-60">Sua Premiação:</p>
                                          <p className="text-4xl font-black">R$ {(t.valorPremio || 0).toFixed(2)}</p>
                                        </div>
                                        
                                        <div className="text-left space-y-2">
                                           <Label className="text-[10px] font-black uppercase text-white/70">Chave PIX p/ Recebimento:</Label>
                                           <Input 
                                            value={pixKey} 
                                            onChange={e => setPixKey(e.target.value)}
                                            placeholder="CPF, Email ou Celular"
                                            className="h-12 bg-white/10 border-white/30 text-white placeholder:text-white/40 text-sm font-black rounded-xl"
                                           />
                                        </div>

                                        <Button 
                                          onClick={() => handleClaim(t.id)} 
                                          className="bg-white text-green-700 hover:bg-white/90 font-black uppercase text-xs h-14 w-full rounded-2xl shadow-xl transition-all active:scale-95"
                                          disabled={claiming === t.id}
                                        >
                                          {claiming === t.id ? "ENVIANDO..." : "RESGATAR AGORA"}
                                        </Button>
                                      </div>
                                    ) : isPaid ? (
                                      <div className="space-y-4 w-full">
                                        <div className="bg-white/20 p-6 rounded-[2rem]">
                                          <ShieldCheck className="w-14 h-14 mb-4 mx-auto" />
                                          <p className="font-black uppercase text-lg tracking-tight">PRÊMIO PAGO!</p>
                                          <p className="text-[10px] font-bold opacity-70 mt-3 uppercase leading-relaxed">Valor de R$ {(t.valorPremio || 0).toFixed(2)} creditado na sua conta.</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <Clock className="w-12 h-12 mb-3 animate-pulse" />
                                        <p className="font-black uppercase text-xs tracking-widest">RESGATE EM ANÁLISE</p>
                                        <p className="text-[9px] mt-4 opacity-60 uppercase font-black">Chave: {t.pixResgate}</p>
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

                <div className="p-10 bg-primary text-white rounded-[3rem] text-center shadow-2xl space-y-4 relative overflow-hidden print:hidden">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-80">Central de Suporte Profissional</p>
                  <p className="font-black text-4xl tracking-tighter">(82) 99334-3941</p>
                  <p className="text-[8px] font-bold uppercase opacity-40">LEOBET PRO • Auditoria 365 Dias • Versão 2026.1</p>
                </div>
              </div>
            ) : searched && (
              <div className="text-center py-20">
                <div className="bg-muted p-8 rounded-full w-fit mx-auto mb-8">
                   <XCircle className="w-20 h-20 text-muted-foreground opacity-20" />
                </div>
                <h3 className="font-black uppercase text-muted-foreground tracking-widest text-2xl">Não Localizado</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase mt-2">Verifique o código ou aguarde a validação do vendedor.</p>
                <Button variant="link" onClick={() => setSearched(false)} className="mt-8 font-black uppercase text-primary">Voltar para a busca</Button>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black uppercase text-xs animate-pulse">Consultando Banco de Dados...</div>}>
      <ResultadosContent />
    </Suspense>
  );
}
