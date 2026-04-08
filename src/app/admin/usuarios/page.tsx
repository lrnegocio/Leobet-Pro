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
  Smartphone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export default function GestaoUsuariosPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Aprovação, Bloqueio e Auditoria</p>
            </div>
            <Button onClick={loadUsers} variant="outline" className="h-12 w-12 rounded-xl" disabled={syncing}>
              <RefreshCcw className={cn("w-5 h-5", syncing && "animate-spin")} />
            </Button>
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
                                 "text-[8px] font-black uppercase h-5",
                                 u.role === 'admin' ? 'bg-primary' : (u.role === 'cambista' ? 'bg-accent' : 'bg-blue-600')
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
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Saldo: R$ {Number(u.balance || 0).toFixed(2)} | Comiss: R$ {Number(u.commission_balance || 0).toFixed(2)}</p>
                         </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                         {u.status === 'pending' && (
                           <Button 
                             onClick={() => handleUpdateStatus(u.id, 'approved')}
                             className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 h-12 gap-2 font-black uppercase text-[10px] rounded-xl text-white shadow-lg"
                           >
                             <UserCheck className="w-4 h-4" /> Aprovar
                           </Button>
                         )}

                         {u.status === 'approved' && (
                           <Button 
                             onClick={() => handleUpdateStatus(u.id, 'blocked')}
                             variant="outline"
                             className="flex-1 md:flex-none h-12 gap-2 font-black uppercase text-[10px] rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10"
                           >
                             <Ban className="w-4 h-4" /> Bloquear
                           </Button>
                         )}

                         {u.status === 'blocked' && (
                           <Button 
                             onClick={() => handleUpdateStatus(u.id, 'approved')}
                             variant="outline"
                             className="flex-1 md:flex-none h-12 gap-2 font-black uppercase text-[10px] rounded-xl border-green-600/20 text-green-600 hover:bg-green-600/10"
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
      </main>
    </div>
  );
}
