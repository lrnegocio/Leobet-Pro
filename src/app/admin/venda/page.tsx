
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  ShoppingCart, 
  Send, 
  Ticket as TicketIcon, 
  Zap, 
  Plus, 
  Minus, 
  Printer, 
  Database, 
  Trophy,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/use-auth-store';
import { supabase } from '@/supabase/client';

export default function VendaPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [eventosAtivos, setEventosAtivos] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  
  const [prizes, setPrizes] = useState({ totalNet: 0, quadra: 0, quina: 0, bingo: 0, bolao: 0 });
  const [formData, setFormData] = useState({ 
    cliente: '', 
    whatsapp: '', 
    eventoId: '', 
    eventoNome: '', 
    tipo: 'bingo' as 'bingo' | 'bolao', 
    valorTotal: 0, 
    unitario: 0 
  });
  const [vendaRealizada, setVendaRealizada] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    loadEventos();
  }, []);

  const updatePrizes = async (eventId: string, type: string) => {
    try {
      const { data } = await supabase
        .from('tickets')
        .select('valor_total')
        .eq('evento_id', eventId)
        .eq('status', 'pago');
      
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
    } catch (err) {
      console.error("Erro ao atualizar prêmios:", err);
    }
  };

  const loadEventos = async () => {
    const now = new Date().toISOString();
    try {
      const { data: bingos } = await supabase.from('bingos').select('*').eq('status', 'aberto').gt('data_sorteio', now);
      const { data: boloes } = await supabase.from('boloes').select('*').eq('status', 'aberto').gt('data_fim', now);

      const bFormated = (bingos || []).map(b => ({ ...b, tipo: 'bingo' }));
      const bolFormated = (boloes || []).map(b => ({ ...b, tipo: 'bolao' }));

      setEventosAtivos([...bFormated, ...bolFormated]);
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
    }
  };

  const handleSelectEvent = (eventId: string) => {
    const ev = eventosAtivos.find(e => String(e.id) === String(eventId));
    setSelectedEvent(ev);
    setQuantity(1);
    
    if (ev) {
      setFormData({ 
        ...formData, 
        eventoId: eventId, 
        eventoNome: ev.nome, 
        unitario: ev.preco, 
        valorTotal: ev.preco, 
        tipo: ev.tipo 
      });
      updatePrizes(eventId, ev.tipo);
    }
  };

  useEffect(() => {
    if (selectedEvent) {
      setFormData(prev => ({ ...prev, valorTotal: quantity * prev.unitario }));
    }
  }, [quantity, selectedEvent]);

  const generateUniqueNumbers = (count: number, max: number) => {
    const nums: Set<number> = new Set();
    while (nums.size < count) nums.add(Math.floor(Math.random() * max) + 1);
    return Array.from(nums).sort((a, b) => a - b);
  };

  const handleVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente.trim() || formData.whatsapp.length < 10) {
      toast({ variant: "destructive", title: "DADOS INCOMPLETOS", description: "Informe o nome e WhatsApp com DDD." });
      return;
    }

    if (!formData.eventoId) {
      toast({ variant: "destructive", title: "EVENTO NÃO SELECIONADO" });
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
      detalhe_premios: { ...prizes },
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('tickets').insert([receipt]);
      if (error) throw error;
      
      setVendaRealizada(receipt);
      toast({ title: "BILHETE EMITIDO COM SUCESSO!" });
      updatePrizes(formData.eventoId, formData.tipo);
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO NA EMISSÃO", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    if (!vendaRealizada) return;
    const link = `https://leobet-probets.vercel.app/resultados?c=${vendaRealizada.id}`;
    
    let premioMsg = "";
    if (vendaRealizada.tipo === 'bingo') {
      premioMsg = `%0A%0A🏆 *PRÊMIOS:*%0A🎯 *BINGO:* R$ ${vendaRealizada.detalhe_premios.bingo.toFixed(2)}%0A🎯 *QUINA:* R$ ${vendaRealizada.detalhe_premios.quina.toFixed(2)}%0A🎯 *QUADRA:* R$ ${vendaRealizada.detalhe_premios.quadra.toFixed(2)}`;
    } else {
      premioMsg = `%0A%0A🏆 *PRÊMIO ACUMULADO:* R$ ${vendaRealizada.detalhe_premios.bolao.toFixed(2)}`;
    }

    const msg = `*LEOBET PRO*%0A👤 *CLIENTE:* ${vendaRealizada.cliente}%0A🎟️ *CONCURSO:* ${vendaRealizada.evento_nome}%0A💰 *VALOR:* R$ ${vendaRealizada.valor_total.toFixed(2)}%0A✅ *STATUS:* ${vendaRealizada.status.toUpperCase()}${premioMsg}%0A%0A*CONFERIR:*%0A${link}`;
    window.open(`https://api.whatsapp.com/send?phone=55${vendaRealizada.whatsapp}&text=${msg}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-muted/30 font-body overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 md:pt-8 bg-white md:bg-muted/30 print:p-0">
        <div className="max-w-5xl mx-auto space-y-6 print:max-w-full">
          
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm md:hidden border-2 border-primary/5 print:hidden">
              <h1 className="font-black uppercase text-sm text-primary">Vendas</h1>
              <Badge className="bg-primary text-white font-black text-[10px] px-3 h-8">
                R$ {user?.role === 'admin' ? 'ILIMITADO' : ((user?.balance || 0) + (user?.commissionBalance || 0)).toFixed(2)}
              </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block">
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden border-t-8 border-primary print:hidden">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleVenda} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="uppercase text-[10px] font-black opacity-60">Nome Apostador</Label>
                      <input 
                        value={formData.cliente} 
                        onChange={e => setFormData({...formData, cliente: e.target.value.toUpperCase()})} 
                        required 
                        className="w-full h-14 font-bold rounded-2xl border-2 px-4 text-lg focus:border-primary outline-none" 
                        placeholder="NOME"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="uppercase text-[10px] font-black opacity-60">WhatsApp</Label>
                      <input 
                        value={formData.whatsapp} 
                        onChange={e => setFormData({...formData, whatsapp: e.target.value})} 
                        required 
                        className="w-full h-14 font-bold rounded-2xl border-2 px-4 text-lg focus:border-primary outline-none" 
                        placeholder="DDD + NÚMERO"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="uppercase text-[10px] font-black opacity-60">Escolha o Sorteio</Label>
                    <select 
                      className="w-full h-16 border-2 rounded-2xl px-4 font-black bg-white appearance-none text-primary focus:ring-2 focus:ring-primary text-sm" 
                      value={formData.eventoId} 
                      onChange={e => handleSelectEvent(e.target.value)} 
                      required
                    >
                      <option value="">-- ESCOLHA O EVENTO --</option>
                      {eventosAtivos.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.tipo === 'bolao' ? '🏆 BOLÃO' : '🎯 BINGO'} - {e.nome} (R$ {e.preco.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedEvent && (
                    <div className="p-6 bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/20 space-y-4 animate-in fade-in duration-300">
                       <p className="text-[10px] font-black uppercase text-primary text-center">Prêmios Acumulados</p>
                       {selectedEvent.tipo === 'bingo' ? (
                         <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white p-3 rounded-xl border text-center">
                               <p className="text-[8px] font-black opacity-40 uppercase">BINGO</p>
                               <p className="font-black text-primary text-xs md:text-sm">R$ {prizes.bingo.toFixed(2)}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border text-center">
                               <p className="text-[8px] font-black opacity-40 uppercase">QUINA</p>
                               <p className="font-black text-primary text-xs md:text-sm">R$ {prizes.quina.toFixed(2)}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border text-center">
                               <p className="text-[8px] font-black opacity-40 uppercase">QUADRA</p>
                               <p className="font-black text-primary text-xs md:text-sm">R$ {prizes.quadra.toFixed(2)}</p>
                            </div>
                         </div>
                       ) : (
                         <div className="bg-white p-4 rounded-xl border flex justify-between items-center">
                            <p className="text-[10px] font-black opacity-40 uppercase">ACUMULADO</p>
                            <p className="font-black text-green-600 text-lg md:text-xl">R$ {prizes.bolao.toFixed(2)}</p>
                         </div>
                       )}

                       {selectedEvent.tipo === 'bingo' && (
                         <div className="space-y-2 pt-2 border-t border-primary/10">
                            <Label className="uppercase text-[10px] font-black text-primary text-center block">Qtd. Cartelas</Label>
                            <div className="flex items-center gap-4 justify-center">
                               <Button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} variant="outline" className="h-12 w-12 rounded-xl border-2 bg-white"><Minus /></Button>
                               <input 
                                 type="number" 
                                 value={quantity} 
                                 onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} 
                                 className="h-12 text-center text-xl font-black border-2 rounded-xl w-20 bg-white" 
                               />
                               <Button type="button" onClick={() => setQuantity(quantity + 1)} variant="outline" className="h-12 w-12 rounded-xl border-2 bg-white"><Plus /></Button>
                            </div>
                         </div>
                       )}
                    </div>
                  )}

                  <div className="bg-primary/5 p-4 rounded-2xl border-2 border-primary/10 text-center">
                     <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Total da Aposta</p>
                     <p className="text-4xl font-black text-primary">R$ {formData.valorTotal.toFixed(2)}</p>
                  </div>

                  <Button type="submit" className="w-full h-16 font-black uppercase text-lg shadow-2xl rounded-2xl bg-primary text-white" disabled={loading}>
                    {loading ? "GERANDO..." : "EMITIR APOSTA"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {vendaRealizada ? (
                <div className="space-y-4 animate-in zoom-in-95 duration-300">
                  <div id="receipt-content" className="bg-[#FFFFF4] p-6 shadow-2xl border border-black/10 font-mono rounded-3xl relative overflow-hidden print:shadow-none print:border-none print:p-0 print:rounded-none">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-12 -mt-12 rounded-full"></div>
                     
                     <div className="text-center border-b-2 border-dashed border-black/20 pb-4 mb-4">
                        <p className="text-2xl font-black text-primary uppercase">LEOBET PRO</p>
                        <p className="font-bold uppercase tracking-widest text-[8px] opacity-60">Recibo Oficial</p>
                     </div>

                     <div className="space-y-2 mb-6 text-[10px] uppercase font-bold">
                        <p className="flex justify-between"><span>COD:</span> <span>#{vendaRealizada.id}</span></p>
                        <p className="flex justify-between"><span>CLI:</span> <span className="truncate max-w-[140px]">{vendaRealizada.cliente}</span></p>
                        <p className="flex justify-between"><span>CON:</span> <span className="truncate max-w-[140px]">{vendaRealizada.evento_nome}</span></p>
                        <p className="flex justify-between"><span>DATA:</span> <span>{new Date(vendaRealizada.created_at).toLocaleString()}</span></p>
                        <p className="flex justify-between border-t-2 border-dashed pt-4 mt-2 text-primary font-black">
                           <span>TOTAL:</span> 
                           <span>R$ {vendaRealizada.valor_total.toFixed(2)}</span>
                        </p>
                     </div>

                     <div className="p-3 bg-primary/5 rounded-xl mb-6 space-y-1.5 border border-primary/10">
                        <p className="text-[8px] font-black uppercase text-primary text-center">Prêmios Estimados</p>
                        {vendaRealizada.tipo === 'bingo' ? (
                          <div className="grid grid-cols-3 gap-1">
                            <div className="text-center"><p className="text-[6px] opacity-60">BINGO</p><p className="font-black text-[9px]">R$ {vendaRealizada.detalhe_premios.bingo.toFixed(2)}</p></div>
                            <div className="text-center"><p className="text-[6px] opacity-60">QUINA</p><p className="font-black text-[9px]">R$ {vendaRealizada.detalhe_premios.quina.toFixed(2)}</p></div>
                            <div className="text-center"><p className="text-[6px] opacity-60">QUADRA</p><p className="font-black text-[9px]">R$ {vendaRealizada.detalhe_premios.quadra.toFixed(2)}</p></div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-[6px] opacity-60 uppercase">ACUMULADO</p>
                            <p className="font-black text-[11px]">R$ {vendaRealizada.detalhe_premios.bolao.toFixed(2)}</p>
                          </div>
                        )}
                     </div>

                     <div className="text-center py-4 border-y-2 border-dashed border-black/20 mb-6">
                        <Badge variant={vendaRealizada.status === 'pago' ? 'default' : 'destructive'} className="uppercase font-black px-6 py-2 rounded-full text-[9px]">
                          {vendaRealizada.status === 'pago' ? '✓ VALIDADA' : '⚠ PENDENTE'}
                        </Badge>
                     </div>

                     <div className="text-center space-y-1">
                        <p className="text-[8px] font-black text-primary">leobet-probets.vercel.app</p>
                        <TicketIcon className="w-8 h-8 mx-auto opacity-10" />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 print:hidden">
                      <Button onClick={handleWhatsApp} className="h-14 bg-green-600 font-black uppercase text-xs rounded-2xl">
                        <Send className="w-4 h-4 mr-2" /> WhatsApp
                      </Button>
                      <Button onClick={handlePrint} variant="outline" className="h-14 border-2 font-black uppercase text-xs rounded-2xl">
                        <Printer className="w-4 h-4 mr-2" /> Imprimir
                      </Button>
                      <Button onClick={() => setVendaRealizada(null)} variant="secondary" className="col-span-2 h-12 font-black uppercase text-[10px] rounded-2xl border">
                        Nova Venda
                      </Button>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-4 border-dashed rounded-[3rem] opacity-20 bg-white print:hidden">
                  <TicketIcon className="w-20 h-20 text-primary mb-6" />
                  <h3 className="text-xl font-black uppercase text-primary text-center">Terminal Pronto</h3>
                  <p className="text-[8px] font-black uppercase tracking-widest mt-2">Sincronizado via Supabase</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-content, #receipt-content * { visibility: visible; }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
