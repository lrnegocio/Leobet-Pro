
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
  Minus,
  AlertCircle,
  Eye,
  EyeOff,
  Edit2
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
  const [openEdit, setOpenEdit] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  
  const [openBalance, setOpenBalance] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceType, setBalanceType] = useState<'balance' | 'commission_balance'>('balance');

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    role: 'gerente',
    phone: '',
    pix_key: '',
    cpf: '',
    birth_date: ''
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
    if (!confirm("CUIDADO! Esta ação removerá permanentemente o usuário.")) return;
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
    
    const amountToAdd = Number(balanceAmount);
    const currentVal = Number(selectedUser[balanceType] || 0);
    let newVal = op === 'add' ? currentVal + amountToAdd : Math.max(0, currentVal - amountToAdd);

    try {
      if (op === 'add' && balanceType === 'balance') {
        const { data: pendingTickets } = await supabase
          .from('tickets')
          .select('*')
          .eq('status', 'pendente')
          .or(`vendedor_id.eq.${selectedUser.id},cliente.eq.${selectedUser.nome}`);

        const totalPending = pendingTickets?.reduce((acc, t) => acc + Number(t.valor_total), 0) || 0;

        if (totalPending > 0 && newVal >= totalPending) {
          for (const ticket of pendingTickets!) {
            const val = Number(ticket.valor_total);
            await supabase.from('tickets').update({ status: 'pago' }).eq('id', ticket.id);
            const { data: vData } = await supabase.from('users').select('*').eq('id', ticket.vendedor_id).single();
            if (vData && vData.role === 'cambista') {
              const comCambista = val * 0.10;
              await supabase.from('users').update({ commission_balance: Number(vData.commission_balance || 0) + comCambista }).eq('id', vData.id);
              if (vData.gerente_id) {
                const comGerente = val * 0.05;
                const { data: gData } = await supabase.from('users').select('*').eq('id', vData.gerente_id).single();
                if (gData) await supabase.from('users').update({ commission_balance: Number(gData.commission_balance || 0) + comGerente }).eq('id', gData.id);
              }
            }
          }
          newVal -= totalPending;
          toast({ title: "ABATIMENTO AUTOMÁTICO!", description: `R$ ${totalPending.toFixed(2)} em pendências foram quitados.` });
        }
      }

      const { error } = await supabase
        .from('users')
        .update({ [balanceType]: newVal })
        .eq('id', selectedUser.id);

      if (error) throw error;
      
      toast({ title: "SALDO ATUALIZADO!" });
      setOpenBalance(false);
      setBalanceAmount('');
      loadUsers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO AO AJUSTAR SALDO" });
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    
    const userData = {
      nome: formData.nome.toUpperCase(),
      email: formData.email.toLowerCase(),
      password: formData.password,
      role: formData.role,
      phone: formData.phone.replace(/\D/g, ''),
      pix_key: formData.pix_key,
      cpf: formData.cpf,
      birth_date: formData.birth_date,
    };

    try {
      if (selectedUser && openEdit) {
        const { error } = await supabase.from('users').update(userData).eq('id', selectedUser.id);
        if (error) throw error;
        toast({ title: "DADOS ATUALIZADOS!" });
      } else {
        const newUser = {
          id: Math.random().toString(36).substring(7).toUpperCase(),
          ...userData,
          status: 'approved',
          balance: 0,
          commission_balance: 0,
          pending_balance: 0,
          created_at: new Date().toISOString()
        };
        const { error } = await supabase.from('users').insert([newUser]);
        if (error) throw error;
        toast({ title: "USUÁRIO CRIADO!" });
      }
      
      setOpenCreate(false);
      setOpenEdit(false);
      setFormData({ nome: '', email: '', password: '', role: 'gerente', phone: '', pix_key: '', cpf: '', birth_date: '' });
      loadUsers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "FALHA NA OPERAÇÃO", description: err.message });
    } finally { setSyncing(false); }
  };

  const startEdit = (u: any) => {
    setSelectedUser(u);
    setFormData({
      nome: u.nome,
      email: u.email,
      password: u.password || '',
      role: u.role,
      phone: u.phone || '',
      pix_key: u.pix_key || '',
      cpf: u.cpf || '',
      birth_date: u.birth_date || ''
    });
    setOpenEdit(true);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredUsers = users.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
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
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Controle Financeiro e de Acesso Master</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { setOpenCreate(true); setSelectedUser(null); setFormData({ nome: '', email: '', password: '', role: 'gerente', phone: '', pix_key: '', cpf: '', birth_date: '' }); }} className="bg-accent hover:bg-accent/90 h-12 gap-2 font-black uppercase text-xs rounded-xl shadow-lg">
                <UserPlus className="w-4 h-4" /> Novo Membro
              </Button>
              <Button onClick={loadUsers} variant="outline" className="h-12 w-12 rounded-xl"><RefreshCcw className={cn("w-5 h-5", syncing && "animate-spin")} /></Button>
            </div>
          </div>

          <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border items-center">
            <Search className="w-5 h-5 text-muted-foreground ml-3" />
            <Input placeholder="Pesquisar por nome ou e-mail..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border-none focus-visible:ring-0 font-bold" />
          </div>

          <div className="grid grid-cols-1 gap-4 pb-20">
            {loading ? (
              <div className="py-20 text-center animate-pulse font-black uppercase text-xs">Consultando Supabase...</div>
            ) : filteredUsers.map((u) => (
              <Card key={u.id} className={cn(
                "border-l-8 rounded-3xl overflow-hidden transition-all hover:shadow-md bg-white",
                u.status === 'pending' ? 'border-l-orange-500' : (u.status === 'blocked' ? 'border-l-destructive' : 'border-l-green-600')
              )}>
                <CardContent className="p-6">
                   <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-4 flex-1">
                         <div className="bg-primary/10 p-4 rounded-2xl"><Users className="w-8 h-8 text-primary" /></div>
                         <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               <h3 className="text-lg font-black uppercase text-primary leading-none">{u.nome}</h3>
                               <Badge className={cn("text-[8px] h-5 uppercase", u.role === 'admin' ? 'bg-primary' : (u.role === 'gerente' ? 'bg-blue-700' : 'bg-accent'))}>{u.role}</Badge>
                            </div>
                            <div className="flex flex-col gap-1">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">{u.email} • {u.phone || 'Sem Zap'}</p>
                              <div className="flex items-center gap-2 bg-muted/50 w-fit px-2 py-1 rounded-lg">
                                <span className="text-[9px] font-black uppercase opacity-50">Senha:</span>
                                <span className="text-[10px] font-black">{visiblePasswords[u.id] ? u.password : '••••••••'}</span>
                                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => togglePasswordVisibility(u.id)}>
                                  {visiblePasswords[u.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </Button>
                              </div>
                            </div>
                            <div className="flex gap-4 mt-2">
                               <div className="bg-muted p-2 rounded-xl border">
                                  <p className="text-[7px] font-black uppercase opacity-60">Apostas</p>
                                  <p className="text-sm font-black text-primary">R$ {Number(u.balance || 0).toFixed(2)}</p>
                               </div>
                               <div className="bg-muted p-2 rounded-xl border">
                                  <p className="text-[7px] font-black uppercase opacity-60">Comissões</p>
                                  <p className="text-sm font-black text-accent">R$ {Number(u.commission_balance || 0).toFixed(2)}</p>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                         <Button onClick={() => startEdit(u)} variant="outline" className="h-12 gap-2 font-black uppercase text-[10px] rounded-xl"><Edit2 className="w-4 h-4" /> Editar</Button>
                         <Button onClick={() => { setSelectedUser(u); setOpenBalance(true); }} className="bg-primary h-12 gap-2 font-black uppercase text-[10px] rounded-xl"><Wallet className="w-4 h-4" /> Saldo</Button>
                         {u.status === 'pending' && <Button onClick={() => handleUpdateStatus(u.id, 'approved')} className="bg-green-600 h-12 gap-2 font-black uppercase text-[10px] rounded-xl"><UserCheck className="w-4 h-4" /> Aprovar</Button>}
                         {u.status === 'approved' ? (
                           <Button onClick={() => handleUpdateStatus(u.id, 'blocked')} variant="outline" className="h-12 gap-2 font-black uppercase text-[10px] rounded-xl text-destructive"><Ban className="w-4 h-4" /> Bloquear</Button>
                         ) : (
                           u.status !== 'pending' && <Button onClick={() => handleUpdateStatus(u.id, 'approved')} variant="outline" className="h-12 gap-2 font-black uppercase text-[10px] rounded-xl text-green-600"><CheckCircle2 className="w-4 h-4" /> Desbloquear</Button>
                         )}
                         <Button onClick={() => handleDeleteUser(u.id)} variant="ghost" size="icon" className="h-12 w-12 text-destructive border rounded-xl"><Trash2 className="w-5 h-5" /></Button>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* DIALOG DE CRIAÇÃO/EDIÇÃO */}
        <Dialog open={openCreate || openEdit} onOpenChange={(v) => { setOpenCreate(v); if(!v) setOpenEdit(false); }}>
          <DialogContent className="bg-white rounded-[2rem] border-none max-w-lg">
            <DialogHeader><DialogTitle className="font-black uppercase text-primary text-center">{openEdit ? 'Editar Usuário' : 'Cadastrar Membro'}</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateOrUpdateUser} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase opacity-60">Cargo</Label>
                <select className="w-full h-12 border-2 rounded-xl px-3 font-bold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="gerente">GERENTE (Diretoria)</option>
                  <option value="cambista">CAMBISTA (Vendedor)</option>
                  <option value="cliente">CLIENTE (Apostador)</option>
                  <option value="admin">ADMIN (Master)</option>
                </select>
              </div>
              <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Nome Completo</Label><Input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required className="h-11 font-bold" /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">CPF</Label><Input value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} className="h-11 font-bold" /></div>
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Data Nascimento</Label><Input type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} className="h-11 font-bold" /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">WhatsApp</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-11 font-bold" /></div>
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Chave PIX</Label><Input value={formData.pix_key} onChange={e => setFormData({...formData, pix_key: e.target.value})} className="h-11 font-bold" /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Usuário (E-mail)</Label><Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="h-11 font-bold" /></div>
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Senha</Label><Input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="h-11 font-bold" /></div>
              </div>

              <Button type="submit" className="w-full h-14 bg-primary text-white font-black uppercase rounded-xl mt-4" disabled={syncing}>
                {openEdit ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR E ATIVAR'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG DE SALDO */}
        <Dialog open={openBalance} onOpenChange={setOpenBalance}>
          <DialogContent className="bg-white rounded-[2.5rem] border-none max-w-sm">
            <DialogHeader><DialogTitle className="font-black uppercase text-primary text-center">Ajustar Saldo de {selectedUser?.nome}</DialogTitle></DialogHeader>
            <div className="space-y-6 py-4">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60">Tipo de Saldo</Label>
                  <div className="flex gap-2">
                     <Button variant={balanceType === 'balance' ? 'default' : 'outline'} className="flex-1 h-10 font-black text-[10px]" onClick={() => setBalanceType('balance')}>APOSTAS</Button>
                     <Button variant={balanceType === 'commission_balance' ? 'default' : 'outline'} className="flex-1 h-10 font-black text-[10px]" onClick={() => setBalanceType('commission_balance')}>COMISSÕES</Button>
                  </div>
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60">Valor R$</Label>
                  <Input type="number" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} className="h-14 text-center font-black text-2xl rounded-2xl" placeholder="0.00" />
               </div>
               <div className="flex gap-3">
                  <Button onClick={() => handleAdjustBalance('remove')} variant="destructive" className="flex-1 h-14 font-black uppercase rounded-xl"><Minus className="w-4 h-4" /> Retirar</Button>
                  <Button onClick={() => handleAdjustBalance('add')} className="flex-1 h-14 bg-green-600 font-black uppercase rounded-xl text-white"><Plus className="w-4 h-4" /> Adicionar</Button>
               </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
