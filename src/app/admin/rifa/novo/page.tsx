'use client';

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Ticket, Save, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function NovaRifaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: '',
    preco: 5,
    total_numeros: 100,
    tipo: 'numerica',
    data_sorteio: '',
    regras: 'O sorteio será realizado assim que 100% dos bilhetes forem vendidos.',
    imagem_url: '',
    descricao: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('rifas').insert([{
        ...formData,
        nome: formData.nome.toUpperCase(),
        status: 'aberto',
        total_numeros: formData.tipo === 'fazendinha' ? 25 : formData.total_numeros
      }]);
      if (error) throw error;
      toast({ title: "RIFA CRIADA COM SUCESSO!" });
      router.push('/admin/rifa');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao criar", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <Link href="/admin/rifa" className="flex items-center gap-2 text-primary font-black text-xs uppercase"><ArrowLeft className="w-4 h-4" /> Voltar</Link>
          
          <Card className="rounded-[2.5rem] border-t-8 border-t-accent shadow-2xl overflow-hidden bg-white">
            <CardHeader className="bg-muted/50 p-8 border-b">
              <CardTitle className="text-xl font-black uppercase text-primary flex items-center gap-2"><Ticket className="w-6 h-6" /> Nova Campanha</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Nome do Prêmio</Label><Input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="EX: IPHONE 15 PRO MAX" className="h-12 font-bold" required /></div>
                   <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase">Tipo de Rifa</Label>
                      <select className="w-full h-12 border-2 rounded-xl px-3 font-bold" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                        <option value="numerica">NUMÉRICA (1 A X)</option>
                        <option value="fazendinha">FAZENDINHA (25 ANIMAIS)</option>
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Valor Cota (R$)</Label><Input type="number" step="0.01" value={formData.preco} onChange={e => setFormData({...formData, preco: Number(e.target.value)})} className="h-12 font-black text-primary" required /></div>
                   <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Qtd Cotas</Label><Input type="number" value={formData.total_numeros} onChange={e => setFormData({...formData, total_numeros: Number(e.target.value)})} className="h-12 font-bold" required disabled={formData.tipo === 'fazendinha'} /></div>
                   <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Data Prevista</Label><Input type="datetime-local" value={formData.data_sorteio} onChange={e => setFormData({...formData, data_sorteio: e.target.value})} className="h-12 font-bold" required /></div>
                </div>

                <div className="space-y-1">
                   <Label className="text-[10px] font-black uppercase flex items-center gap-1"><ImageIcon className="w-3 h-3" /> URL da Imagem do Prêmio</Label>
                   <Input value={formData.imagem_url} onChange={e => setFormData({...formData, imagem_url: e.target.value})} placeholder="https://..." className="h-12 font-bold" />
                </div>

                <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Descrição Visível (Site e Bilhete)</Label><Textarea value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} placeholder="Detalhes do prêmio..." className="min-h-[100px] font-bold" /></div>

                <Button type="submit" className="w-full h-16 bg-primary font-black uppercase rounded-2xl shadow-xl gap-2" disabled={loading}>
                  <Save className="w-5 h-5" /> {loading ? "SALVANDO..." : "PUBLICAR RIFA"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
