
"use client"

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Trophy, ArrowLeft, Clock, XCircle, Zap, Youtube, Database, Play, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { useAuthStore } from '@/store/use-auth-store';
import { cn } from '@/lib/utils';

function ResultadosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [receipt, setReceipt] = useState<any>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [pixKey, setPixKey] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [eventoData, setEventoData] = useState<any>(null);

  const handleSearch = async (searchCode?: string) => {
    const codeToSearch = (searchCode || code).trim().toUpperCase();
    if (codeToSearch.length < 5) return;

    setLoading(true);
    setSearched(true);
    
    try {
      // Procura o recibo por ID ou por algum ticket individual dentro do tickets_data
      const { data: found, error } = await supabase
        .from('tickets')
        .select('*')
        .or(`id.eq.${codeToSearch},tickets_data.cs.[{"id":"${codeToSearch}"}]`)
        .maybeSingle();

      if (found) {
        setReceipt(found);
        const table = found.tipo === 'bingo' ? 'bingos' : 'boloes';
        const { data: ev } = await supabase.from(table).select('*').eq('id', found.evento_id).maybeSingle();
        setEventoData(ev);
      } else {
        setReceipt(null);
      }
    } catch (err) {
      console.error(err);
      setReceipt(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('leobet_settings') || '{}');
    setYoutubeUrl(settings.youtubeUrl || 'https://youtube.com/live/LEOBET');
    
    const ticketCode = searchParams.get('c');
    if (ticketCode) { 
      setCode(ticketCode); 
      handleSearch(ticketCode); 
    }
  }, [searchParams]);

  const handleClaim = async (ticketId: string) => {
    if (!pixKey || pixKey.trim().length < 5) {
      toast({ variant: "destructive", title: "CHAVE PIX OBRIGATÓRIA" });
      return;
    }

    setClaiming(ticketId);
    try {
      const updatedTickets = receipt.tickets_data.map((t: any) => 
        t.id === ticketId ? { ...t, status: 'pendente-resgate', pixResgate: pixKey } : t
      );

      const { error } = await supabase
        .from('tickets')
        .update({ tickets_data: updatedTickets })
        .eq('id', receipt.id);

      if (error) throw error;
      
      toast({ title: "SOLICITAÇÃO DE RESGATE ENVIADA!" });
      handleSearch(receipt.id);
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO", description: err.message });
    } finally {
      setClaiming(null);
    }
  };

  const getBackPath = () => {
    if (!user) return '/';
    // Se o usuário estiver logado, volta para sua respectiva área em vez de deslogar
    if (user.role === 'admin' || user.role === 'cambista' || user.role === 'gerente') return '/admin/venda';
    return '/cliente/dashboard';
  };

  return (
    <div className="min-h-screen bg-muted/30 p-2 md:p-8 flex flex-col items-center font-body pb-32">
      <div className="max-w-4xl w-full space-y-6">
        <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border md:border-none">
          <Link href={getBackPath()} className="flex items-center gap-2 text-primary hover:underline font-black text-[10px] uppercase h-10 px-4 rounded-xl border-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <Button onClick={() => window.open(youtubeUrl, '_blank')} className="bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] h-11 gap-2 px-5 rounded-xl shadow-lg transition-all active:scale-95">
            <Youtube className="w-5 h-5" /> Sorteio ao Vivo
          </Button>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-6xl font-black font-headline uppercase text-primary tracking-tighter leading-none">Central de Auditoria</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] opacity-60 flex items-center justify-center gap-2">
            <Database className="w-3 h-3 text-green-600" /> leobet-probets.vercel.app
          </p>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-white border-t-8 border-primary">
          <CardContent className="p-6 md:p-12 space-y-8">
            <div className="space-y-4">
               <div className="flex flex-col md:flex-row gap-2">
                <Input 
                  placeholder="CÓDIGO DO BILHETE" 
                  className="h-16 md:h-20 font-black text-center text-3xl md:text-4xl tracking-[0.3em] border-2 focus:border-primary rounded-3xl uppercase shadow-inner" 
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={() => handleSearch()} className="h-16 md:h-20 bg-primary hover:bg-primary/90 font-black uppercase px-12 rounded-3xl shadow-xl transition-all active:scale-95" disabled={loading}>
                  {loading ? <Clock className="animate-spin w-8 h-8" /> : <Search className="w-8 h-8" />}
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Auditando Banco...</p>
              </div>
            ) : receipt ? (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6">
                <div className="bg-primary/5 p-6 md:p-8 rounded-[2rem] border-2 border-primary/10 space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Apostador</p>
                        <p className="font-black text-primary text-3xl md:text-4xl tracking-tight leading-none truncate">{receipt.cliente}</p>
                        <div className="mt-4">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Concurso</p>
                          <p className="font-black uppercase text-lg md:text-xl text-primary leading-tight">{receipt.evento_nome}</p>
                        </div>
                      </div>
                      <div className="bg-white px-5 py-5 rounded-[2rem] shadow-xl border border-primary/5 space-y-3">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"><Zap className="w-4 h-4 text-accent fill-accent" /> Prêmios em Jogo</p>
                        {receipt.tipo === 'bingo' ? (
                          <div className="space-y-2">
                             <div className="flex justify-between items-center bg-muted/30 p-3 rounded-xl"><span className="text-[10px] font-black opacity-60">BINGO:</span> <span className="font-black text-primary text-lg">R$ {receipt.detalhe_premios.bingo.toFixed(2)}</span></div>
                             <div className="flex justify-between items-center bg-muted/30 p-3 rounded-xl"><span className="text-[10px] font-black opacity-60">QUINA:</span> <span className="font-black text-primary text-md">R$ {receipt.detalhe_premios.quina.toFixed(2)}</span></div>
                             <div className="flex justify-between items-center bg-muted/30 p-3 rounded-xl"><span className="text-[10px] font-black opacity-60">QUADRA:</span> <span className="font-black text-primary text-md">R$ {receipt.detalhe_premios.quadra.toFixed(2)}</span></div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-3xl border border-green-100">
                             <span className="text-[10px] font-black text-green-700 uppercase mb-1">ACUMULADO</span>
                             <span className="text-3xl font-black text-green-600">R$ {receipt.detalhe_premios.bolao.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                   </div>
                   <div className="border-t border-primary/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                      <Badge className={cn(
                        "text-white border-none font-black uppercase h-10 px-6 rounded-2xl text-[10px] shadow-lg",
                        receipt.status === 'pago' ? 'bg-green-600' : 'bg-orange-600'
                      )}>
                        {receipt.status === 'pago' ? '✓ APOSTA VALIDADA' : '⚠ AGUARDANDO PAGAMENTO'}
                      </Badge>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase text-muted-foreground opacity-40">ID DIGITAL</p>
                        <p className="text-xs font-black uppercase text-primary/40">{receipt.id}</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                  {receipt.tickets_data.map((t: any, idx: number) => {
                    const isWinner = t.status === 'ganhou';
                    const isPending = t.status === 'pendente-resgate';
                    const isPaid = t.status === 'pago';
                    return (
                      <Card key={idx} className={cn(
                        "rounded-[2.5rem] border-4 transition-all overflow-hidden shadow-md",
                        isWinner ? 'bg-green-50 border-green-400' : isPaid ? 'bg-blue-50 border-blue-400' : 'bg-white border-muted-foreground/10'
                      )}>
                         <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-stretch gap-6">
                             <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-center">
                                  <span className="font-black text-[10px] uppercase text-muted-foreground">BILHETE #{t.id}</span>
                                  <Badge variant={isWinner ? 'default' : 'outline'} className={cn(
                                    "font-black uppercase text-[9px] h-6 px-4",
                                    isWinner ? 'bg-green-600 animate-bounce' : ''
                                  )}>
                                    {isWinner ? "🔥 GANHOU!" : isPaid ? "✓ PAGO" : isPending ? "⌚ ANÁLISE" : "EM JOGO"}
                                  </Badge>
                                </div>
                                {t.numeros ? (
                                  <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                                    {t.numeros.map((n: number) => {
                                      const isDrawn = eventoData?.bolas_sorteadas?.includes(n);
                                      return (
                                        <div key={n} className={cn(
                                          "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border-2 rounded-xl font-black text-md md:text-lg transition-all shadow-sm",
                                          isDrawn ? "bg-green-600 text-white border-green-700 scale-105" : "bg-white border-muted/20 text-muted-foreground/40"
                                        )}>
                                          {n.toString().padStart(2, '0')}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-5 gap-2">
                                    {(t.palpite || '').split('-').map((g: string, i: number) => (
                                      <div key={i} className="p-3 md:p-4 rounded-xl border-2 text-center font-black text-lg md:text-xl shadow-sm bg-muted/10">
                                        {g}
                                      </div>
                                    ))}
                                  </div>
                                )}
                             </div>
                             {(isWinner || isPending || isPaid) && (
                               <div className={cn(
                                 "p-6 rounded-[2rem] md:w-72 text-center flex flex-col justify-center gap-4 shadow-xl",
                                 isWinner ? 'bg-green-600' : isPaid ? 'bg-blue-600' : 'bg-orange-600',
                                 "text-white"
                               )}>
                                  {isWinner ? (
                                    <>
                                      <div>
                                        <p className="text-[10px] font-black uppercase opacity-60 mb-1">Seu Prêmio:</p>
                                        <p className="text-3xl font-black">R$ {t.valorPremio.toFixed(2)}</p>
                                      </div>
                                      <div className="space-y-2">
                                        <Input 
                                          value={pixKey} 
                                          onChange={e => setPixKey(e.target.value)} 
                                          placeholder="CHAVE PIX" 
                                          className="bg-white/10 text-white placeholder:text-white/40 font-black text-center h-12 border-none rounded-xl" 
                                        />
                                        <Button onClick={() => handleClaim(t.id)} className="bg-white text-green-700 hover:bg-white/90 font-black uppercase text-[10px] h-12 w-full rounded-xl shadow-lg" disabled={claiming === t.id}>
                                          Resgatar
                                        </Button>
                                      </div>
                                    </>
                                  ) : isPaid ? (
                                    <div className="space-y-2">
                                       <div className="bg-white/20 p-3 rounded-full w-fit mx-auto"><Database className="w-6 h-6" /></div>
                                       <p className="font-black uppercase text-xl leading-none">PAGO!</p>
                                       <p className="text-[9px] font-bold opacity-60">Confira seu banco.</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                       <Clock className="w-8 h-8 mx-auto animate-pulse" />
                                       <p className="font-black uppercase text-md leading-tight">RESGATE ENVIADO</p>
                                       <p className="text-[9px] font-bold opacity-60 uppercase">Aguardando Aprovação.</p>
                                    </div>
                                  )}
                               </div>
                             )}
                         </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : searched && (
              <div className="text-center py-16 bg-red-50 rounded-[3rem] border-2 border-dashed border-red-100">
                <XCircle className="w-20 h-20 mx-auto mb-4 text-red-200" />
                <h3 className="font-black uppercase text-2xl text-red-600 leading-none">Bilhete Inválido</h3>
                <p className="text-red-400 font-bold uppercase text-[9px] tracking-widest mt-3">Confira o código no seu recibo</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="text-center opacity-30">
           <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">© LEOBET PRO • AUDITORIA CLOUD • SUPABASE</p>
        </div>
      </div>
    </div>
  );
}

export default function ResultadosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center font-black uppercase text-[10px] tracking-[0.4em] text-primary animate-pulse">
        Auditando...
      </div>
    }>
      <ResultadosContent />
    </Suspense>
  );
}
