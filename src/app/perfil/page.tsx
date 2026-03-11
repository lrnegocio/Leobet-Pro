
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
import { supabase } from '@/supabase/client';

export default function PerfilPage() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    nome: '',
    pixKey: '',
    phone: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || '',
        pixKey: user.pixKey || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          nome: formData.nome.toUpperCase(),
          pix_key: formData.pixKey,
          phone: formData.phone
        })
        .eq('id', user.id);

      if (error) throw error;

      const updatedUser = { ...user, ...formData, nome: formData.nome.toUpperCase() };
      setUser(updatedUser);
      localStorage.setItem('logged_user', JSON.stringify(updatedUser));
      toast({ title: "PERFIL ATUALIZADO!" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: err.message });
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div><h1 className="text-3xl font-black uppercase text-primary">Meu Perfil</h1><p className="text-[10px] font-black uppercase opacity-60">Gestão Global Supabase</p></div>
          <Card className="border-t-4 border-t-accent shadow-xl rounded-2xl">
            <CardHeader><CardTitle className="text-sm font-black uppercase flex items-center gap-2"><UserCircle className="w-4 h-4 text-accent" /> Dados Cadastrais</CardTitle></CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Nome Completo</Label><Input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="font-bold h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">WhatsApp</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="font-bold h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Status</Label><Badge className="bg-green-600 font-black h-11 w-full justify-center uppercase">{user.status}</Badge></div>
                </div>
                <div className="p-6 bg-primary/5 rounded-[2rem] border-2 border-primary/10 space-y-4">
                   <div className="flex items-center gap-2 text-primary"><Key className="w-5 h-5" /><h3 className="font-black uppercase text-xs">Chave PIX Oficial</h3></div>
                   <Input value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} placeholder="CPF, Email ou Celular" className="h-12 text-lg font-black text-primary border-primary/20 bg-white" />
                   <div className="flex items-start gap-2 text-orange-600 bg-orange-50 p-3 rounded-xl border border-orange-100">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><p className="text-[9px] font-black uppercase leading-tight">Mantenha seus dados PIX corretos para receber seus prêmios e comissões.</p>
                   </div>
                </div>
                <Button type="submit" className="w-full h-14 bg-primary font-black uppercase shadow-xl rounded-xl"><ShieldCheck className="w-5 h-5 mr-2" /> Salvar no Banco de Dados</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
