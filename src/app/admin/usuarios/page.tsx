'use client';

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle2, Ban, Trash2, Database, RefreshCcw, Search, UserCheck, UserPlus, Eye, EyeOff, Edit2, Wallet, Plus, Minus } from 'lucide-react';
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
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openBalance, setOpenBalance] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceType, setBalanceType] = useState<'balance' | 'commission_balance'>('balance');

  const [formData, setFormData] = useState({ nome: '', email: '', password: '', role: 'gerente', phone: '', pix_key: '', cpf: '', birth_date: '' });

  const loadUsers = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) { toast({ variant: "destructive", title: "ERRO AO CARREGAR" }); }
    finally { setLoading(false); setSyncing(false); }
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

  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData, nome: formData.nome.toUpperCase(), email: formData.email.toLowerCase() };
    try {
      if (selectedUser && openEdit) {
        await supabase.from('users').update(data).eq('id', selectedUser.id);
        toast({ title: "DADOS ATUALIZADOS!" });
      } else {
        const id = Math.random().toString(36).substring(7).toUpperCase();
        await supabase.from('users').insert([{ id, ...data, status: 'approved' }]);
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
              <h1 className="text-3xl font-black uppercase text-primary leading-none">Gestão de Usuários <Database className="inline w-6 h-6 text-green-600" /></h1>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Controle de Acesso e Saldos Master</p>
            </div>
            <Button onClick={() => { setOpenCreate(true); setSelectedUser(null); }} className="bg-accent h-12 gap-2 font-black uppercase text-xs rounded-xl shadow-lg"><UserPlus className="w-4 h-4" /> Novo Membro</Button>
          </div>

          <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border items-center">
            <Search className="w-5 h-5 text-muted-foreground ml-3" />
            <Input placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border-none focus-visible:ring-0 font-bold" />
          </div>

          <div className="grid grid-cols-1 gap-4 pb-20">
            {loading ? <div className="py-20 text-center animate-pulse font-black uppercase text-xs">Consultando Supabase...</div> : filteredUsers.map((u) => (
              <Card key={u.id} className={cn("border-l-8 rounded-3xl overflow-hidden bg-white", u.status === 'blocked' ? 'border-l-destructive' : 'border-l-green-600')}>
                <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-primary/10 p-4 rounded-2xl"><Users className="w-8 h-8 text-primary" /></div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black uppercase text-primary leading-none">{u.nome} <Badge className="text-[8px] h-5 uppercase ml-2">{u.role}</Badge></h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{u.email} • {u.phone || 'Sem Zap'}</p>
                      <div className="flex gap-2 items-center bg-muted/50 w-fit px-2 py-1 rounded-lg">
                        <span className="text-[9px] font-black opacity-50 uppercase">Senha:</span>
                        <span className="text-[10px] font-black">{visiblePasswords[u.id] ? u.password : '••••••••'}</span>
                        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setVisiblePasswords(p => ({ ...p, [u.id]: !p[u.id] }))}>{visiblePasswords[u.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</Button>
                      </div>
                      <div className="flex gap-4 mt-2">
                        <div className="bg-muted p-2 rounded-xl border text-center min-w-[100px]"><p className="text-[7px] font-black uppercase opacity-60">Apostas</p><p className="text-sm font-black text-primary">R$ {Number(u.balance || 0).toFixed(2)}</p></div>
                        <div className="bg-muted p-2 rounded-xl border text-center min-w-[100px]"><p className="text-[7px] font-black uppercase opacity-60">Comissões</p><p className="text-sm font-black text-accent">R$ {Number(u.commission_balance || 0).toFixed(2)}</p></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => { setSelectedUser(u); setOpenBalance(true); }} className="bg-primary h-12 gap-2 font-black uppercase text-[10px] rounded-xl"><Wallet className="w-4 h-4" /> Saldo</Button>
                    <Button onClick={() => { setSelectedUser(u); setFormData({ ...u }); setOpenEdit(true); }} variant="outline" className="h-12 gap-2 font-black uppercase text-[10px] rounded-xl"><Edit2 className="w-4 h-4" /> Editar</Button>
                    <Button onClick={async () => { await supabase.from('users').delete().eq('id', u.id); loadUsers(); }} variant="ghost" size="icon" className="h-12 w-12 text-destructive border rounded-xl"><Trash2 className="w-5 h-5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Dialog open={openCreate || openEdit} onOpenChange={v => { setOpenCreate(v); if(!v) setOpenEdit(false); }}>
          <DialogContent className="bg-white rounded-[2rem] border-none max-w-lg">
            <DialogHeader><DialogTitle className="font-black uppercase text-primary text-center">{openEdit ? 'Editar Usuário' : 'Cadastrar Membro'}</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateOrUpdateUser} className="space-y-4 py-4">
              <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Cargo</Label><select className="w-full h-12 border-2 rounded-xl px-3 font-bold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}><option value="gerente">GERENTE</option><option value="cambista">CAMBISTA</option><option value="cliente">CLIENTE</option><option value="admin">ADMIN</option></select></div>
              <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Nome Completo</Label><Input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required className="h-11 font-bold" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">WhatsApp</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-11 font-bold" /></div>
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Chave PIX</Label><Input value={formData.pix_key} onChange={e => setFormData({...formData, pix_key: e.target.value})} className="h-11 font-bold" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">E-mail (Login)</Label><Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="h-11 font-bold" /></div>
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Senha</Label><Input value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="h-11 font-bold" /></div>
              </div>
              <Button type="submit" className="w-full h-14 bg-primary text-white font-black uppercase rounded-xl mt-4">SALVAR ALTERAÇÕES</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={openBalance} onOpenChange={setOpenBalance}>
          <DialogContent className="bg-white rounded-[2.5rem] border-none max-w-sm">
            <DialogHeader><DialogTitle className="font-black uppercase text-primary text-center">Ajustar Saldo</DialogTitle></DialogHeader>
            <div className="space-y-6 py-4 text-center">
               <div className="flex gap-2"><Button variant={balanceType === 'balance' ? 'default' : 'outline'} className="flex-1 h-10 font-black text-[10px]" onClick={() => setBalanceType('balance')}>APOSTAS</Button><Button variant={balanceType === 'commission_balance' ? 'default' : 'outline'} className="flex-1 h-10 font-black text-[10px]" onClick={() => setBalanceType('commission_balance')}>COMISSÕES</Button></div>
               <Input type="number" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} className="h-14 text-center font-black text-2xl rounded-2xl" placeholder="0.00" />
               <div className="flex gap-3"><Button onClick={() => handleAdjustBalance('remove')} variant="destructive" className="flex-1 h-14 font-black uppercase rounded-xl"><Minus className="w-4 h-4" /> Retirar</Button><Button onClick={() => handleAdjustBalance('add')} className="flex-1 h-14 bg-green-600 font-black uppercase rounded-xl text-white"><Plus className="w-4 h-4" /> Adicionar</Button></div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
