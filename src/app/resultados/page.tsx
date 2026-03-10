
"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Trophy, XCircle, Clock, ArrowLeft } from 'lucide-react';
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
          <h1 className="text-3xl font-black font-headline uppercase text-primary">Conferir Bilhete</h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Acompanhe seu resultado em tempo real</p>
        </div>

        <Card className="border-t-4 border-t-accent shadow-xl">
          <CardContent className="p-8 space-y-6">
            <div className="flex gap-2">
              <Input 
                placeholder="INSIRA O CÓDIGO DE 11 DÍGITOS" 
                className="h-14 font-black text-center text-xl tracking-[0.2em]" 
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
                <div className="flex justify-between items-center p-6 bg-muted/50 rounded-2xl border-2 border-dashed">
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Status do Bilhete</p>
                    {result.status === 'ganhou' ? (
                      <div className="flex items-center gap-2 text-green-600 font-black uppercase">
                        <Trophy className="w-5 h-5" /> Você Ganhou!
                      </div>
                    ) : result.status === 'pago' ? (
                      <div className="flex items-center gap-2 text-blue-600 font-black uppercase">
                        <CheckCircle2 className="w-5 h-5" /> Prêmio Pago
                      </div>
                    ) : result.status === 'perdeu' ? (
                      <div className="flex items-center gap-2 text-destructive font-black uppercase">
                        <XCircle className="w-5 h-5" /> Não Premiado
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-orange-600 font-black uppercase">
                        <Clock className="w-5 h-5" /> Em Aberto
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Concurso</p>
                    <p className="font-black text-sm uppercase">{result.receiptInfo.eventoNome}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-center text-xs font-black uppercase tracking-widest text-muted-foreground">Suas Dezenas</h3>
                  {result.numeros && (
                    <div className="grid grid-cols-5 gap-2">
                      {result.numeros.map((n: number) => (
                        <div key={n} className="h-12 flex items-center justify-center bg-white border-2 border-primary/20 rounded-xl font-black text-primary">
                          {n.toString().padStart(2, '0')}
                        </div>
                      ))}
                    </div>
                  )}
                  {result.palpite && (
                    <div className="p-4 bg-primary text-white text-center rounded-xl font-mono text-xl tracking-[0.5em]">
                      {result.palpite}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-accent/10 border border-accent rounded-xl text-center">
                  <p className="text-[10px] font-black uppercase text-accent">Dúvidas ou Recebimento?</p>
                  <p className="font-black text-sm">(82) 99334-3941</p>
                </div>
              </div>
            ) : code.length === 11 && (
              <div className="text-center py-10 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto opacity-10 mb-2" />
                <p className="text-xs font-bold uppercase">Nenhum bilhete encontrado com este código.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
