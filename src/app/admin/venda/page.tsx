
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  ShoppingCart, 
  Send, 
  Ticket as TicketIcon, 
  Printer, 
  Bluetooth,
  RefreshCcw,
  CheckCircle2,
  Database,
  Smartphone
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
      console.error("Prize sync error");
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
        toast({ title: "IMPRESSORA PRONTA!", description: device.name });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "FALHA NO PAREAMENTO", description: "Ative o Bluetooth e tente novamente." });
    } finally {
      setBtConnecting(false);
    }
  };

  const sendToPrinter = async (receipt: any) => {
    if (!btCharacteristic) return;

    try {
      const encoder = new TextEncoder();
      const line = "--------------------------------\n";
      let text = "\x1B\x40"; // Reset
      text += "\x1B\x61\x01"; // Center
      text += "\x1B\x45\x01LEOBET PRO\x1B\x45\x00\n";
      text += "RECIBO OFICIAL\n";
      text += line;
      text += `\x1B\x61\x00`; // Left
      text += `CLIENTE: ${receipt.cliente}\n`;
      text += `DATA: ${new Date().toLocaleDateString()}\n`;
      text += `JOGO: ${receipt.evento_nome}\n`;
      text += line;
      
      receipt.tickets_data.forEach((t: any) => {
        text += `BILHETE: ${t.id}\n`;
        if (t.numeros) text += `NUMEROS: ${t.numeros.join(' ')}\n`;
        text += line;
      });

      text += `\x1B\x61\x01`; // Center
      text += `TOTAL: R$ ${receipt.valor_total.toFixed(2)}\n`;
      text += "\n\n\n\n"; // Espaço para corte

      const data = encoder.encode(text);
      await btCharacteristic.writeValue(data);
      toast({ title: "IMPRESSÃO ENVIADA!" });
    } catch (e) {
      console.error("Print error", e);
    }
  };

  const handleVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente.trim() || formData.whatsapp.length < 10) {
      toast({ variant: "destructive", title: "DADOS INVÁLIDOS" });
      return;
    }

    setLoading(true);
    const receiptId = Math.random().toString(36).substring(7).toUpperCase();
    const ticketsGenerated = [{
      id: Math.random().toString().substring(2, 10),
      numeros: formData.tipo === 'bingo' ? Array.from({length: 15}, () => Math.floor(Math.random() * 90) + 1).sort((a,b)=>a-b) : null,
      status: 'aberto'
    }];

    const receipt = {
      id: receiptId,
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
      toast({ title: "VENDA CONFIRMADA!" });
      
      // IMPRESSÃO AUTOMÁTICA SE ESTIVER CONECTADO
      if (btCharacteristic) sendToPrinter(receipt);

      // WHATSAPP AUTOMÁTICO
      const msg = `*LEOBET PRO - COMPROVANTE*%0A%0A👤 *CLIENTE:* ${receipt.cliente}%0A🎟️ *CONCURSO:* ${receipt.evento_nome}%0A💰 *TOTAL:* R$ ${receipt.valor_total.toFixed(2)}%0A%0A*Confira seu bilhete:*%0Ahttps://leobet-probets.vercel.app/resultados?c=${receipt.id}`;
      window.open(`https://api.whatsapp.com/send?phone=55${receipt.whatsapp}&text=${msg}`, '_blank');
      
      updatePrizes(formData.eventoId, formData.tipo);
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO NA GRAVAÇÃO" });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8 bg-white md:bg-muted/30">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* PAINEL DE IMPRESSORA */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border-2 border-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-3 rounded-2xl", btCharacteristic ? "bg-green-100" : "bg-muted")}>
                  <Bluetooth className={cn("w-6 h-6", btCharacteristic ? "text-green-600" : "text-muted-foreground")} />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase text-muted-foreground">Impressora Térmica</p>
                   <p className="text-sm font-black text-primary">{btDevice ? btDevice.name : "NÃO CONECTADO"}</p>
                </div>
              </div>
              <Button onClick={connectPrinter} disabled={btConnecting} className="h-12 px-6 font-black uppercase text-[10px] rounded-xl shadow-lg">
                {btConnecting ? <RefreshCcw className="animate-spin" /> : (btCharacteristic ? "Reconectar" : "Parear")}
              </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden border-t-8 border-primary">
              <CardContent className="p-8 space-y-6">
                <form onSubmit={handleVenda} className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase opacity-60">Nome do Cliente</Label>
                    <Input value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value.toUpperCase()})} placeholder="EX: JOÃO SILVA" className="h-12 font-bold uppercase" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase opacity-60">WhatsApp</Label>
                    <Input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="82999998888" className="h-12 font-bold" required />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase opacity-60">Selecione o Jogo</Label>
                    <select 
                      className="w-full h-14 border-2 rounded-xl px-4 font-black text-xs bg-white" 
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
                      <option value="">-- ESCOLHA O CONCURSO --</option>
                      {eventosAtivos.map(e => <option key={e.id} value={e.id}>{e.nome} (R$ {Number(e.preco).toFixed(2)})</option>)}
                    </select>
                  </div>

                  {selectedEvent && (
                    <div className="grid grid-cols-3 gap-2 bg-muted/20 p-4 rounded-2xl border-2 border-dashed">
                       <div className="text-center">
                          <p className="text-[8px] font-black uppercase opacity-40">Bingo</p>
                          <p className="text-[10px] font-black text-primary">R$ {prizes.bingo.toFixed(2)}</p>
                       </div>
                       <div className="text-center">
                          <p className="text-[8px] font-black uppercase opacity-40">Quina</p>
                          <p className="text-[10px] font-black text-primary">R$ {prizes.quina.toFixed(2)}</p>
                       </div>
                       <div className="text-center">
                          <p className="text-[8px] font-black uppercase opacity-40">Quadra</p>
                          <p className="text-[10px] font-black text-primary">R$ {prizes.quadra.toFixed(2)}</p>
                       </div>
                    </div>
                  )}

                  <div className="bg-primary p-6 rounded-3xl text-center shadow-xl">
                     <p className="text-[10px] font-black uppercase text-white/60 mb-1">Total a Receber</p>
                     <p className="text-4xl font-black text-white">R$ {formData.valorTotal.toFixed(2)}</p>
                  </div>

                  <Button type="submit" className="w-full h-16 font-black uppercase bg-accent text-white rounded-2xl shadow-xl transition-all active:scale-95" disabled={loading}>
                    {loading ? "PROCESSANDO..." : "EMITIR E IMPRIMIR"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {vendaRealizada ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-[#FFFFF4] p-8 shadow-2xl border border-black/10 font-mono rounded-[2rem] text-center relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1 bg-primary/20"></div>
                     <p className="text-2xl font-black text-primary tracking-tighter">LEOBET PRO</p>
                     <p className="text-[8px] font-bold uppercase opacity-60">Recibo de Aposta</p>
                     <div className="my-6 border-y-2 border-dashed border-black/10 py-4 space-y-2 text-xs uppercase font-bold text-left">
                        <p className="flex justify-between"><span>CLI:</span> <span>{vendaRealizada.cliente}</span></p>
                        <p className="flex justify-between"><span>CON:</span> <span>{vendaRealizada.evento_nome}</span></p>
                        <p className="flex justify-between"><span>DATA:</span> <span>{new Date().toLocaleDateString()}</span></p>
                        <div className="pt-2 border-t mt-2">
                           {vendaRealizada.tickets_data.map((t: any) => (
                             <p key={t.id} className="text-[10px] font-black">BILHETE: {t.id}</p>
                           ))}
                        </div>
                     </div>
                     <p className="text-xl font-black text-primary">R$ {vendaRealizada.valor_total.toFixed(2)}</p>
                     <div className="mt-8 flex gap-2">
                        <Button onClick={() => sendToPrinter(vendaRealizada)} className="flex-1 h-12 bg-primary font-black uppercase text-[10px] rounded-xl">
                          <Printer className="w-4 h-4 mr-2" /> Re-Imprimir
                        </Button>
                        <Button onClick={() => setVendaRealizada(null)} variant="outline" className="flex-1 h-12 font-black uppercase text-[10px] rounded-xl border-2">
                          Nova Venda
                        </Button>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-4 border-dashed rounded-[3rem] opacity-20 bg-white">
                  <Smartphone className="w-20 h-20 text-primary mb-4" />
                  <h3 className="text-xl font-black uppercase text-primary">Terminal Ativo</h3>
                  <p className="text-[10px] font-black uppercase">Aguardando dados da aposta...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
