
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Youtube, Wallet, Globe, Save, RefreshCcw, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/use-auth-store';
import { supabase } from '@/supabase/client';

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [companyPix, setCompanyPix] = useState('');
  const [systemUrl, setSystemUrl] = useState('https://leobet-probets.vercel.app/');

  useEffect(() => {
    setMounted(true);
    const loadSettings = async () => {
      // BUSCA A CHAVE PIX DO ADMIN MASTER NO BANCO PARA PERSISTÊNCIA REAL
      const { data } = await supabase.from('users').select('pix_key').eq('role', 'admin').limit(1).single();
      if (data?.pix_key) setCompanyPix(data.pix_key);

      const saved = localStorage.getItem('leobet_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setYoutubeUrl(parsed.youtubeUrl || '');
          setSystemUrl(parsed.systemUrl || 'https://leobet-probets.vercel.app/');
        } catch (e) {}
      }
    };
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // SALVA A CHAVE PIX NO PERFIL DO ADMIN PARA SER GLOBAL E PERSISTENTE
      if (user?.role === 'admin') {
        const { error } = await supabase.from('users').update({ pix_key: companyPix }).eq('id', user.id);
        if (error) throw error;
      }

      const newSettings = { youtubeUrl, systemUrl };
      localStorage.setItem('leobet_settings', JSON.stringify(newSettings));
      
      toast({ 
        title: "CONFIGURAÇÕES SALVAS!", 
        description: "Os dados foram sincronizados em toda a rede e no banco." 
      });
    } catch (err) {
      toast({ variant: "destructive", title: "ERRO AO SALVAR NO BANCO" });
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
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Sincronização Cloud Supabase <Database className="inline w-3 h-3 text-green-600" /></p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <Card className="border-t-4 border-t-primary shadow-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-muted/50 border-b">
                <CardTitle className="text-xs font-black uppercase flex items-center gap-2 text-primary">
                  <Globe className="w-4 h-4" /> Links Externos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60">Canal YouTube (Sorteios Live)</Label>
                  <div className="flex gap-2">
                    <div className="bg-red-100 p-3 rounded-xl flex items-center justify-center shrink-0">
                      <Youtube className="w-5 h-5 text-red-600" />
                    </div>
                    <input 
                      value={youtubeUrl} 
                      onChange={e => setYoutubeUrl(e.target.value)}
                      placeholder="https://youtube.com/live/..." 
                      className="w-full h-12 font-bold border-2 rounded-xl px-4 outline-none focus:border-primary bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60">Domínio Oficial do Sistema</Label>
                  <input 
                    value={systemUrl} 
                    onChange={e => setSystemUrl(e.target.value)}
                    placeholder="https://leobet-probets.vercel.app/" 
                    className="w-full h-12 font-bold border-2 rounded-xl px-4 outline-none focus:border-primary bg-white"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-accent shadow-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-muted/50 border-b">
                <CardTitle className="text-xs font-black uppercase flex items-center gap-2 text-accent">
                  <Wallet className="w-4 h-4" /> Gestão de Recebimentos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60">Chave PIX Master (Global)</Label>
                  <input 
                    value={companyPix} 
                    onChange={e => setCompanyPix(e.target.value)}
                    placeholder="ESTA CHAVE É EXIBIDA PARA TODOS OS DEPÓSITOS" 
                    className="w-full h-12 font-black text-xl border-2 rounded-xl px-4 outline-none focus:border-primary bg-white text-primary"
                  />
                  <p className="text-[9px] font-bold text-orange-600 uppercase flex items-center gap-1 mt-2">
                    Atenção: Esta chave é salva permanentemente no banco de dados e aparecerá para todos os usuários.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black uppercase text-lg rounded-2xl shadow-xl" disabled={loading}>
              {loading ? <RefreshCcw className="animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              {loading ? 'SINCRONIZANDO...' : 'SALVAR E ATUALIZAR REDE'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
