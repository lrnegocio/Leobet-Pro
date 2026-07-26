"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, ArrowUpCircle, Copy, CheckCircle2, Loader2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/use-auth-store';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { createPixPayment } from '@/app/actions/mercadopago';

export function BalanceCard() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openDeposit, setOpenDeposit] = useState(false);
  const [pixData, setPixData] = useState<{ qr_code: string, qr_code_base64: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) return null;

  const handleGeneratePix = async () => {
    const amount = Number(depositAmount);
    if (!amount || amount < 0.01) return toast({ variant: "destructive", title: "VALOR MÍNIMO R$ 0,01" });

    setLoading(true);
    setPixData(null);
    try {
      const result = await createPixPayment(amount, {
        id: user.id,
        email: user.email,
        nome: user.nome
      });

      if (result.qr_code) {
        setPixData({
          qr_code: result.qr_code,
          qr_code_base64: result.qr_code_base64 || ''
        });
        toast({ title: "PIX GERADO COM SUCESSO!" });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO AO GERAR PIX", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({ title: "CÓDIGO PIX COPIADO!" });
    } catch (err) {
      toast({ variant: "destructive", title: "ERRO AO COPIAR", description: "Seu navegador bloqueou a cópia automática." });
    }
  };

  const totalDisplay = (Number(user.balance) || 0) + (Number(user.commissionBalance) || 0);

  return (
    <Card className="bg-primary text-white overflow-hidden relative border-none shadow-2xl rounded-[2.5rem]">
      <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet className="w-24 h-24" /></div>
      <CardHeader><CardTitle className="text-[10px] font-black uppercase text-white/60 tracking-widest">Saldo em Conta</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="text-4xl font-black tracking-tighter">R$ {totalDisplay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        {user.role === 'admin' ? (
          <Link href="/admin/financeiro" className="block"><Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white gap-2 uppercase font-black text-xs h-14 rounded-2xl">Gestão Master</Button></Link>
        ) : (
          <div className="flex gap-3">
            <Dialog open={openDeposit} onOpenChange={(v) => { setOpenDeposit(v); if(!v) { setPixData(null); setDepositAmount(''); } }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 border-white/20 hover:bg-white/10 text-white gap-2 uppercase font-black text-[10px] h-14 rounded-2xl">
                  <ArrowUpCircle className="w-4 h-4" /> Depósito PIX
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white rounded-[2.5rem] border-none shadow-2xl max-w-sm">
                <DialogHeader>
                  <DialogTitle className="font-black uppercase text-primary text-center">Recarga Instantânea</DialogTitle>
                </DialogHeader>
                
                {!pixData ? (
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground block text-center">Quanto deseja depositar?</label>
                      <Input 
                        type="number" 
                        value={depositAmount} 
                        onChange={e => setDepositAmount(e.target.value)} 
                        className="font-black text-3xl h-20 text-center rounded-2xl border-2 border-primary/20 focus:border-primary" 
                        placeholder="R$ 0,00" 
                      />
                      <p className="text-[8px] text-center font-bold text-muted-foreground uppercase">Mínimo R$ 0,01 • Crédito na hora via Webhook</p>
                    </div>
                    <Button onClick={handleGeneratePix} disabled={loading} className="w-full h-16 font-black bg-primary rounded-2xl text-white shadow-xl flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="animate-spin" /> : <QrCode className="w-5 h-5" />}
                      GERAR QR CODE PIX
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6 py-4 text-center">
                    <div className="bg-muted/30 p-4 rounded-3xl inline-block mx-auto border-2 border-primary/10">
                      {pixData.qr_code_base64 ? (
                        <img 
                          src={`data:image/png;base64,${pixData.qr_code_base64}`} 
                          alt="QR Code PIX" 
                          className="w-48 h-48 rounded-xl"
                        />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center bg-white rounded-xl">
                          <QrCode className="w-12 h-12 text-primary opacity-20" />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Ou use o Copia e Cola</p>
                      <Button onClick={() => handleCopyCode(pixData.qr_code)} variant="outline" className="w-full h-12 border-2 rounded-xl font-black text-[10px] uppercase gap-2">
                        <Copy className="w-4 h-4" /> Copiar Código PIX
                      </Button>
                    </div>

                    <div className="bg-green-50 p-4 rounded-2xl border border-green-200 flex items-center gap-3">
                       <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                       <p className="text-[9px] font-black uppercase text-green-700 text-left leading-tight">
                         Pagamento identificado automaticamente. O saldo entrará em sua conta em poucos segundos após a confirmação.
                       </p>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
