
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/use-auth-store';
import { useToast } from '@/hooks/use-toast';
import { UserCircle, ShieldCheck, Key, AlertTriangle } from 'lucide-react';

export default function PerfilPage() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    nome: '',
    pixKey: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || '',
        pixKey: user.pixKey || '',
        phone: user.phone || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const updatedUsers = allUsers.map((u: any) => 
      u.id === user.id ? { ...u, ...formData } : u
    );

    localStorage.setItem('leobet_users', JSON.stringify(updatedUsers));
    const me = updatedUsers.find((u: any) => u.id === user.id);
    if (me) {
      setUser(me);
      localStorage.setItem('logged_user', JSON.stringify(me));
      toast({ title: "PERFIL ATUALIZADO!", description: "Suas informações foram salvas com sucesso." });
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-black uppercase text-primary">Meu Perfil</h1>
            <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Gerencie suas informações de conta e recebimento</p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <Card className="border-t-4 border-t-accent shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/50 border-b">
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-accent" /> Dados Cadastrais
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Nome Completo</Label>
                      <Input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="font-bold h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Telefone/WhatsApp</Label>
                      <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="font-bold h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Email de Acesso</Label>
                      <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="font-bold h-11" disabled />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Status da Conta</Label>
                      <Badge className="bg-green-600 font-black h-11 w-full justify-center uppercase flex items-center">{user.status}</Badge>
                    </div>
                  </div>

                  <div className="p-6 bg-primary/5 rounded-[2rem] border-2 border-primary/10 space-y-4">
                     <div className="flex items-center gap-2 text-primary">
                        <Key className="w-5 h-5" />
                        <h3 className="font-black uppercase text-xs">Dados de Recebimento (PIX)</h3>
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-60">Chave PIX Principal</Label>
                        <Input 
                          value={formData.pixKey} 
                          onChange={e => setFormData({...formData, pixKey: e.target.value})} 
                          placeholder="CPF, Email ou Celular"
                          className="h-12 text-lg font-black text-primary border-primary/20 bg-white"
                        />
                        <div className="flex items-start gap-2 text-orange-600 bg-orange-50 p-3 rounded-xl border border-orange-100">
                           <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                           <p className="text-[9px] font-bold leading-tight uppercase">
                              IMPORTANTE: A LEOBET PRO NÃO SE RESPONSABILIZA POR CHAVES PIX DIGITADAS INCORRETAMENTE. 
                              CERTIFIQUE-SE DE QUE OS DADOS ESTÃO CORRETOS ANTES DE SALVAR.
                           </p>
                        </div>
                     </div>
                  </div>

                  <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 font-black uppercase shadow-xl rounded-xl transition-all active:scale-95">
                    <ShieldCheck className="w-5 h-5 mr-2" /> Salvar Alterações
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
