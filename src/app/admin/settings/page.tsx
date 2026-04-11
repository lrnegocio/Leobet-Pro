
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Globe, Save, RefreshCcw, Database, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { useAuthStore } from '@/store/use-auth-store';

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [systemUrl, setSystemUrl] = useState('https://leobet-probets.vercel.app/');
  const [pixKey, setPixKey] = useState('');

  useEffect(() => {
    setMounted(true);
    const loadSettings = async () => {
      // Carrega links do localStorage (preferência de interface)
      const saved = localStorage.getItem('leobet_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setYoutubeUrl(parsed.youtubeUrl || '');
          setSystemUrl(parsed.systemUrl || 'https://leobet-probets.vercel.app/');
        } catch (e) {}
      }

      // Carrega PIX Master do primeiro Admin encontrado no Supabase
      const { data } = await supabase
        .from('users')
        .select('pix_key')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();
      
      if (data?.pix_key) setPixKey(data.pix_key);
    };
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Salva links locais
      const newSettings = { youtubeUrl, systemUrl };
      localStorage.setItem('leobet_settings', JSON.stringify(newSettings));
      
      // 2. Salva PIX no Banco de Dados (Atualiza o Admin logado ou o primeiro admin)
      const targetId = user?.id === 'MASTER-ADMIN' ? null : user?.id;
      
      if (targetId) {
        await supabase.from('users').update({ pix_key: pixKey }).eq('id', targetId);
      } else {
        // Se for bypass, atualiza o primeiro admin que encontrar
        const { data: admin } = await supabase.from('users').select('id').eq('role', 'admin').limit(1).maybeSingle();
        if (admin) {
          await supabase.from('users').update({ pix_key: pixKey }).eq('id', admin.id);
        }
      }
      
      toast({ 
        title: "CONFIGURAÇÕES ATUALIZADAS!", 
        description: "Dados salvos no Cloud Supabase." 
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO AO SALVAR", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return (
    <div className="h-screen flex items-center justify-center bg-muted/30">
      <RefreshCcw className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-black uppercase text-primary leading-none">Configurações Gerais</h1>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Gestão de Links e PIX Master <Database className="inline w-3 h-3 text-green-600" /></p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <Card className="border-t-4 border-t-accent shadow-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-muted/50 border-b">
                <CardTitle className="text-xs font-black uppercase flex items-center gap-2 text-primary">
                  <Key className="w-4 h-4" /> Finanças da Plataforma
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60">Chave PIX Master (Para Depósitos)</Label>
                  <input 
                    value={pixKey} 
                    onChange={e => setPixKey(e.target.value.toUpperCase())}
                    placeholder="CHAVE PIX OFICIAL" 
                    className="w-full h-14 font-black text-xl border-2 rounded-xl px-4 outline-none focus:border-primary bg-white text-primary"
                    required
                  />
                  <p className="text-[9px] font-bold text-orange-600 uppercase">Esta chave será exibida para todos os clientes em "Recarregar".</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-primary shadow-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-muted/50 border-b">
                <CardTitle className="text-xs font-black uppercase flex items-center gap-2 text-primary">
                  <Globe className="w-4 h-4" /> Links Externos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60">Canal YouTube (Sorteios Live)</Label>
                  <input 
                    value={youtubeUrl} 
                    onChange={e => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/live/..." 
                    className="w-full h-12 font-bold border-2 rounded-xl px-4 outline-none focus:border-primary bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60">Domínio Oficial</Label>
                  <input 
                    value={systemUrl} 
                    onChange={e => setSystemUrl(e.target.value)}
                    placeholder="https://leobet-probets.vercel.app/" 
                    className="w-full h-12 font-bold border-2 rounded-xl px-4 outline-none focus:border-primary bg-white"
                  />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black uppercase text-lg rounded-2xl shadow-xl" disabled={loading}>
              {loading ? <RefreshCcw className="animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              SALVAR CONFIGURAÇÕES NO CLOUD
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
