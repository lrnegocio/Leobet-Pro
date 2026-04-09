
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, ArrowUpCircle, ArrowDownCircle, ExternalLink, Copy, RefreshCcw } from 'lucide-react';
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
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [openDeposit, setOpenDeposit] = useState(false);
  const [masterPix, setMasterPix] = useState('CARREGANDO...');

  const fetchMasterPix = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('pix_key')
        .eq('role', 'admin')
        .not('pix_key', 'is', null)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setMasterPix(data[0].pix_key);
      } else {
        setMasterPix('CONTATE O ADMIN');
      }
    } catch (err) {
      setMasterPix('ERRO AO CARREGAR');
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchMasterPix();
  }, []);

  if (!mounted || !user) return null;

  const handleDepositRequest = async () => {
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) return toast({ variant: "destructive", title: "VALOR INVÁLIDO" });

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          user_name: user.nome,
          amount: amount,
          type: 'deposito',
          status: 'pendente'
        }]);

      if (error) throw error;

      const message = `*SOLICITAÇÃO DE SALDO - LEOBET PRO*%0A%0A👤 *CLIENTE:* ${user.nome}%0A💰 *VALOR:* R$ ${amount.toFixed(2)}%0A%0A*Segue o comprovante para liberação:*`;
      window.open(`https://api.whatsapp.com/send?phone=5582993343941&text=${message}`, '_blank');

      setOpenDeposit(false);
      setDepositAmount('');
      toast({ title: "SOLICITAÇÃO ENVIADA!", description: "Envie o comprovante agora." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "FALHA NA SOLICITAÇÃO" });
    } finally { setLoading(false); }
  };

  const handleWithdrawRequest = async () => {
    const amount = Number(withdrawAmount);
    const totalBalance = (Number(user.balance) || 0) + (Number(user.commissionBalance) || 0);

    if (amount > totalBalance) return toast({ variant: "destructive", title: "SALDO INSUFICIENTE" });

    setLoading(true);
    try {
      await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          user_name: user.nome,
          amount: amount,
          type: 'saque',
          pix_key: user.pixKey,
          status: 'pendente'
        }]);

      setOpenWithdraw(false);
      setWithdrawAmount('');
      toast({ title: "SAQUE SOLICITADO!", description: "Aguarde a conferência administrativa." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO AO SACAR" });
    } finally { setLoading(false); }
  };

  const copyPix = () => {
    if (masterPix.includes('...')) return;
    navigator.clipboard.writeText(masterPix);
    toast({ title: "PIX COPIADO!" });
  };

  const totalDisplay = (Number(user.balance) || 0) + (Number(user.commissionBalance) || 0);

  return (
    <Card className="bg-primary text-white overflow-hidden relative border-none shadow-2xl rounded-[2.5rem]">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Wallet className="w-24 h-24" />
      </div>
      <CardHeader>
        <CardTitle className="text-[10px] font-black uppercase text-white/60 tracking-widest">Saldo Total em Conta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-4xl font-black tracking-tighter">R$ {totalDisplay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        
        {user.role === 'admin' ? (
          <Link href="/admin/financeiro" className="block">
            <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white gap-2 uppercase font-black text-xs h-14 rounded-2xl">
              <ExternalLink className="w-4 h-4" /> Gestão Master
            </Button>
          </Link>
        ) : (
          <div className="flex gap-3">
            <Dialog open={openDeposit} onOpenChange={setOpenDeposit}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => fetchMasterPix()} className="flex-1 border-white/20 hover:bg-white/10 text-white gap-2 uppercase font-black text-[10px] h-14 rounded-2xl">
                  <ArrowUpCircle className="w-4 h-4" /> Depósito
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white rounded-[2.5rem] border-none">
                <DialogHeader>
                  <DialogTitle className="font-black uppercase text-primary text-center">Recarregar via PIX</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                   <div className="bg-primary/5 p-6 rounded-3xl border-2 border-primary/10 space-y-4">
                      <p className="text-[10px] font-black uppercase text-muted-foreground text-center">Chave PIX para Depósito</p>
                      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border-2 border-primary/20">
                        <span className="font-black text-primary truncate mr-2 uppercase">{masterPix}</span>
                        <Button onClick={copyPix} size="icon" variant="ghost" className="shrink-0 text-primary h-10 w-10">
                          <Copy className="w-5 h-5" />
                        </Button>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase block text-center">Valor R$</Label>
                      <Input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="font-black text-2xl h-16 text-center rounded-2xl" placeholder="0.00" />
                   </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleDepositRequest} disabled={loading} className="w-full h-16 font-black uppercase bg-primary rounded-2xl text-white hover:bg-primary/90">
                    {loading ? '...' : 'ENVIAR COMPROVANTE'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={openWithdraw} onOpenChange={setOpenWithdraw}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 border-white/20 hover:bg-white/10 text-white gap-2 uppercase font-black text-[10px] h-14 rounded-2xl">
                  <ArrowDownCircle className="w-4 h-4" /> Saque
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white rounded-[2.5rem] border-none">
                <DialogHeader><DialogTitle className="font-black uppercase text-primary text-center">Solicitar Saque</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                   <div className="bg-muted/50 p-4 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Sua Chave PIX:</p>
                      <p className="font-black text-primary uppercase">{user.pixKey || 'CADASTRE NO PERFIL'}</p>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">Valor R$</Label>
                      <Input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="font-black text-xl h-14 rounded-xl" placeholder="0.00" />
                   </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleWithdrawRequest} disabled={loading || !user.pixKey} className="w-full h-16 font-black uppercase bg-primary rounded-2xl text-white">
                    {user.pixKey ? 'CONFIRMAR' : 'ATUALIZE SEU PERFIL'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
