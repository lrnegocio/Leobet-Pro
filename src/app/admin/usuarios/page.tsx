'use client';

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Trash2, Database, Search, UserPlus, Eye, EyeOff, Edit2, Wallet, Plus, Minus, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

export default function GestaoUsuariosPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openBalance, setOpenBalance] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceType, setBalanceType] = useState<'balance' | 'commission_balance'>('balance');

  const [formData, setFormData] = useState({ 
    nome: '', email: '', password: '', role: 'cambista', phone: '', pix_key: '', cpf: '', commission_rate: 10 
  });

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) { toast({ variant: "destructive", title: "ERRO AO CARREGAR" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleAdjustBalance = async (op: 'add' | 'remove') => {
    if (!selectedUser || !balanceAmount) return;
    const amt = Number(balanceAmount);
    const current = Number(selectedUser[balanceType] || 0);
    const newVal = op === 'add' ? current + amt : Math.max(0, current - amt);

    try {
      const { error } = await supabase.from('users').update({ [balanceType]: newVal }).eq('id', selectedUser.id);
      if (error) throw error;
      toast({ title: "SALDO ATUALIZADO!" });
      setOpenBalance(false); loadUsers();
    } catch (e) { toast({ variant: "destructive", title: "ERRO AO AJUSTAR" }); }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { 
      ...formData, 
      nome: formData.nome.toUpperCase(), 
      email: formData.email.toLowerCase(),
      commission_rate: formData.role === 'cliente' ? 0 : Number(formData.commission_rate)
    };
    try {
      if (selectedUser && openEdit) {
        const { error } = await supabase.from('users').update(data).eq('id', selectedUser.id);
        if (error) throw error;
        toast({ title: "DADOS ATUALIZADOS!" });
      } else {
        const id = Math.random().toString(36).substring(7).toUpperCase();
        const { error } = await supabase.from('users').insert([{ id, ...data, status: 'approved' }]);
        if (error) throw error;
        toast({ title: "USUÁRIO CRIADO!" });
      }
      setOpenCreate(false); setOpenEdit(false); loadUsers();
    } catch (e: any) { toast({ variant: "destructive", title: "FALHA", description: e.message }); }
  };

  const filteredUsers = users.filter(u => u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black uppercase text-primary leading-none">Gestão de Rede <Database className="inline w-6 h-6 text-green-600" /></h1>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Controle de Acessos e Comissões</p>
            </div>
            <Button onClick={() => { setOpenCreate(true); setSelectedUser(null); setFormData({ nome: '', email: '', password: '', role: 'cambista', phone: '', pix_key: '', cpf: '', commission_rate: 10 }); }} className="bg-accent h-12 gap-2 font-black uppercase text-xs rounded-xl shadow-lg"><UserPlus className="w-4 h-4" /> Novo</Button>
          </div>

          <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border items-center">
            <Search className="w-5 h-5 text-muted-foreground ml-3" />
            <Input placeholder="Pesquisar por nome ou e-mail..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border-none focus-visible:ring-0 font-bold" />
          </div>

          <div className="grid grid-cols-1 gap-4 pb-20">
            {loading ? <div className="py-20 text-center animate-pulse font-black uppercase text-xs">Conectando ao Banco...</div> : filteredUsers.map((u) => (
              <Card key={u.id} className="border-l-8 border-l-primary rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-primary/10 p-4 rounded-2xl"><Users className="w-8 h-8 text-primary" /></div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black uppercase text-primary leading-none">{u.nome}</h3>
                        <Badge className="text-[8px] h-5 uppercase">{u.role}</Badge>
                        {u.role !== 'cliente' && (
                          <Badge variant="outline" className="text-[9px] font-black border-accent text-accent h-5">COMISSÃO: {u.commission_rate || 0}%</Badge>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{u.email} • {u.phone || 'Sem Telefone'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => { setSelectedUser(u); setOpenBalance(true); }} className="bg-primary h-12 gap-2 font-black uppercase text-[10px] rounded-xl"><Wallet className="w-4 h-4" /> Saldo</Button>
                    <Button onClick={() => { setSelectedUser(u); setFormData({ ...u }); setOpenEdit(true); }} variant="outline" className="h-12 gap-2 font-black uppercase text-[10px] rounded-xl border-2"><Edit2 className="w-4 h-4" /> Editar</Button>
                    <Button onClick={async () => { if(confirm("EXCLUIR USUÁRIO DEFINITIVAMENTE?")) { await supabase.from('users').delete().eq('id', u.id); loadUsers(); } }} variant="ghost" size="icon" className="h-12 w-12 text-destructive border-2 rounded-xl"><Trash2 className="w-5 h-5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Dialog open={openCreate || openEdit} onOpenChange={v => { setOpenCreate(v); if(!v) setOpenEdit(false); }}>
          <DialogContent className="bg-white rounded-[2rem] border-none max-w-lg">
            <DialogHeader><DialogTitle className="font-black uppercase text-primary text-center">Configurar Usuário</DialogTitle></DialogHeader>
            <form onSubmit={handleSaveUser} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase opacity-60">Cargo / Nível</Label>
                  <select className="w-full h-11 border-2 rounded-xl px-3 font-bold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="cambista">CAMBISTA</option>
                    <option value="gerente">GERENTE</option>
                    <option value="cliente">CLIENTE</option>
                    <option value="admin">ADMIN</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase opacity-60">Taxa de Comissão (%)</Label>
                  <Input type="number" value={formData.commission_rate} onChange={e => setFormData({...formData, commission_rate: Number(e.target.value)})} className="h-11 font-bold" disabled={formData.role === 'cliente'} />
                </div>
              </div>
              <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Nome Completo</Label><Input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required className="h-11 font-bold uppercase" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">WhatsApp</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-11 font-bold" /></div>
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Chave PIX</Label><Input value={formData.pix_key} onChange={e => setFormData({...formData, pix_key: e.target.value})} className="h-11 font-bold uppercase" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Login / E-mail</Label><Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="h-11 font-bold" /></div>
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Senha</Label><Input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="h-11 font-bold" /></div>
              </div>
              <Button type="submit" className="w-full h-14 bg-primary text-white font-black uppercase rounded-xl shadow-lg">SALVAR NO BANCO</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={openBalance} onOpenChange={setOpenBalance}>
          <DialogContent className="bg-white rounded-[2.5rem] border-none max-w-sm">
            <DialogHeader><DialogTitle className="font-black uppercase text-primary text-center">Ajustar Saldo</DialogTitle></DialogHeader>
            <div className="space-y-6 py-4">
               <div className="flex gap-2">
                 <Button variant={balanceType === 'balance' ? 'default' : 'outline'} className="flex-1 rounded-xl h-12 font-black uppercase text-[10px]" onClick={() => setBalanceType('balance')}>SALDO APOSTAS</Button>
                 <Button variant={balanceType === 'commission_balance' ? 'default' : 'outline'} className="flex-1 rounded-xl h-12 font-black uppercase text-[10px]" onClick={() => setBalanceType('commission_balance')}>COMISSÕES</Button>
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-center block opacity-60">Valor em R$</Label>
                 <Input type="number" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} className="h-16 text-center font-black text-3xl rounded-2xl border-2" placeholder="0,00" />
               </div>
               <div className="flex gap-3">
                 <Button onClick={() => handleAdjustBalance('remove')} variant="destructive" className="flex-1 h-14 font-black uppercase rounded-xl">Retirar</Button>
                 <Button onClick={() => handleAdjustBalance('add')} className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white font-black uppercase rounded-xl">Adicionar</Button>
               </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
