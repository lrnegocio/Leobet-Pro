
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, ArrowUpCircle, ArrowDownCircle, ExternalLink, Copy, AlertTriangle } from 'lucide-react';
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/supabase/client';

export function BalanceCard() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [openDeposit, setOpenDeposit] = useState(false);
  const [companyPix, setCompanyPix] = useState('LEOBET-PIX-OFICIAL');

  if (!user) return null;

  const handleDepositRequest = async () => {
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      toast({ variant: "destructive", title: "VALOR INVÁLIDO" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          user_name: user.nome,
          amount: amount,
          type: 'deposito',
          status: 'pendente'
        }])
        .select()
        .single();

      if (error) throw error;

      const message = `*SOLICITAÇÃO DE SALDO - LEOBET PRO*%0A%0A👤 *CLIENTE:* ${user.nome}%0A💰 *VALOR:* R$ ${amount.toFixed(2)}%0A📦 *PEDIDO:* ${data.id}%0A%0A*Seguindo o comprovante abaixo para liberação imediata:*`;
      window.open(`https://api.whatsapp.com/send?phone=5582993343941&text=${message}`, '_blank');

      setOpenDeposit(false);
      setDepositAmount('');
      toast({ title: "SOLICITAÇÃO ENVIADA!", description: "Envie o comprovante no WhatsApp." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO AO SOLICITAR", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawRequest = async () => {
    const amount = Number(withdrawAmount);
    const totalBalance = (user.balance || 0) + (user.commissionBalance || 0);

    if (amount > totalBalance) {
      toast({ variant: "destructive", title: "SALDO INSUFICIENTE" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          user_name: user.nome,
          amount: amount,
          type: 'saque',
          pix_key: user.pixKey,
          status: 'pendente'
        }]);

      if (error) throw error;

      setOpenWithdraw(false);
      setWithdrawAmount('');
      toast({ title: "SAQUE SOLICITADO!", description: "Aguarde aprovação administrativa." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO AO SACAR", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const copyPix = () => {
    navigator.clipboard.writeText(companyPix);
    toast({ title: "PIX COPIADO!" });
  };

  const totalDisplay = (user.balance || 0) + (user.commissionBalance || 0);

  return (
    <Card className="bg-primary text-white overflow-hidden relative border-none shadow-2xl rounded-3xl">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Wallet className="w-24 h-24" />
      </div>
      <CardHeader>
        <CardTitle className="text-[10px] font-black uppercase text-white/60 tracking-widest">Saldo Disponível</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-4xl font-black tracking-tighter">R$ {totalDisplay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        
        {user.role === 'admin' ? (
          <Link href="/admin/financeiro" className="block">
            <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white gap-2 uppercase font-black text-xs h-12 rounded-xl">
              <ExternalLink className="w-4 h-4" /> Gestão Master
            </Button>
          </Link>
        ) : (
          <div className="flex gap-3">
            <Dialog open={openDeposit} onOpenChange={setOpenDeposit}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 border-white/20 hover:bg-white/10 text-white gap-2 uppercase font-black text-[10px] h-12 rounded-xl">
                  <ArrowUpCircle className="w-4 h-4" /> Depósito
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white rounded-[2.5rem] border-none">
                <DialogHeader>
                  <DialogTitle className="font-black uppercase text-primary text-center">Recarregar Saldo</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                   <div className="bg-primary/5 p-6 rounded-3xl border-2 border-primary/10 space-y-4">
                      <p className="text-[10px] font-black uppercase text-muted-foreground text-center">Chave PIX Oficial LEOBET PRO</p>
                      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border-2 border-primary/20">
                        <span className="font-black text-primary truncate mr-2">{companyPix}</span>
                        <Button onClick={copyPix} size="icon" variant="ghost" className="shrink-0 text-primary h-10 w-10">
                          <Copy className="w-5 h-5" />
                        </Button>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase block text-center">Valor R$</Label>
                      <Input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="font-black text-2xl h-16 text-center rounded-2xl" />
                   </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleDepositRequest} disabled={loading} className="w-full h-16 font-black uppercase bg-primary rounded-2xl">
                    {loading ? 'Processando...' : 'Paguei, enviar comprovante'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={openWithdraw} onOpenChange={setOpenWithdraw}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 border-white/20 hover:bg-white/10 text-white gap-2 uppercase font-black text-[10px] h-12 rounded-xl">
                  <ArrowDownCircle className="w-4 h-4" /> Saque
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white rounded-[2.5rem] border-none">
                <DialogHeader><DialogTitle className="font-black uppercase text-primary text-center">Solicitar Saque</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                   <div className="bg-muted/50 p-4 rounded-2xl"><p className="text-[10px] font-black uppercase text-muted-foreground">Chave PIX:</p><p className="font-black text-primary">{user.pixKey || 'NÃO CADASTRADA'}</p></div>
                   <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Valor R$</Label><Input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="font-black text-xl h-14" /></div>
                </div>
                <DialogFooter><Button onClick={handleWithdrawRequest} disabled={loading || !user.pixKey} className="w-full h-14 font-black uppercase bg-primary rounded-xl">Confirmar Saque</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
