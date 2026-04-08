
'use client';

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CheckCircle2, 
  Ban, 
  Trash2, 
  Database, 
  RefreshCcw,
  Search,
  UserCheck,
  UserPlus,
  ShieldCheck,
  X,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Minus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

export default function GestaoUsuariosPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  
  // MODAL AJUSTE DE SALDO
  const [openBalance, setOpenBalance] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceType, setBalanceType] = useState<'balance' | 'commission_balance'>('balance');

  // FORM NOVO USUÁRIO
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    role: 'gerente',
    phone: '',
    pix_key: '',
    cpf: ''
  });

  const loadUsers = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO AO CARREGAR", description: err.message });
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadUsers();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('users').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      toast({ title: `STATUS ATUALIZADO: ${newStatus.toUpperCase()}` });
      loadUsers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO NA ATUALIZAÇÃO" });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("CUIDADO! Esta ação removerá permanentemente o usuário e todos os registros associados.")) return;
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "USUÁRIO EXCLUÍDO!" });
      loadUsers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO AO EXCLUIR" });
    }
  };

  const handleAdjustBalance = async (op: 'add' | 'remove') => {
    if (!selectedUser || !balanceAmount) return;
    setSyncing(true);
    
    const amount = Number(balanceAmount);
    const currentVal = Number(selectedUser[balanceType] || 0);
    const newVal = op === 'add' ? currentVal + amount : Math.max(0, currentVal - amount);

    try {
      const { error } = await supabase
        .from('users')
        .update({ [balanceType]: newVal })
        .eq('id', selectedUser.id);

      if (error) throw error;
      
      toast({ title: "SALDO ATUALIZADO!", description: `Novo saldo: R$ ${newVal.toFixed(2)}` });
      setOpenBalance(false);
      setBalanceAmount('');
      loadUsers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO AO AJUSTAR SALDO" });
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    
    const newUser = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      nome: formData.nome.toUpperCase(),
      email: formData.email.toLowerCase(),
      password: formData.password,
      role: formData.role,
      phone: formData.phone.replace(/\D/g, ''),
      pix_key: formData.pix_key,
      cpf: formData.cpf,
      status: 'approved',
      balance: 0,
      commission_balance: 0,
      pending_balance: 0,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('users').insert([newUser]);
      if (error) throw error;
      
      toast({ title: "USUÁRIO CRIADO COM SUCESSO!" });
      setOpenCreate(false);
      setFormData({ nome: '', email: '', password: '', role: 'gerente', phone: '', pix_key: '', cpf: '' });
      loadUsers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO AO CRIAR", description: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm)
  );

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black uppercase text-primary leading-none flex items-center gap-3">
                Gestão de Usuários <Database className="w-6 h-6 text-green-600" />
              </h1>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Aprovação, Cadastro de Gerentes e Auditoria de Saldo</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                <DialogTrigger asChild>
                  <Button className="bg-accent hover:bg-accent/90 h-12 gap-2 font-black uppercase text-xs rounded-xl shadow-lg text-white">
                    <UserPlus className="w-4 h-4" /> Novo Usuário Master
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white rounded-[2rem] border-none max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-black uppercase text-primary text-center">Cadastrar Novo Usuário</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase opacity-60">Cargo</Label>
                      <select 
                        className="w-full h-12 border-2 rounded-xl px-3 font-bold"
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                      >
                        <option value="gerente">GERENTE (Diretoria)</option>
                        <option value="cambista">CAMBISTA (Vendedor)</option>
                        <option value="cliente">CLIENTE (Apostador)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase opacity-60">Nome Completo</Label>
                      <Input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required className="h-11 font-bold" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase opacity-60">E-mail / Usuário</Label>
                        <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="h-11 font-bold" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase opacity-60">Senha Inicial</Label>
                        <Input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="h-11 font-bold" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase opacity-60">WhatsApp (DDD)</Label>
                        <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-11 font-bold" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase opacity-60">Chave PIX</Label>
                        <Input value={formData.pix_key} onChange={e => setFormData({...formData, pix_key: e.target.value})} className="h-11 font-bold" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-14 bg-primary text-white font-black uppercase rounded-xl mt-4" disabled={syncing}>
                      {syncing ? 'CRIANDO...' : 'CADASTRAR E ATIVAR'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Button onClick={loadUsers} variant="outline" className="h-12 w-12 rounded-xl" disabled={syncing}>
                <RefreshCcw className={cn("w-5 h-5", syncing && "animate-spin")} />
              </Button>
            </div>
          </div>

          <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border items-center">
            <Search className="w-5 h-5 text-muted-foreground ml-3" />
            <Input 
              placeholder="Pesquisar por nome, email ou telefone..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="border-none shadow-none focus-visible:ring-0 font-bold"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <div className="py-20 text-center animate-pulse font-black uppercase text-xs opacity-40">Consultando Supabase...</div>
            ) : filteredUsers.length === 0 ? (
              <Card className="py-20 text-center opacity-30 border-dashed rounded-[3rem]">
                <Users className="w-12 h-12 mx-auto mb-4" />
                <p className="font-black uppercase text-xs">Nenhum usuário encontrado</p>
              </Card>
            ) : filteredUsers.map((u) => (
              <Card key={u.id} className={cn(
                "border-l-8 rounded-3xl overflow-hidden transition-all hover:shadow-md bg-white",
                u.status === 'pending' ? 'border-l-orange-500' : (u.status === 'blocked' ? 'border-l-destructive' : 'border-l-green-600')
              )}>
                <CardContent className="p-6">
                   <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-4 flex-1">
                         <div className="bg-primary/10 p-4 rounded-2xl">
                            <Users className="w-8 h-8 text-primary" />
                         </div>
                         <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               <h3 className="text-lg font-black uppercase text-primary leading-none">{u.nome}</h3>
                               <Badge className={cn(
                                 "text-[8px] font-black uppercase h-5 text-white",
                                 u.role === 'admin' ? 'bg-primary' : (u.role === 'gerente' ? 'bg-blue-700' : (u.role === 'cambista' ? 'bg-accent' : 'bg-green-600'))
                               )}>
                                 {u.role}
                               </Badge>
                               <Badge variant="outline" className={cn(
                                 "text-[8px] font-black uppercase h-5",
                                 u.status === 'approved' ? 'text-green-600' : (u.status === 'pending' ? 'text-orange-600' : 'text-destructive')
                               )}>
                                 {u.status}
                               </Badge>
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{u.email} • {u.phone || 'Sem Telefone'}</p>
                            <div className="flex gap-4 mt-2">
                               <div className="bg-muted p-2 rounded-xl border border-primary/10">
                                  <p className="text-[7px] font-black uppercase text-muted-foreground">Saldo Disponível</p>
                                  <p className="text-sm font-black text-primary leading-none">R$ {Number(u.balance || 0).toFixed(2)}</p>
                               </div>
                               <div className="bg-muted p-2 rounded-xl border border-accent/10">
                                  <p className="text-[7px] font-black uppercase text-muted-foreground">Saldo Comissões</p>
                                  <p className="text-sm font-black text-accent leading-none">R$ {Number(u.commission_balance || 0).toFixed(2)}</p>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
                         <Button 
                           onClick={() => { setSelectedUser(u); setOpenBalance(true); }}
                           className="bg-primary hover:bg-primary/90 h-12 gap-2 font-black uppercase text-[10px] rounded-xl text-white shadow-md"
                         >
                           <Wallet className="w-4 h-4" /> Ajustar Saldo
                         </Button>

                         {u.status === 'pending' && (
                           <Button 
                             onClick={() => handleUpdateStatus(u.id, 'approved')}
                             className="bg-green-600 hover:bg-green-700 h-12 gap-2 font-black uppercase text-[10px] rounded-xl text-white shadow-lg"
                           >
                             <UserCheck className="w-4 h-4" /> Aprovar
                           </Button>
                         )}

                         {u.status === 'approved' && (
                           <Button 
                             onClick={() => handleUpdateStatus(u.id, 'blocked')}
                             variant="outline"
                             className="h-12 gap-2 font-black uppercase text-[10px] rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10"
                           >
                             <Ban className="w-4 h-4" /> Bloquear
                           </Button>
                         )}

                         {u.status === 'blocked' && (
                           <Button 
                             onClick={() => handleUpdateStatus(u.id, 'approved')}
                             variant="outline"
                             className="h-12 gap-2 font-black uppercase text-[10px] rounded-xl border-green-600/20 text-green-600 hover:bg-green-600/10"
                           >
                             <CheckCircle2 className="w-4 h-4" /> Desbloquear
                           </Button>
                         )}

                         <Button 
                           onClick={() => handleDeleteUser(u.id)}
                           variant="ghost" 
                           size="icon" 
                           className="h-12 w-12 text-destructive hover:bg-destructive/10 border rounded-xl"
                         >
                           <Trash2 className="w-5 h-5" />
                         </Button>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* MODAL AJUSTE DE SALDO */}
        <Dialog open={openBalance} onOpenChange={setOpenBalance}>
          <DialogContent className="bg-white rounded-[2.5rem] border-none max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-black uppercase text-primary text-center">Ajustar Saldo de {selectedUser?.nome}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60">Tipo de Saldo</Label>
                  <div className="flex gap-2">
                     <Button 
                       variant={balanceType === 'balance' ? 'default' : 'outline'} 
                       className="flex-1 h-10 font-black uppercase text-[10px]"
                       onClick={() => setBalanceType('balance')}
                     >Apostas</Button>
                     <Button 
                       variant={balanceType === 'commission_balance' ? 'default' : 'outline'} 
                       className="flex-1 h-10 font-black uppercase text-[10px]"
                       onClick={() => setBalanceType('commission_balance')}
                     >Comissões</Button>
                  </div>
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60">Valor R$</Label>
                  <Input type="number" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} className="h-14 text-center font-black text-2xl rounded-2xl" placeholder="0.00" />
               </div>
               <div className="flex gap-3">
                  <Button onClick={() => handleAdjustBalance('remove')} variant="destructive" className="flex-1 h-14 font-black uppercase rounded-xl gap-2">
                    <Minus className="w-4 h-4" /> Retirar
                  </Button>
                  <Button onClick={() => handleAdjustBalance('add')} className="flex-1 h-14 bg-green-600 hover:bg-green-700 font-black uppercase rounded-xl gap-2 text-white">
                    <Plus className="w-4 h-4" /> Adicionar
                  </Button>
               </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
