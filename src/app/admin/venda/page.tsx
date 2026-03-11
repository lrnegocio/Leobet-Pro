
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Send, Ticket as TicketIcon, Zap, Plus, Minus, Smartphone, Database, ExternalLink } from 'lucide-react';
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
    const baseURL = "https://leobet-probets.vercel.app";
    const link = `${baseURL}/resultados?c=${vendaRealizada.id}`;
    
    let premioMsg = "";
    if (vendaRealizada.tipo === 'bingo') {
      premioMsg = `%0A🏆 *PRÊMIO BINGO:* R$ ${vendaRealizada.detalhe_premios.bingo.toFixed(2)}`;
    } else {
      premioMsg = `%0A🏆 *PRÊMIO ACUMULADO:* R$ ${vendaRealizada.detalhe_premios.bolao.toFixed(2)}`;
    }

    const msg = `*LEOBET PRO*%0A👤 *CLIENTE:* ${vendaRealizada.cliente}%0A🎟️ *CONCURSO:* ${vendaRealizada.evento_nome}%0A💰 *VALOR:* R$ ${vendaRealizada.valor_total.toFixed(2)}%0A✅ *STATUS:* ${vendaRealizada.status.toUpperCase()}${premioMsg}%0A%0A*CONFERIR EM TEMPO REAL:*%0A${link}`;
    window.open(`https://api.whatsapp.com/send?phone=55${vendaRealizada.whatsapp}&text=${msg}`, '_blank');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-muted/30 font-body overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 md:pt-8 bg-white md:bg-muted/30">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm md:hidden border-2 border-primary/5">
              <h1 className="font-black uppercase text-sm text-primary">Terminal Vendas</h1>
              <Badge className="bg-primary text-white font-black text-[10px] px-3 h-8">
                Saldo: R$ {user?.role === 'admin' ? 'ILIMITADO' : ((user?.balance || 0) + (user?.commissionBalance || 0)).toFixed(2)}
              </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden border-t-8 border-primary">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleVenda} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="uppercase text-[10px] font-black opacity-60">Nome Apostador</Label>
                      <Input value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value.toUpperCase()})} required className="h-14 font-bold rounded-2xl border-2 text-lg" />
                    </div>
                    <div className="space-y-1">
                      <Label className="uppercase text-[10px] font-black opacity-60">WhatsApp</Label>
                      <Input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} required className="h-14 font-bold rounded-2xl border-2 text-lg" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="uppercase text-[10px] font-black opacity-60">Evento</Label>
                    <select className="w-full h-16 border-2 rounded-2xl px-4 font-black bg-white appearance-none text-primary focus:ring-2 focus:ring-primary" value={formData.eventoId} onChange={e => handleSelectEvent(e.target.value)} required>
                      <option value="">-- ESCOLHA O EVENTO --</option>
                      {eventosAtivos.map(e => <option key={e.id} value={e.id}>{e.tipo === 'bolao' ? '🏆' : '🎯'} {e.nome} (R$ {e.preco.toFixed(2)})</option>)}
                    </select>
                  </div>

                  {selectedEvent?.tipo === 'bingo' && (
                    <div className="p-6 bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/20 space-y-4">
                       <Label className="uppercase text-[10px] font-black text-primary text-center block">Cartelas</Label>
                       <div className="flex items-center gap-4">
                          <Button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} variant="outline" className="h-16 w-16 rounded-2xl border-2 bg-white"><Minus /></Button>
                          <Input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} className="h-16 text-center text-3xl font-black border-2 rounded-2xl flex-1 bg-white" />
                          <Button type="button" onClick={() => setQuantity(quantity + 1)} variant="outline" className="h-16 w-16 rounded-2xl border-2 bg-white"><Plus /></Button>
                       </div>
                    </div>
                  )}

                  <div className="bg-primary/5 p-8 rounded-[2rem] border-2 border-primary/10 text-center">
                     <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Total a Pagar</p>
                     <p className="text-5xl font-black text-primary">R$ {formData.valorTotal.toFixed(2)}</p>
                  </div>

                  <Button type="submit" className="w-full h-20 font-black uppercase text-xl shadow-2xl rounded-[2.5rem] bg-primary text-white transition-all active:scale-95" disabled={loading}>
                    {loading ? "PROCESSANDO..." : "EMITIR BILHETE"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {vendaRealizada ? (
                <div className="bg-[#FFFFF4] p-8 shadow-2xl border border-black/10 font-mono rounded-[2.5rem] animate-in zoom-in-95 duration-300">
                   <div className="text-center border-b-2 border-dashed border-black/20 pb-6 mb-6">
                      <p className="text-3xl font-black text-primary">LEOBET PRO</p>
                      <p className="font-bold uppercase tracking-widest text-[10px] opacity-60 mt-1">Recibo Digital Auditado</p>
                   </div>
                   <div className="space-y-3 mb-8 text-xs uppercase font-bold">
                      <p className="flex justify-between"><span>CLIENTE:</span> <span>{vendaRealizada.cliente}</span></p>
                      <p className="flex justify-between"><span>EVENTO:</span> <span className="max-w-[180px] truncate text-right">{vendaRealizada.evento_nome}</span></p>
                      <p className="flex justify-between"><span>VALOR:</span> <span>R$ {vendaRealizada.valor_total.toFixed(2)}</span></p>
                      <p className="flex justify-between text-primary mt-4 border-t pt-4"><span>CONFERÊNCIA:</span> <span className="text-[9px]">leobet-probets.vercel.app</span></p>
                   </div>
                   <div className="text-center py-6 border-y-2 border-dashed border-black/20 mb-8">
                      <Badge variant={vendaRealizada.status === 'pago' ? 'default' : 'destructive'} className="uppercase font-black px-10 py-3 rounded-full text-sm shadow-md">{vendaRealizada.status === 'pago' ? '✓ VALIDADA' : '⚠ PENDENTE'}</Badge>
                   </div>
                   <div className="flex flex-col gap-4">
                      <Button onClick={handleWhatsApp} className="w-full h-16 bg-green-600 font-black uppercase text-sm text-white rounded-[1.5rem] shadow-xl transition-all active:scale-95"><Send className="w-5 h-5 mr-2" /> WhatsApp</Button>
                      <Button onClick={() => setVendaRealizada(null)} variant="outline" className="w-full h-14 font-black uppercase text-xs rounded-[1.5rem] border-2">Nova Venda</Button>
                   </div>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-4 border-dashed rounded-[3rem] opacity-20 bg-white">
                  <TicketIcon className="w-32 h-32 text-primary mb-6" />
                  <h3 className="text-lg font-black uppercase text-primary text-center px-12 leading-tight">Aguardando novo bilhete</h3>
                  <div className="mt-8 flex flex-col items-center gap-3 opacity-60">
                    <Database className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Conexão Supabase Live</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
