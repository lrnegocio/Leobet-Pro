
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, ArrowUpCircle, ArrowDownCircle, ExternalLink, ShieldCheck, Send, Copy, AlertTriangle } from 'lucide-react';
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

export function BalanceCard() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [openDeposit, setOpenDeposit] = useState(false);
  const [companyPix, setCompanyPix] = useState('');

  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('leobet_settings') || '{}');
    setCompanyPix(settings.companyPix || 'CHAVE PIX NÃO CONFIGURADA');
  }, [openDeposit]);

  if (!user) return null;

  const handleDepositRequest = () => {
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      toast({ variant: "destructive", title: "VALOR INVÁLIDO" });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const deposit = {
        id: Math.random().toString(36).substring(7).toUpperCase(),
        userId: user.id,
        userName: user.nome,
        userRole: user.role,
        phone: user.phone || '',
        amount: amount,
        status: 'pendente',
        createdAt: new Date().toISOString()
      };

      const existing = JSON.parse(localStorage.getItem('leobet_deposits') || '[]');
      localStorage.setItem('leobet_deposits', JSON.stringify([...existing, deposit]));

      setLoading(false);
      
      // Abre WhatsApp para enviar comprovante com Nome e ID
      const message = `*SOLICITAÇÃO DE SALDO - LEOBET PRO*%0A%0A👤 *CLIENTE:* ${user.nome}%0A🆔 *ID USUÁRIO:* ${user.id}%0A💰 *VALOR:* R$ ${amount.toFixed(2)}%0A📦 *PEDIDO:* ${deposit.id}%0A%0A*Seguindo o comprovante abaixo para liberação imediata:*`;
      window.open(`https://api.whatsapp.com/send?phone=5582993343941&text=${message}`, '_blank');

      setOpenDeposit(false);
      setDepositAmount('');
      toast({ title: "SOLICITAÇÃO ENVIADA!", description: "Envie o comprovante no WhatsApp para aprovação imediata." });
    }, 1000);
  };

  const handleWithdrawRequest = () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      toast({ variant: "destructive", title: "VALOR INVÁLIDO" });
      return;
    }

    const totalBalance = (user.balance || 0) + (user.commissionBalance || 0);

    if (amount > totalBalance) {
      toast({ variant: "destructive", title: "SALDO INSUFICIENTE", description: `Seu saldo disponível é R$ ${totalBalance.toFixed(2)}` });
      return;
    }

    if (!user.pixKey) {
      toast({ variant: "destructive", title: "PIX NÃO CADASTRADO", description: "Vá em 'Meu Perfil' e cadastre sua chave PIX." });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const withdrawal = {
        id: Math.random().toString(36).substring(7).toUpperCase(),
        userId: user.id,
        userName: user.nome,
        userRole: user.role,
        amount: amount,
        pixKey: user.pixKey,
        status: 'pendente',
        createdAt: new Date().toISOString()
      };

      // Atualiza saldo local subtraindo primeiro da comissão, depois do balanço
      let remainingToDeduct = amount;
      let newComm = user.commissionBalance || 0;
      let newBal = user.balance || 0;

      if (newComm >= remainingToDeduct) {
        newComm -= remainingToDeduct;
        remainingToDeduct = 0;
      } else {
        remainingToDeduct -= newComm;
        newComm = 0;
        newBal -= remainingToDeduct;
      }

      const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
      const updatedUsers = allUsers.map((u: any) => 
        u.id === user.id ? { ...u, balance: newBal, commissionBalance: newComm } : u
      );
      localStorage.setItem('leobet_users', JSON.stringify(updatedUsers));
      
      const me = updatedUsers.find((u: any) => u.id === user.id);
      setUser(me);

      const existing = JSON.parse(localStorage.getItem('leobet_withdrawals') || '[]');
      localStorage.setItem('leobet_withdrawals', JSON.stringify([...existing, withdrawal]));

      setLoading(false);
      setOpenWithdraw(false);
      setWithdrawAmount('');
      toast({ title: "SAQUE SOLICITADO!", description: "Aguarde a aprovação do administrador." });
    }, 1000);
  };

  const copyPix = () => {
    navigator.clipboard.writeText(companyPix);
    toast({ title: "PIX COPIADO!", description: "Agora cole no seu banco para pagar." });
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
                  <DialogTitle className="font-black uppercase text-primary text-center text-xl">Recarregar Saldo</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                   <div className="bg-primary/5 p-6 rounded-3xl border-2 border-primary/10 space-y-4">
                      <p className="text-[10px] font-black uppercase text-muted-foreground text-center">Chave PIX Oficial LEOBET PRO</p>
                      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border-2 border-primary/20">
                        <span className="font-black text-primary truncate mr-2">{companyPix}</span>
                        <Button onClick={copyPix} size="icon" variant="ghost" className="shrink-0 text-primary hover:bg-primary/10 h-10 w-10">
                          <Copy className="w-5 h-5" />
                        </Button>
                      </div>
                      <p className="text-[9px] text-center font-bold text-muted-foreground uppercase">Copie a chave e faça o pagamento no seu banco</p>
                   </div>
                   
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase block text-center">Quanto deseja recarregar? (R$)</Label>
                      <Input 
                        type="number" 
                        placeholder="0,00" 
                        value={depositAmount} 
                        onChange={e => setDepositAmount(e.target.value)}
                        className="font-black text-2xl h-16 text-center rounded-2xl border-primary/20"
                      />
                   </div>

                   <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-black text-orange-800 uppercase leading-tight">
                        APÓS O PAGAMENTO, VOCÊ DEVERÁ ENVIAR O COMPROVANTE NO WHATSAPP PARA O SALDO SER LIBERADO.
                      </p>
                   </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleDepositRequest} disabled={loading} className="w-full h-16 font-black uppercase bg-primary rounded-2xl shadow-xl transition-all active:scale-95">
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
                <DialogHeader>
                  <DialogTitle className="font-black uppercase text-primary text-center">Solicitar Saque</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                   <div className="bg-muted/50 p-4 rounded-2xl space-y-1">
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Minha Chave PIX Cadastrada:</p>
                      <p className="font-black text-primary text-lg">{user.pixKey || 'NÃO CADASTRADA'}</p>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">Valor do Saque (R$)</Label>
                      <Input 
                        type="number" 
                        placeholder="0,00" 
                        value={withdrawAmount} 
                        onChange={e => setWithdrawAmount(e.target.value)}
                        className="font-black text-xl h-14 rounded-xl"
                      />
                   </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleWithdrawRequest} disabled={loading || !user.pixKey} className="w-full h-14 font-black uppercase bg-primary rounded-xl shadow-lg">
                    {loading ? 'Enviando...' : 'Confirmar Saque'}
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
