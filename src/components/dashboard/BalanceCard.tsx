
"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, ArrowUpCircle, ArrowDownCircle, ExternalLink, ShieldCheck } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const handleWithdrawRequest = () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      toast({ variant: "destructive", title: "VALOR INVÁLIDO" });
      return;
    }

    if (amount > user.balance) {
      toast({ variant: "destructive", title: "SALDO INSUFICIENTE", description: `Seu saldo atual é R$ ${user.balance.toFixed(2)}` });
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

      const existing = JSON.parse(localStorage.getItem('leobet_withdrawals') || '[]');
      localStorage.setItem('leobet_withdrawals', JSON.stringify([...existing, withdrawal]));

      setLoading(false);
      setOpen(false);
      setWithdrawAmount('');
      toast({ title: "SOLICITAÇÃO ENVIADA!", description: "Seu saque será processado pelo administrador em até 24h." });
    }, 1000);
  };

  return (
    <Card className="bg-primary text-white overflow-hidden relative border-none">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Wallet className="w-24 h-24" />
      </div>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-white/70">Meu Saldo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-4xl font-bold">R$ {user.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        
        {user.role === 'admin' ? (
          <Link href="/admin/financeiro" className="block">
            <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white gap-2 uppercase font-black text-xs">
              <ExternalLink className="w-4 h-4" /> Gerenciar Finanças
            </Button>
          </Link>
        ) : (
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 border-white/20 hover:bg-white/10 text-white gap-2 uppercase font-black text-[10px]">
              <ArrowUpCircle className="w-4 h-4" /> Depósito
            </Button>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 border-white/20 hover:bg-white/10 text-white gap-2 uppercase font-black text-[10px]">
                  <ArrowDownCircle className="w-4 h-4" /> Saque
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="font-black uppercase text-primary">Solicitar Saque</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                   <div className="bg-muted p-4 rounded-xl space-y-1">
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Chave PIX de Destino:</p>
                      <p className="font-black text-primary">{user.pixKey || 'NÃO CADASTRADA'}</p>
                      {!user.pixKey && <p className="text-[9px] text-destructive font-bold uppercase">Cadastre seu PIX no Perfil para sacar</p>}
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">Valor do Saque (R$)</Label>
                      <Input 
                        type="number" 
                        placeholder="0,00" 
                        value={withdrawAmount} 
                        onChange={e => setWithdrawAmount(e.target.value)}
                        className="font-bold text-lg h-12"
                      />
                   </div>
                   <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-orange-600 mt-0.5" />
                      <p className="text-[9px] font-bold text-orange-700 uppercase leading-tight">
                        O valor será enviado para sua chave PIX cadastrada. Certifique-se de que os dados estão corretos.
                      </p>
                   </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleWithdrawRequest} disabled={loading || !user.pixKey} className="w-full h-12 font-black uppercase bg-primary">
                    {loading ? 'Processando...' : 'Confirmar Saque'}
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
