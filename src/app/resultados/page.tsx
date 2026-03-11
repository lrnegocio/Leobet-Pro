
"use client"

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Trophy, ArrowLeft, CheckCircle2, Ticket, Clock, XCircle, ShieldCheck, Zap, Youtube } from 'lucide-react';
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
  
  const [prizes, setPrizes] = useState({
    totalNet: 0,
    quadra: 0,
    quina: 0,
    bingo: 0,
    bolao: 0
  });

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

        // MATEMÁTICA DE PRECISÃO IDÊNTICA AO TERMINAL
        const eventSales = allReceipts.filter((t: any) => String(t.eventoId) === String(foundReceipt.eventoId) && t.status === 'pago');
        const totalPaid = eventSales.reduce((acc: number, t: any) => acc + (t.valorTotal || 0), 0);
        
        const totalNet = Math.floor(totalPaid * 0.65 * 100) / 100;

        if (foundReceipt.tipo === 'bingo') {
          const bingoVal = Math.floor(totalNet * 0.50 * 100) / 100;
          const quinaVal = Math.floor(totalNet * 0.30 * 100) / 100;
          const quadraVal = Number((totalNet - bingoVal - quinaVal).toFixed(2));

          setPrizes({
            totalNet: totalNet,
            bingo: bingoVal,
            quina: quinaVal,
            quadra: quadraVal,
            bolao: 0
          });
        } else {
          setPrizes({
            totalNet: totalNet,
            quadra: 0,
            quina: 0,
            bingo: 0,
            bolao: totalNet
          });
        }
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
      toast({ title: "SOLICITAÇÃO DE RESGATE ENVIADA!" });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8 flex flex-col items-center font-body">
      <div className="max-w-4xl w-full space-y-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-primary hover:underline font-black text-xs uppercase">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Início
          </Link>
          {youtubeUrl && (
            <Button onClick={() => window.open(youtubeUrl, '_blank')} className="bg-red-600 text-white font-black uppercase text-[10px] h-9 gap-2 rounded-xl">
              <Youtube className="w-4 h-4" /> Assistir Live
            </Button>
          )}
        </div>

        <div className="text-center space-y-4">
          <div className="bg-primary text-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl mb-4">
             <Trophy className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-black font-headline uppercase text-primary tracking-tighter">Central de Auditoria</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Conferência 365 Dias</p>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-white">
          <CardContent className="p-8 md:p-12 space-y-10">
            <div className="space-y-4">
               <label className="text-xs font-black uppercase text-muted-foreground block text-center opacity-60">Digite seu bilhete ou código de recibo</label>
               <div className="flex flex-col md:flex-row gap-3">
                <Input 
                  placeholder="CÓDIGO" 
                  className="h-16 font-black text-center text-3xl tracking-[0.4em] border-2 focus:border-primary rounded-2xl uppercase" 
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
                <p className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Auditando Sistema...</p>
              </div>
            ) : receipt ? (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
                <div className="bg-primary/5 p-8 rounded-[2rem] border-2 border-primary/10 space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Apostador Identificado</p>
                        <p className="font-black text-primary text-3xl tracking-tight leading-none">{receipt.cliente}</p>
                        <p className="mt-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Evento</p>
                        <p className="font-black uppercase text-lg text-primary">{receipt.eventoNome}</p>
                      </div>
                      
                      <div className="bg-white px-6 py-6 rounded-2xl shadow-sm border border-primary/10 space-y-4">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                          <Zap className="w-3 h-3 text-green-600 fill-green-600" /> Prêmios Líquidos Atuais
                        </p>
                        {receipt.tipo === 'bingo' ? (
                          <div className="space-y-2">
                             <div className="flex justify-between items-center"><span className="text-[10px] font-black opacity-60">BINGO (50%):</span> <span className="font-black text-primary">R$ {prizes.bingo.toFixed(2)}</span></div>
                             <div className="flex justify-between items-center"><span className="text-[10px] font-black opacity-60">QUINA (30%):</span> <span className="font-black text-primary">R$ {prizes.quina.toFixed(2)}</span></div>
                             <div className="flex justify-between items-center"><span className="text-[10px] font-black opacity-60">QUADRA (20%):</span> <span className="font-black text-primary">R$ {prizes.quadra.toFixed(2)}</span></div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center pt-2">
                             <span className="text-xs font-black text-primary">PRÊMIO ÚNICO:</span> 
                             <span className="text-2xl font-black text-green-600">R$ {prizes.bolao.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                   </div>
                   <div className="border-t border-primary/10 pt-6 flex justify-between items-center">
                      <Badge className={`${receipt.status === 'pago' ? 'bg-primary' : 'bg-orange-600'} text-white border-none font-black uppercase h-8 px-4 rounded-xl`}>
                        {receipt.status === 'pago' ? '✓ APOSTA VALIDADA' : '⚠ PENDENTE DE SALDO'}
                      </Badge>
                      <p className="text-[9px] font-black uppercase text-muted-foreground">Protocolo: {receipt.id}</p>
                   </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase text-muted-foreground tracking-[0.3em] px-4">Cartelas em Jogo ({receipt.tickets.length})</h3>
                  <div className="grid grid-cols-1 gap-6">
                    {receipt.tickets.map((t: any, idx: number) => {
                      const isWinner = t.status === 'ganhou';
                      const isPending = t.status === 'pendente-resgate';
                      const isPaid = t.status === 'pago';
                      
                      return (
                        <Card key={idx} className={`rounded-[2.5rem] border-2 transition-all overflow-hidden ${
                          isWinner ? 'bg-green-50 border-green-200 shadow-xl ring-4 ring-green-500/20' : 
                          isPaid ? 'bg-blue-50 border-blue-600 shadow-md opacity-80' : 
                          isPending ? 'bg-orange-50 border-orange-200 animate-pulse' :
                          'bg-white border-muted-foreground/10'
                        }`}>
                           <CardContent className="p-8 flex flex-col md:flex-row items-stretch gap-8">
                               <div className="flex-1 space-y-6">
                                  <div className="flex justify-between items-center">
                                     <span className="font-black text-[10px] uppercase text-muted-foreground">ID CARTELA: {t.id}</span>
                                     <Badge variant={isWinner ? 'default' : (isPaid ? 'secondary' : (isPending ? 'destructive' : 'outline'))} className={`font-black ${isWinner ? 'bg-green-600' : ''}`}>
                                        {isWinner ? "🔥 PREMIADO!" : isPaid ? "✓ PRÊMIO PAGO" : isPending ? "⌚ RESGATE EM ANÁLISE" : "AGUARDANDO SORTEIO"}
                                     </Badge>
                                  </div>

                                  {t.numeros ? (
                                    <div className="flex flex-wrap gap-2">
                                      {t.numeros.map((n: number) => {
                                        const isDrawn = eventoData?.bolasSorteadas?.includes(n);
                                        return (
                                          <div key={n} className={`w-10 h-10 flex items-center justify-center border-2 rounded-xl font-black text-sm ${
                                            isDrawn ? 'bg-green-600 text-white border-green-700 shadow-inner' : 'bg-white'
                                          }`}>
                                            {n.toString().padStart(2, '0')}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                       <p className="text-[10px] font-black uppercase text-muted-foreground">Palpites:</p>
                                       <div className="grid grid-cols-5 gap-2">
                                          {(t.palpite || '').split('-').map((g: string, i: number) => {
                                            const isAnulado = eventoData?.scores?.[i]?.excluded;
                                            return (
                                              <div key={i} className={`p-2 rounded-lg border-2 text-center font-black ${isAnulado ? 'bg-red-50 text-red-600 border-red-100 line-through' : ''}`}>
                                                {isAnulado ? '-' : g}
                                              </div>
                                            );
                                          })}
                                       </div>
                                    </div>
                                  )}
                               </div>

                               {(isWinner || isPending || isPaid) && (
                                 <div className={`p-6 rounded-2xl md:w-64 text-center flex flex-col justify-center gap-4 ${
                                   isWinner ? 'bg-green-600' : isPaid ? 'bg-blue-600' : 'bg-orange-600'
                                 } text-white shadow-lg`}>
                                    {isWinner ? (
                                      <>
                                        <div><p className="text-[10px] font-black opacity-60">Valor do Prêmio:</p><p className="text-2xl font-black">R$ {t.valorPremio.toFixed(2)}</p></div>
                                        <Input value={pixKey} onChange={e => setPixKey(e.target.value)} placeholder="SUA CHAVE PIX" className="h-10 bg-white/10 border-white/30 text-white placeholder:text-white/40 font-black text-center" />
                                        <Button onClick={() => handleClaim(t.id)} className="bg-white text-green-700 hover:bg-white/90 font-black uppercase text-xs h-12 w-full" disabled={claiming === t.id}>Solicitar Recebimento</Button>
                                      </>
                                    ) : isPaid ? (
                                      <p className="font-black uppercase text-lg">PAGAMENTO EFETUADO COM SUCESSO!</p>
                                    ) : (
                                      <p className="font-black uppercase text-xs">AGUARDANDO LIBERAÇÃO NO PAINEL MASTER</p>
                                    )}
                                 </div>
                               )}
                           </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : searched && (
              <div className="text-center py-20 opacity-20"><XCircle className="w-20 h-20 mx-auto mb-4" /><h3 className="font-black uppercase text-2xl">Aposta não localizada</h3></div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResultadosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black uppercase text-xs">Carregando Auditoria...</div>}>
      <ResultadosContent />
    </Suspense>
  );
}
