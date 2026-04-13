'use client';

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Printer, Plus, Minus, MessageCircle, Clock, LayoutGrid, Zap, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/use-auth-store';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function VendaPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventosAtivos, setEventosAtivos] = useState<any[]>([]);
  const [minhasReservas, setMinhasReservas] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedEventData, setSelectedEventData] = useState<any>(null);
  const [currentPool, setCurrentPool] = useState(0);
  
  const [formData, setFormData] = useState({ cliente: '', whatsapp: '', pixKey: '', eventoId: '', eventoNome: '', tipo: 'bingo' as any, unitario: 0 });
  const [partidasBolao, setPartidasBolao] = useState<any[]>([]);
  const [palpites, setPalpites] = useState<string[]>([]);
  const [numerosLoteria, setNumerosLoteria] = useState<number[]>([]);
  const [vendaRealizada, setVendaRealizada] = useState<any>(null);
  const [openMultiOption, setOpenMultiOption] = useState(false);

  const loadEventos = async () => {
    try {
      const { data: bingos } = await supabase.from('bingos').select('*').eq('status', 'aberto');
      const { data: boloes } = await supabase.from('boloes').select('*').eq('status', 'aberto');
      const now = new Date();
      
      const validBingos = (bingos || []).filter(item => now < new Date(new Date(item.data_sorteio).getTime() - 60000)).map(b => ({ ...b, tipo: 'bingo' }));
      const validBoloes = (boloes || []).filter(item => now < new Date(new Date(item.data_fim).getTime() - 60000)).map(b => ({ ...b, tipo: b.tipo || 'esportivo' }));
      
      setEventosAtivos([...validBingos, ...validBoloes]);
    } catch (err) { console.warn(err); }
  };

  const loadMinhasReservas = async () => {
    if (!user) return;
    const { data } = await supabase.from('tickets').select('*').eq('status', 'pendente').or(`vendedor_id.eq.${user.id},cliente.eq.${user.nome}`).order('created_at', { ascending: false });
    setMinhasReservas(data || []);
  };

  useEffect(() => {
    setMounted(true);
    loadEventos();
    if (user?.role === 'cliente') setFormData(p => ({ ...p, cliente: user.nome, whatsapp: user.phone || '', pixKey: user.pixKey || '' }));
    loadMinhasReservas();
  }, [user]);

  const handleSelectEvento = async (eventId: string) => {
    const ev = eventosAtivos.find(e => e.id === eventId);
    if (ev) {
      setSelectedEventData(ev);
      setFormData({ ...formData, eventoId: ev.id, eventoNome: ev.nome, unitario: ev.preco, tipo: ev.tipo });
      setNumerosLoteria([]);
      if (ev.tipo === 'bolao' || ev.tipo === 'esportivo') {
        const matches = ev.partidas || [];
        setPartidasBolao(matches);
        setPalpites(Array(matches.length).fill(''));
      }
      const { data } = await supabase.from('tickets').select('valor_total').eq('evento_id', ev.id).in('status', ['pago', 'ganhou', 'premio_pago']);
      const total = data?.reduce((acc, t) => acc + Number(t.valor_total), 0) || 0;
      setCurrentPool(total * 0.65);
    } else { setSelectedEventData(null); setCurrentPool(0); }
  };

  const generateRandomNumbers = (count: number, max: number) => {
    const nums = new Set<number>();
    while(nums.size < count) nums.add(Math.floor(Math.random() * max) + 1);
    return Array.from(nums).sort((a,b) => a-b);
  };

  const finalizeVenda = async (mode: 'repeat' | 'random' = 'repeat') => {
    setOpenMultiOption(false);
    setLoading(true);
    const ticketsGenerated = [];
    const firstTicketNums = formData.tipo === 'bingo' ? generateRandomNumbers(15, 90) : [...numerosLoteria];

    for (let i = 0; i < quantity; i++) {
      let n = null; let p = null;
      if (i === 0 || mode === 'repeat') {
        n = firstTicketNums;
        p = (formData.tipo === 'bolao' || formData.tipo === 'esportivo') ? palpites.join('-') : null;
      } else {
        if (formData.tipo === 'bingo') n = generateRandomNumbers(15, 90);
        else if (formData.tipo === 'mega') n = generateRandomNumbers(15, 60);
        else if (formData.tipo === 'quina') n = generateRandomNumbers(20, 80);
        if (formData.tipo === 'bolao' || formData.tipo === 'esportivo') {
          p = partidasBolao.map(m => {
            const opts = [m.time1, 'X', m.time2];
            return opts[Math.floor(Math.random() * 3)];
          }).join('-');
        }
      }
      ticketsGenerated.push({ id: Math.random().toString(36).substring(7).toUpperCase(), n, p, status: 'pago' });
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
      vendedor_id: user?.id || 'admin-master',
      vendedor_nome: user?.nome || 'Admin',
      gerente_id: user?.gerenteId || null,
      status: 'pago',
      tickets_data: ticketsGenerated,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('tickets').insert([receipt]);
      if (error) throw error;
      setVendaRealizada({ ...receipt, currentPool });
      toast({ title: "VENDA PROCESSADA!" });
      loadMinhasReservas();
    } catch (err: any) { toast({ variant: "destructive", title: "ERRO NA TRANSAÇÃO" }); }
    finally { setLoading(false); }
  };

  const handleVenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventoId || !formData.cliente || !formData.whatsapp || !formData.pixKey) return toast({ variant: "destructive", title: "DADOS INCOMPLETOS" });
    if (quantity > 1) setOpenMultiOption(true);
    else finalizeVenda('repeat');
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Tabs defaultValue="venda">
            <TabsList className="bg-white p-1 rounded-2xl w-full flex justify-start gap-2 shadow-sm border h-14 overflow-x-auto print:hidden">
              <TabsTrigger value="venda" className="font-black uppercase text-[10px] rounded-xl px-8">Vendas</TabsTrigger>
              <TabsTrigger value="reservas" className="font-black uppercase text-[10px] rounded-xl px-8">Minhas Reservas</TabsTrigger>
            </TabsList>

            <TabsContent value="venda" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20 print:grid-cols-1">
                <Card className="rounded-[2.5rem] shadow-2xl bg-white border-t-8 border-primary print:hidden">
                  <CardHeader className="p-8 pb-0"><CardTitle className="text-xl font-black uppercase text-primary flex items-center gap-2"><ShoppingCart className="w-6 h-6" /> Terminal de Vendas</CardTitle></CardHeader>
                  <CardContent className="p-8 space-y-4">
                    <form onSubmit={handleVenda} className="space-y-4">
                      {selectedEventData && (
                        <div className="bg-primary/5 p-4 rounded-2xl border-2 border-primary/10 flex justify-between items-center">
                           <div><p className="text-[10px] font-black uppercase opacity-60">Prêmio Acumulado (65%)</p><p className="text-2xl font-black text-primary">R$ {currentPool.toFixed(2)}</p></div>
                           <Badge className="bg-primary text-white h-8 px-4 font-black uppercase text-[9px]">Live Pool</Badge>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Cliente</Label><Input value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} placeholder="NOME" className="h-12 font-bold uppercase" required /></div>
                        <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">WhatsApp</Label><Input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="DDD+NUM" className="h-12 font-bold" required /></div>
                      </div>
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">PIX para Resgate</Label><Input value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} placeholder="CHAVE PIX" className="h-12 font-black border-accent/30 uppercase" required /></div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase opacity-60">Escolha o Concurso</Label>
                        <select className="w-full h-14 border-2 rounded-xl px-4 font-black text-xs" value={formData.eventoId} onChange={e => handleSelectEvento(e.target.value)} required>
                          <option value="">-- SELECIONE --</option>
                          {eventosAtivos.map(e => <option key={e.id} value={e.id}>{e.nome} - R$ {Number(e.preco).toFixed(2)}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button type="button" variant="outline" className="h-12 w-12 rounded-xl" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus /></Button>
                        <Input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} className="h-12 text-center font-black text-xl border-2" />
                        <Button type="button" variant="outline" className="h-12 w-12 rounded-xl" onClick={() => setQuantity(quantity + 1)}><Plus /></Button>
                      </div>
                      <Button type="submit" className="w-full h-16 font-black uppercase bg-primary text-white rounded-2xl shadow-xl" disabled={loading}>{loading ? 'PROCESSANDO...' : 'FINALIZAR VENDA'}</Button>
                    </form>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {vendaRealizada ? (
                    <div className="bg-[#FFFFF4] p-8 shadow-2xl border font-mono rounded-[2rem] text-center print:border-none print:shadow-none print:p-0 overflow-y-auto max-h-[80vh]">
                       <p className="text-2xl font-black text-primary">LEOBET PRO</p>
                       <p className="text-[10px] font-black uppercase">Recibo Oficial de Aposta</p>
                       <div className="my-6 border-y-2 border-dashed border-black/10 py-4 space-y-2 text-xs uppercase font-bold text-left">
                          <p className="flex justify-between"><span>CLIENTE:</span> <span>{vendaRealizada.cliente}</span></p>
                          <p className="flex justify-between"><span>JOGO:</span> <span>{vendaRealizada.evento_nome}</span></p>
                          <p className="flex justify-between font-black border-t pt-2"><span>VALOR TOTAL:</span> <span>R$ {Number(vendaRealizada.valor_total).toFixed(2)}</span></p>
                          <p className="text-center pt-2 border-t font-black">CÓDIGO: {vendaRealizada.id}</p>
                       </div>
                       <Button onClick={() => window.print()} className="w-full h-14 bg-green-600 text-white font-black uppercase rounded-xl gap-2 print:hidden"><Printer /> Imprimir Bilhete</Button>
                    </div>
                  ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-4 border-dashed rounded-[3rem] opacity-20 bg-white">
                      <LayoutGrid className="w-20 h-20 text-primary mb-4" />
                      <h3 className="text-xl font-black uppercase text-primary">Aguardando Venda...</h3>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={openMultiOption} onOpenChange={setOpenMultiOption}>
        <DialogContent className="bg-white rounded-[2rem] max-w-sm">
          <DialogHeader><DialogTitle className="font-black uppercase text-primary text-center">Configurar Apostas</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4 text-center">
            <p className="text-xs font-bold text-muted-foreground">Deseja repetir o mesmo bilhete ou gerar novos aleatórios?</p>
            <Button onClick={() => finalizeVenda('repeat')} className="w-full h-14 font-black uppercase rounded-xl border-2">Repetir Bilhete</Button>
            <Button onClick={() => finalizeVenda('random')} className="w-full h-14 font-black uppercase bg-primary text-white rounded-xl">Surpresinha (Novos)</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
