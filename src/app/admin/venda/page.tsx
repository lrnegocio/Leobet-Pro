
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Send, Ticket as TicketIcon, Zap, Plus, Minus, Smartphone, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/use-auth-store';
import { supabase } from '@/supabase/client';

export default function VendaPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [eventosAtivos, setEventosAtivos] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  
  const [prizes, setPrizes] = useState({ totalNet: 0, quadra: 0, quina: 0, bingo: 0, bolao: 0 });
  const [formData, setFormData] = useState({ cliente: '', whatsapp: '', eventoId: '', eventoNome: '', tipo: 'bingo' as 'bingo' | 'bolao', valorTotal: 0, unitario: 0 });
  const [vendaRealizada, setVendaRealizada] = useState<any>(null);

  const updatePrizes = async (eventId: string, type: 'bingo' | 'bolao') => {
    const { data } = await supabase.from('tickets').select('valor_total').eq('evento_id', eventId).eq('status', 'pago');
    const totalPaid = (data || []).reduce((acc, t) => acc + Number(t.valor_total), 0);
    const totalNet = Math.floor(totalPaid * 0.65 * 100) / 100;

    if (type === 'bingo') {
      const bingoVal = Math.floor(totalNet * 0.50 * 100) / 100;
      const quinaVal = Math.floor(totalNet * 0.30 * 100) / 100;
      const quadraVal = Number((totalNet - bingoVal - quinaVal).toFixed(2));
      setPrizes({ totalNet, bingo: bingoVal, quina: quinaVal, quadra: quadraVal, bolao: 0 });
    } else {
      setPrizes({ totalNet, quadra: 0, quina: 0, bingo: 0, bolao: totalNet });
    }
  };

  const loadEventos = async () => {
    const now = new Date().toISOString();
    const { data: bingos } = await supabase.from('bingos').select('*').eq('status', 'aberto').gt('data_sorteio', now);
    const { data: boloes } = await supabase.from('boloes').select('*').eq('status', 'aberto').gt('data_fim', now);

    const bFormated = (bingos || []).map(b => ({ ...b, tipo: 'bingo' }));
    const bolFormated = (boloes || []).map(b => ({ ...b, tipo: 'bolao' }));

    setEventosAtivos([...bFormated, ...bolFormated]);
  };

  useEffect(() => {
    loadEventos();
  }, []);

  const handleSelectEvent = (eventId: string) => {
    const ev = eventosAtivos.find(e => String(e.id) === String(eventId));
    setSelectedEvent(ev);
    setQuantity(1);
    
    if (ev) {
      setFormData({ ...formData, eventoId: eventId, eventoNome: ev.nome, unitario: ev.preco, valorTotal: ev.preco, tipo: ev.tipo });
      updatePrizes(eventId, ev.tipo);
    }
  };

  useEffect(() => {
    if (selectedEvent) setFormData(prev => ({ ...prev, valorTotal: quantity * prev.unitario }));
  }, [quantity, selectedEvent]);

  const generateUniqueNumbers = (count: number, max: number) => {
    const nums: Set<number> = new Set();
    while (nums.size < count) nums.add(Math.floor(Math.random() * max) + 1);
    return Array.from(nums).sort((a, b) => a - b);
  };

  const handleVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente.trim() || formData.whatsapp.length < 10) {
      toast({ variant: "destructive", title: "PREENCHA OS DADOS" });
      return;
    }

    setLoading(true);
    const ticketsGenerated = [];
    for (let i = 0; i < quantity; i++) {
      ticketsGenerated.push({
        id: Math.random().toString().substring(2, 13),
        numeros: formData.tipo === 'bingo' ? generateUniqueNumbers(15, 90) : null,
        status: 'aberto'
      });
    }

    const userBal = (user?.balance || 0) + (user?.commissionBalance || 0);
    const statusVenda = (user?.role === 'admin' || userBal >= formData.valorTotal) ? 'pago' : 'pendente';

    const receipt = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      evento_id: formData.eventoId,
      evento_nome: formData.eventoNome,
      tipo: formData.tipo,
      cliente: formData.cliente,
      whatsapp: formData.whatsapp.replace(/\D/g, ''),
      valor_total: formData.valorTotal,
      vendedor_id: user?.id,
      status: statusVenda,
      tickets_data: ticketsGenerated,
      detalhe_premios: prizes
    };

    try {
      const { error } = await supabase.from('tickets').insert([receipt]);
      if (error) throw error;
      setVendaRealizada({ ...receipt, data: new Date().toISOString() });
      toast({ title: "BILHETE EMITIDO!" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    if (!vendaRealizada) return;
    const link = `${window.location.origin}/resultados?c=${vendaRealizada.id}`;
    const msg = `*LEOBET PRO*%0A👤 *CLIENTE:* ${vendaRealizada.cliente}%0A🎟️ *CONCURSO:* ${vendaRealizada.evento_nome}%0A💰 *VALOR:* R$ ${vendaRealizada.valor_total.toFixed(2)}%0A✅ *STATUS:* ${vendaRealizada.status.toUpperCase()}%0A%0A*VER ONLINE:* ${link}`;
    window.open(`https://api.whatsapp.com/send?phone=55${vendaRealizada.whatsapp}&text=${msg}`, '_blank');
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-muted/30 font-body overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm lg:hidden">
              <h1 className="font-black uppercase text-xs text-primary">Terminal de Vendas</h1>
              <Badge className="bg-primary text-white font-black text-[10px]">
                R$ {user?.role === 'admin' ? 'ILIMITADO' : ((user?.balance || 0) + (user?.commissionBalance || 0)).toFixed(2)}
              </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleVenda} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="uppercase text-[10px] font-black opacity-60">Nome Apostador</Label>
                      <Input value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value.toUpperCase()})} required className="h-12 font-bold rounded-xl border-2" />
                    </div>
                    <div className="space-y-1">
                      <Label className="uppercase text-[10px] font-black opacity-60">WhatsApp</Label>
                      <Input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} required className="h-12 font-bold rounded-xl border-2" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="uppercase text-[10px] font-black opacity-60">Selecione o Evento</Label>
                    <select className="w-full h-14 border-2 rounded-2xl px-4 font-black bg-white appearance-none" value={formData.eventoId} onChange={e => handleSelectEvent(e.target.value)} required>
                      <option value="">-- ESCOLHA O EVENTO --</option>
                      {eventosAtivos.map(e => <option key={e.id} value={e.id}>{e.tipo === 'bolao' ? '🏆' : '🎯'} {e.nome} (R$ {e.preco.toFixed(2)})</option>)}
                    </select>
                  </div>

                  {selectedEvent?.tipo === 'bingo' && (
                    <div className="p-4 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20 space-y-3">
                       <Label className="uppercase text-[10px] font-black text-primary text-center block">Quantidade de Cartelas</Label>
                       <div className="flex items-center gap-4">
                          <Button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} variant="outline" className="h-14 w-14 rounded-2xl border-2"><Minus /></Button>
                          <Input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} className="h-14 text-center text-2xl font-black border-2 rounded-2xl" />
                          <Button type="button" onClick={() => setQuantity(quantity + 1)} variant="outline" className="h-14 w-14 rounded-2xl border-2"><Plus /></Button>
                       </div>
                    </div>
                  )}

                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-2xl text-primary/30">R$</span>
                     <Input type="number" value={formData.valorTotal.toFixed(2)} readOnly className="h-20 text-4xl font-black text-center border-primary/20 bg-primary/5 rounded-2xl pl-16" />
                  </div>

                  <Button type="submit" className="w-full h-16 font-black uppercase text-lg shadow-xl rounded-2xl bg-primary text-white" disabled={loading}>
                    {loading ? "PROCESSANDO..." : "EMITIR BILHETE"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {vendaRealizada ? (
                <div className="bg-[#FFFFF0] p-6 shadow-2xl border border-black/10 font-mono text-[10px] rounded-3xl animate-in zoom-in-95 duration-300">
                   <div className="text-center border-b-2 border-dashed border-black/20 pb-4 mb-4">
                      <p className="text-xl font-black text-primary">LEOBET PRO</p>
                      <p className="font-bold uppercase tracking-widest text-[8px]">Recibo Auditado Cloud</p>
                   </div>
                   <div className="space-y-1 mb-4 text-[9px] uppercase font-bold">
                      <p className="flex justify-between"><span>CLIENTE:</span> <span>{vendaRealizada.cliente}</span></p>
                      <p className="flex justify-between"><span>EVENTO:</span> <span className="max-w-[150px] truncate">{vendaRealizada.evento_nome}</span></p>
                      <p className="flex justify-between"><span>TOTAL:</span> <span>R$ {vendaRealizada.valor_total.toFixed(2)}</span></p>
                   </div>
                   <div className="text-center py-4 border-t-2 border-dashed border-black/20">
                      <Badge variant={vendaRealizada.status === 'pago' ? 'default' : 'destructive'} className="uppercase font-black px-6 py-1 rounded-full">{vendaRealizada.status === 'pago' ? '✓ VALIDADA' : '⚠ PENDENTE'}</Badge>
                   </div>
                   <div className="flex flex-col gap-2">
                      <Button onClick={handleWhatsApp} className="w-full h-12 bg-green-600 font-black uppercase text-xs text-white rounded-xl shadow-lg"><Send className="w-4 h-4 mr-2" /> WhatsApp</Button>
                      <Button onClick={() => setVendaRealizada(null)} variant="outline" className="w-full h-12 font-black uppercase text-xs rounded-xl">Nova Venda</Button>
                   </div>
                </div>
              ) : (
                <div className="hidden md:flex h-full min-h-[400px] flex-col items-center justify-center border-4 border-dashed rounded-[3rem] opacity-20 bg-white"><TicketIcon className="w-20 h-20 text-primary mb-4" /><h3 className="text-sm font-black uppercase text-primary text-center px-12">Aguardando Venda</h3></div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
