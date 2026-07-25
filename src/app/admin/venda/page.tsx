
'use client';

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Printer, Plus, Minus, LayoutGrid, Info, ShieldCheck, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/use-auth-store';
import { supabase } from '@/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ANIMAIS_FAZENDINHA = [
  "AVESTRUZ", "ÁGUIA", "BURRO", "BORBOLETA", "CACHORRO", "CABRA", "CARNEIRO", "CAMELO", "COBRA", "COELHO",
  "CAVALO", "ELEFANTE", "GALO", "GATO", "JACARÉ", "LEÃO", "MACACO", "PORCO", "PAVÃO", "PERU", "TOURO", "TIGRE", "URSO", "VEADO", "VACA"
];

export default function VendaPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventosAtivos, setEventosAtivos] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedEventData, setSelectedEventData] = useState<any>(null);
  const [currentPool, setCurrentPool] = useState(0);
  
  const [formData, setFormData] = useState({ cliente: '', whatsapp: '', pixKey: '', eventoId: '', eventoNome: '', tipo: 'bingo' as any, unitario: 0 });
  const [vendaRealizada, setVendaRealizada] = useState<any>(null);
  const [openMultiOption, setOpenMultiOption] = useState(false);

  const loadEventos = async () => {
    try {
      const { data: bingos } = await supabase.from('bingos').select('*').eq('status', 'aberto');
      const { data: boloes } = await supabase.from('boloes').select('*').eq('status', 'aberto');
      const { data: rifas } = await supabase.from('rifas').select('*').eq('status', 'aberto');
      const now = new Date();
      
      const validBingos = (bingos || []).filter(item => now < new Date(new Date(item.data_sorteio).getTime() - 60000)).map(b => ({ ...b, tipo: 'bingo' }));
      const validBoloes = (boloes || []).filter(item => now < new Date(new Date(item.data_fim).getTime() - 60000)).map(b => ({ ...b, tipo: b.tipo || 'esportivo' }));
      const validRifas = (rifas || []).map(r => ({ ...r, tipo: 'rifa' }));
      
      setEventosAtivos([...validBingos, ...validBoloes, ...validRifas]);
    } catch (err) { console.warn(err); }
  };

  useEffect(() => {
    setMounted(true);
    loadEventos();
    if (user?.role === 'cliente') setFormData(p => ({ ...p, cliente: user.nome, whatsapp: user.phone || '', pixKey: user.pixKey || '' }));
  }, [user]);

  const handleSelectEvento = async (eventId: string) => {
    const ev = eventosAtivos.find(e => e.id === eventId);
    if (ev) {
      setSelectedEventData(ev);
      setFormData({ ...formData, eventoId: ev.id, eventoNome: ev.nome, unitario: ev.preco, tipo: ev.tipo });
      
      const { data: tickets } = await supabase.from('tickets').select('valor_total, vendedor_id').eq('evento_id', ev.id).in('status', ['pago', 'ganhou', 'premio_pago', 'pendente-resgate']);
      const { data: sellers } = await supabase.from('users').select('id, commission_rate, gerente_id');
      
      let totalArrecadado = 0;
      let totalComissoes = 0;

      tickets?.forEach(t => {
        const valor = Number(t.valor_total) || 0;
        totalArrecadado += valor;
        const seller = sellers?.find(u => u.id === t.vendedor_id);
        const rate = (Number(seller?.commission_rate || 0)) / 100;
        const gRate = seller?.gerente_id ? 0.05 : 0; 
        totalComissoes += (valor * (rate + gRate));
      });

      setCurrentPool(Math.max(0, totalArrecadado - totalComissoes));
    } else { setSelectedEventData(null); setCurrentPool(0); }
  };

  const finalizeVenda = async (mode: 'repeat' | 'random' = 'repeat') => {
    setOpenMultiOption(false);
    setLoading(true);
    const ticketsGenerated = [];
    
    for (let i = 0; i < quantity; i++) {
      let n = null;
      if (formData.tipo === 'bingo') n = Array.from({length: 15}, () => Math.floor(Math.random() * 90) + 1);
      else if (formData.tipo === 'rifa') {
         if (selectedEventData?.tipo === 'fazendinha') n = [Math.floor(Math.random() * 25) + 1];
         else n = [Math.floor(Math.random() * (selectedEventData?.total_numeros || 100)) + 1];
      }
      ticketsGenerated.push({ id: Math.random().toString(36).substring(7).toUpperCase(), n, status: 'pago' });
    }

    const receipt = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      evento_id: String(formData.eventoId),
      evento_nome: formData.eventoNome,
      tipo: formData.tipo,
      cliente: formData.cliente.toUpperCase(),
      whatsapp: formData.whatsapp.replace(/\D/g, ''),
      pix_resgate: formData.pixKey.toUpperCase(),
      valor_total: formData.unitario * quantity,
      vendedor_id: user?.id || 'MASTER-ADMIN',
      vendedor_nome: user?.nome || 'Admin',
      status: 'pago',
      tickets_data: ticketsGenerated,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('tickets').insert([receipt]);
      if (error) throw error;
      setVendaRealizada(receipt);
      toast({ title: "BILHETE AUDITADO!" });
    } catch (err: any) { toast({ variant: "destructive", title: "ERRO AO SALVAR" }); }
    finally { setLoading(false); }
  };

  const handleVenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventoId) return toast({ variant: "destructive", title: "ESCOLHA O JOGO" });
    if (quantity > 1) setOpenMultiOption(true);
    else finalizeVenda('repeat');
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20 print:grid-cols-1">
            <Card className="rounded-[2.5rem] shadow-2xl bg-white border-t-8 border-primary print:hidden">
              <CardHeader className="p-8 pb-0"><CardTitle className="text-xl font-black uppercase text-primary flex items-center gap-2"><ShoppingCart className="w-6 h-6" /> Terminal LEOBET</CardTitle></CardHeader>
              <CardContent className="p-8 space-y-4">
                <form onSubmit={handleVenda} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Cliente</Label><Input value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} placeholder="NOME DO CLIENTE" className="h-12 font-bold uppercase" required /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-black uppercase">WhatsApp</Label><Input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="DDD + NÚMERO" className="h-12 font-bold" required /></div>
                  </div>
                  <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Chave PIX Resgate</Label><Input value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} placeholder="CHAVE PIX" className="h-12 font-black uppercase border-accent/30" required /></div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase">Escolha o Concurso</Label>
                    <select className="w-full h-14 border-2 rounded-xl px-4 font-black text-xs" value={formData.eventoId} onChange={e => handleSelectEvento(e.target.value)} required>
                      <option value="">-- SELECIONE --</option>
                      {eventosAtivos.map(e => <option key={e.id} value={e.id}>{e.nome} - R$ {Number(e.preco).toFixed(2)} ({e.tipo})</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" className="h-12 w-12 rounded-xl" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus /></Button>
                    <Input type="number" value={quantity} readOnly className="h-12 text-center font-black text-xl border-2" />
                    <Button type="button" variant="outline" className="h-12 w-12 rounded-xl" onClick={() => setQuantity(quantity + 1)}><Plus /></Button>
                  </div>
                  <Button type="submit" className="w-full h-16 font-black uppercase bg-primary text-white rounded-2xl shadow-xl" disabled={loading}>{loading ? 'PROCESSANDO...' : 'GERAR BILHETES'}</Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {vendaRealizada ? (
                <div className="bg-[#FFFFF4] p-8 shadow-2xl border font-mono rounded-[2rem] text-center overflow-y-auto max-h-[80vh]">
                   <p className="text-2xl font-black text-primary">LEOBET PRO</p>
                   <p className="text-[10px] font-black uppercase">Recibo Oficial Auditado</p>
                   {selectedEventData?.imagem_url && (
                     <img src={selectedEventData.imagem_url} alt="Prêmio" className="w-full h-32 object-cover rounded-xl my-4 border-2" />
                   )}
                   <div className="my-6 border-y-2 border-dashed border-black/10 py-4 space-y-2 text-xs uppercase font-bold text-left">
                      <p className="flex justify-between"><span>CLIENTE:</span> <span>{vendaRealizada.cliente}</span></p>
                      <p className="flex justify-between"><span>JOGO:</span> <span>{vendaRealizada.evento_nome}</span></p>
                      <p className="flex justify-between font-black border-t pt-2"><span>VALOR TOTAL:</span> <span>R$ {Number(vendaRealizada.valor_total).toFixed(2)}</span></p>
                   </div>
                   <div className="grid grid-cols-1 gap-2 mb-6">
                      {vendaRealizada.tickets_data.map((t: any, idx: number) => (
                        <div key={idx} className="bg-primary/5 p-3 rounded-lg border text-sm font-black flex justify-between">
                           <span>COTA #{idx+1}:</span>
                           <span className="text-primary">
                             {vendaRealizada.tipo === 'rifa' && selectedEventData?.tipo === 'fazendinha' 
                               ? ANIMAIS_FAZENDINHA[Number(t.n[0]) - 1] 
                               : t.n.join(' - ')}
                           </span>
                        </div>
                      ))}
                   </div>
                   <Button onClick={() => window.print()} className="w-full h-14 bg-green-600 text-white font-black uppercase rounded-xl gap-2"><Printer /> Imprimir</Button>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-4 border-dashed rounded-[3rem] opacity-20 bg-white">
                  <Ticket className="w-20 h-20 text-primary mb-4" />
                  <h3 className="text-xl font-black uppercase text-primary">Aguardando Venda...</h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Dialog open={openMultiOption} onOpenChange={setOpenMultiOption}>
        <DialogContent className="bg-white rounded-[2rem] max-w-sm">
          <DialogHeader><DialogTitle className="font-black uppercase text-primary text-center">Tipo de Bilhete</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4 text-center">
            <p className="text-xs font-bold text-muted-foreground">Escolha para as {quantity} cotas.</p>
            <Button onClick={() => finalizeVenda('repeat')} className="w-full h-14 font-black uppercase rounded-xl border-2">Repetir Iguais</Button>
            <Button onClick={() => finalizeVenda('random')} className="w-full h-14 font-black uppercase bg-primary text-white rounded-xl shadow-lg">Surpresinha</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
