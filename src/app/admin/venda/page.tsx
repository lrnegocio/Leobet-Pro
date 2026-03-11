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
  Bluetooth,
  RefreshCcw,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/use-auth-store';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';

export default function VendaPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [eventosAtivos, setEventosAtivos] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  
  const [btDevice, setBtDevice] = useState<any>(null);
  const [btCharacteristic, setBtCharacteristic] = useState<any>(null);
  const [btConnecting, setBtConnecting] = useState(false);

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
      console.error("Prize error");
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
      console.error("Event load error");
    }
  };

  const connectPrinter = async () => {
    setBtConnecting(true);
    try {
      // @ts-ignore
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, { services: ['0000ff00-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', '0000ff00-0000-1000-8000-00805f9b34fb']
      }).catch(async () => {
        // @ts-ignore
        return await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] });
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb').catch(async () => {
         return await server.getPrimaryService('0000ff00-0000-1000-8000-00805f9b34fb');
      });
      
      const characteristics = await service.getCharacteristics();
      const writeChar = characteristics.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);

      if (writeChar) {
        setBtDevice(device);
        setBtCharacteristic(writeChar);
        toast({ title: "IMPRESSORA CONECTADA!", description: device.name });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO AO PAREAR", description: "Verifique seu Bluetooth." });
    } finally {
      setBtConnecting(false);
    }
  };

  const handleVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente.trim() || formData.whatsapp.length < 10) {
      toast({ variant: "destructive", title: "DADOS INCOMPLETOS" });
      return;
    }

    setLoading(true);
    const ticketsGenerated = [];
    for (let i = 0; i < quantity; i++) {
      ticketsGenerated.push({
        id: Math.random().toString().substring(2, 13),
        numeros: formData.tipo === 'bingo' ? Array.from({length: 15}, () => Math.floor(Math.random() * 90) + 1) : null,
        status: 'aberto'
      });
    }

    const receipt = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      evento_id: formData.eventoId,
      evento_nome: formData.eventoNome,
      tipo: formData.tipo,
      cliente: formData.cliente,
      whatsapp: formData.whatsapp.replace(/\D/g, ''),
      valor_total: formData.valorTotal,
      vendedor_id: user?.id,
      status: 'pago',
      tickets_data: ticketsGenerated,
      detalhe_premios: { ...prizes },
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('tickets').insert([receipt]);
      if (error) throw error;
      
      setVendaRealizada(receipt);
      toast({ title: "BILHETE EMITIDO!" });
      updatePrizes(formData.eventoId, formData.tipo);
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO NA EMISSÃO" });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-muted/30 font-body overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-2 md:p-8 pt-2 md:pt-8 bg-white md:bg-muted/30">
        <div className="max-w-5xl mx-auto space-y-4">
          
          <div className="bg-white p-3 rounded-2xl shadow-sm border-2 border-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bluetooth className={cn("w-5 h-5", btCharacteristic ? "text-green-600" : "text-muted-foreground")} />
                <div>
                   <p className="text-[10px] font-black uppercase text-muted-foreground">Impressora Térmica</p>
                   <p className="text-xs font-black text-primary">{btDevice ? btDevice.name : "OFFLINE"}</p>
                </div>
              </div>
              <Button onClick={connectPrinter} disabled={btConnecting} className="h-10 px-4 font-black uppercase text-[10px] rounded-xl">
                {btConnecting ? <RefreshCcw className="animate-spin" /> : "Parear"}
              </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden border-t-8 border-primary">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleVenda} className="space-y-4">
                  <Input value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value.toUpperCase()})} placeholder="NOME DO CLIENTE" className="h-12 font-bold" required />
                  <Input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="WHATSAPP" className="h-12 font-bold" required />
                  
                  <select 
                    className="w-full h-14 border-2 rounded-xl px-4 font-black text-xs" 
                    value={formData.eventoId} 
                    onChange={e => {
                      const ev = eventosAtivos.find(ev => ev.id === e.target.value);
                      if (ev) {
                        setSelectedEvent(ev);
                        setFormData({...formData, eventoId: ev.id, eventoNome: ev.nome, unitario: ev.preco, valorTotal: ev.preco, tipo: ev.tipo});
                        updatePrizes(ev.id, ev.tipo);
                      }
                    }} 
                    required
                  >
                    <option value="">-- SELECIONE O JOGO --</option>
                    {eventosAtivos.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>

                  <div className="bg-primary/5 p-4 rounded-xl border-2 border-primary/10 text-center">
                     <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Total a Pagar</p>
                     <p className="text-3xl font-black text-primary">R$ {formData.valorTotal.toFixed(2)}</p>
                  </div>

                  <Button type="submit" className="w-full h-14 font-black uppercase bg-primary text-white rounded-xl shadow-lg" disabled={loading}>
                    {loading ? "PROCESSANDO..." : "GERAR RECIBO"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {vendaRealizada ? (
                <div className="space-y-4">
                  <div id="receipt-content" className="bg-[#FFFFF4] p-6 shadow-2xl border border-black/10 font-mono rounded-3xl relative overflow-hidden">
                     <div className="text-center border-b-2 border-dashed border-black/20 pb-4 mb-4">
                        <p className="text-xl font-black text-primary">LEOBET PRO</p>
                        <p className="text-[8px] font-bold">RECIBO OFICIAL</p>
                     </div>
                     <div className="space-y-2 mb-6 text-[10px] uppercase font-bold">
                        <p className="flex justify-between"><span>CLI:</span> <span className="truncate">{vendaRealizada.cliente}</span></p>
                        <p className="flex justify-between"><span>CON:</span> <span className="truncate">{vendaRealizada.evento_nome}</span></p>
                        <p className="flex justify-between font-black text-primary border-t pt-2"><span>TOTAL:</span> <span>R$ {vendaRealizada.valor_total.toFixed(2)}</span></p>
                     </div>
                     <Button onClick={() => window.print()} className="w-full h-12 border-2 font-black uppercase text-[10px] rounded-xl"><Printer className="w-4 h-4 mr-2" /> Imprimir</Button>
                  </div>
                  <Button onClick={() => setVendaRealizada(null)} variant="secondary" className="w-full h-10 font-black uppercase text-[9px] rounded-xl">Nova Venda</Button>
                </div>
              ) : (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center border-4 border-dashed rounded-[2.5rem] opacity-20 bg-white">
                  <TicketIcon className="w-16 h-16 text-primary mb-4" />
                  <h3 className="text-lg font-black uppercase text-primary">Pronto para Vender</h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
