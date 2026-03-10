
"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Trophy, XCircle, Clock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function ResultadosPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleSearch = () => {
    if (code.length < 11) return;

    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    let found = null;

    allReceipts.forEach((receipt: any) => {
      const ticket = receipt.tickets.find((t: any) => t.id === code);
      if (ticket) found = { ...ticket, receiptInfo: receipt };
    });

    setResult(found);
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <Link href="/" className="flex items-center gap-2 text-primary hover:underline font-bold">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </Link>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black font-headline uppercase text-primary leading-tight">Conferência de Bilhete</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">Acompanhamento Oficial • LEOBET PRO</p>
        </div>

        <Card className="border-t-4 border-t-accent shadow-xl overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <div className="flex gap-2">
              <Input 
                placeholder="CÓDIGO DE 11 DÍGITOS" 
                className="h-14 font-black text-center text-xl tracking-[0.2em] border-2 focus:border-primary" 
                maxLength={11}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
              <Button onClick={handleSearch} className="h-14 bg-primary font-black uppercase px-6">
                <Search className="w-5 h-5" />
              </Button>
            </div>

            {result ? (
              <div className="animate-in zoom-in-95 space-y-6 pt-4">
                <div className={`flex justify-between items-center p-6 rounded-2xl border-4 border-double ${
                  result.status === 'ganhou' ? 'bg-green-50 border-green-200' : 
                  result.status === 'pago' ? 'bg-blue-50 border-blue-200' : 'bg-muted/50 border-muted'
                }`}>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Situação do Bilhete</p>
                    {result.status === 'ganhou' ? (
                      <div className="flex items-center gap-2 text-green-600 font-black uppercase text-lg">
                        <Trophy className="w-6 h-6 animate-bounce" /> Você Ganhou!
                      </div>
                    ) : result.status === 'pago' ? (
                      <div className="flex items-center gap-2 text-blue-600 font-black uppercase text-lg">
                        <CheckCircle2 className="w-6 h-6" /> Bilhete Já Pago
                      </div>
                    ) : result.status === 'perdeu' ? (
                      <div className="flex items-center gap-2 text-destructive font-black uppercase text-lg">
                        <XCircle className="w-6 h-6" /> Não Premiado
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-orange-600 font-black uppercase text-lg">
                        <Clock className="w-6 h-6" /> Em Aberto
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Prêmio Estimado</p>
                    <p className={`font-black text-2xl ${result.status === 'ganhou' || result.status === 'pago' ? 'text-primary' : 'text-muted-foreground'}`}>
                      R$ {result.receiptInfo.valorTotal.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="bg-primary/5 p-4 rounded-xl space-y-2 border border-primary/10">
                      <p className="text-[10px] font-black uppercase text-primary text-center tracking-widest">Informações da Aposta</p>
                      <div className="grid grid-cols-2 gap-4 text-xs font-bold text-center">
                         <div className="p-2 bg-white rounded-lg shadow-sm">
                           <p className="text-[9px] uppercase text-muted-foreground">Concurso</p>
                           <p className="uppercase">{result.receiptInfo.eventoNome}</p>
                         </div>
                         <div className="p-2 bg-white rounded-lg shadow-sm">
                           <p className="text-[9px] uppercase text-muted-foreground">Apostador</p>
                           <p className="uppercase">{result.receiptInfo.cliente}</p>
                         </div>
                      </div>
                   </div>

                  {result.numeros && (
                    <div className="space-y-3">
                      <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Cartela B-I-N-G-O</p>
                      <div className="grid grid-cols-5 gap-2">
                        {result.numeros.map((n: number) => (
                          <div key={n} className="h-12 flex items-center justify-center bg-white border-2 border-primary/20 rounded-xl font-black text-primary shadow-sm hover:border-accent transition-colors">
                            {n.toString().padStart(2, '0')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.palpite && (
                    <div className="space-y-3">
                       <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Palpite Futebol (1-X-2)</p>
                       <div className="p-4 bg-primary text-white text-center rounded-xl font-mono text-2xl tracking-[0.5em] shadow-lg border-4 border-white/20">
                        {result.palpite}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-accent text-white rounded-2xl text-center shadow-xl">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Dúvidas ou Recebimento de Prêmios</p>
                  <p className="font-black text-xl mt-1">(82) 99334-3941</p>
                  <p className="text-[9px] font-bold uppercase mt-2 opacity-60">Apresente este código para baixar seu prêmio com um cambista.</p>
                </div>
              </div>
            ) : code.length === 11 && (
              <div className="text-center py-16 text-muted-foreground animate-pulse">
                <Search className="w-16 h-16 mx-auto opacity-10 mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">Nenhum bilhete localizado...</p>
                <p className="text-[10px] font-bold mt-2">Verifique se o código de 11 dígitos está correto.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

