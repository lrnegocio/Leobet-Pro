
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  ShoppingCart, 
  Bluetooth,
  RefreshCcw,
  Smartphone,
  Trophy,
  Printer,
  Zap,
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
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const loadEventos = async () => {
    const now = new Date().toISOString();
    try {
      const { data: bingos } = await supabase.from('bingos').select('*').eq('status', 'aberto').gt('data_sorteio', now);
      const { data: boloes } = await supabase.from('boloes').select('*').eq('status', 'aberto').gt('data_fim', now);
      const bFormated = (bingos || []).map(b => ({ ...b, tipo: 'bingo' }));
      const bolFormated = (boloes || []).map(b => ({ ...b, tipo: 'bolao' }));
      setEventosAtivos([...bFormated, ...bolFormated]);
    } catch (err) {
      // Silencioso
    }
  };

  const updatePrizes = async (eventId: string, type: string) => {
    try {
      const { data } = await supabase.from('tickets').select('valor_total').eq('evento_id', eventId).eq('status', 'pago');
      const totalPaid = (data || []).reduce((acc, t) => acc + Number(t.valor_total || 0), 0);
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
      // Silencioso
    }
  };

  const connectPrinter = async () => {
    if (typeof window === 'undefined' || !navigator.bluetooth) {
      toast({ variant: "destructive", title: "BLUETOOTH INDISPONÍVEL", description: "Use o Chrome em um dispositivo Bluetooth." });
      return;
    }

    setBtConnecting(true);
    try {
      const device = await (navigator.bluetooth as any).requestDevice({
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
      toast({ variant: "destructive", title: "ERRO DE CONEXÃO", description: "Verifique o pareamento do dispositivo." });
    } finally {
      setBtConnecting(false);
    }
  };

  const printReceipt = async (receipt: any) => {
    if (!btCharacteristic) return;
    try {
      const encoder = new TextEncoder();
      let text = "\x1B\x40\x1B\x61\x01\x1B\x45\x01LEOBET PRO\x1B\x45\x00\n";
      text += "COMPROVANTE OFICIAL\n";
      text += "--------------------------------\n";
      text += `\x1B\x61\x00CLIENTE: ${receipt.cliente}\n`;
      text += `JOGO: ${receipt.evento_nome}\n`;
      text += `DATA: ${new Date().toLocaleDateString()}\n`;
      text += "--------------------------------\n";
      receipt.tickets_data.forEach((t: any) => {
        text += `BILHETE: ${t.id}\n`;
        if (t.numeros) text += `NUMEROS: ${t.numeros.join(' ')}\n`;
      });
      text += "--------------------------------\n";
      if (receipt.tipo === 'bingo') {
        text += `BINGO: R$ ${receipt.detalhe_premios.bingo.toFixed(2)}\n`;
        text += `QUINA: R$ ${receipt.detalhe_premios.quina.toFixed(2)}\n`;
        text += `QUADRA: R$ ${receipt.detalhe_premios.quadra.toFixed(2)}\n`;
      } else {
        text += `PREMIO: R$ ${receipt.detalhe_premios.bolao.toFixed(2)}\n`;
      }
      text += "--------------------------------\n";
      text += `\x1B\x61\x01TOTAL: R$ ${receipt.valor_total.toFixed(2)}\n`;
      text += "\n\n\n\n";

      // Envia em blocos para evitar estouro de buffer bluetooth
      const data = encoder.encode(text);
      for (let i = 0; i < data.length; i += 20) {
        await btCharacteristic.writeValue(data.slice(i, i + 20));
      }
      toast({ title: "IMPRESSO COM SUCESSO!" });
    } catch (e) {
      toast({ variant: "destructive", title: "ERRO DE IMPRESSÃO", description: "Verifique a conexão Bluetooth." });
    }
  };

  const handleVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventoId) {
      toast({ variant: "destructive", title: "ESCOLHA UM JOGO" });
      return;
    }

    setLoading(true);
    const receiptId = Math.random().toString(36).substring(7).toUpperCase();
    
    // Gerador de bilhete simples para Bingo
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
      cliente: formData.cliente.toUpperCase(),
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
      toast({ title: "VENDA REALIZADA!", description: "Bilhete sincronizado no banco." });
      
      // AUTO-IMPRESSÃO BLUETOOTH
      if (btCharacteristic) {
        printReceipt(receipt);
      }

      // WHATSAPP COM DETALHES DE PREMIOS
      const premioTxt = formData.tipo === 'bingo' 
        ? `%0A🏆 Bingo: R$ ${prizes.bingo.toFixed(2)}%0A🥈 Quina: R$ ${prizes.quina.toFixed(2)}%0A🥉 Quadra: R$ ${prizes.quadra.toFixed(2)}`
        : `%0A🏆 Acumulado: R$ ${prizes.bolao.toFixed(2)}`;

      const msg = `*LEOBET PRO - RECIBO*%0A%0A👤 *CLIENTE:* ${receipt.cliente}%0A🎟️ *JOGO:* ${receipt.evento_nome}%0A💰 *VALOR:* R$ ${receipt.valor_total.toFixed(2)}%0A%0A*PRÊMIOS ESTIMADOS:*${premioTxt}%0A%0A*Conferir:* https://leobet-probets.vercel.app/resultados?c=${receipt.id}`;
      window.open(`https://api.whatsapp.com/send?phone=55${receipt.whatsapp}&text=${msg}`, '_blank');
      
      updatePrizes(formData.eventoId, formData.tipo);
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO NA VENDA", description: "Verifique sua conexão de rede." });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="bg-white p-4 rounded-3xl shadow-sm border-2 border-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-3 rounded-2xl", btCharacteristic ? "bg-green-100" : "bg-muted")}>
                  <Bluetooth className={cn("w-6 h-6", btCharacteristic ? "text-green-600" : "text-muted-foreground")} />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase text-muted-foreground">Impressora Térmica Bluetooth</p>
                   <p className="text-sm font-black text-primary">{btDevice ? btDevice.name : "DESCONECTADA"}</p>
                </div>
              </div>
              <Button onClick={connectPrinter} disabled={btConnecting} className="h-12 px-6 font-black uppercase text-[10px] rounded-xl shadow-lg">
                {btConnecting ? <RefreshCcw className="animate-spin" /> : (btCharacteristic ? "RECONECTAR" : "PAREAR")}
              </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden border-t-8 border-primary">
              <CardContent className="p-8 space-y-6">
                <form onSubmit={handleVenda} className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase opacity-60">Nome do Apostador</Label>
                    <Input value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} placeholder="EX: JOÃO DA SILVA" className="h-12 font-bold uppercase" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase opacity-60">WhatsApp</Label>
                    <Input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="DDD + NÚMERO" className="h-12 font-bold" required />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase opacity-60">Selecionar Concurso Aberto</Label>
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
                      <option value="">-- SELECIONE O JOGO --</option>
                      {eventosAtivos.map(e => <option key={e.id} value={e.id}>{e.nome} (R$ {Number(e.preco).toFixed(2)})</option>)}
                    </select>
                  </div>

                  {selectedEvent && (
                    <div className="bg-primary/5 p-6 rounded-3xl border-2 border-primary/10 space-y-4">
                       <p className="text-[10px] font-black uppercase text-center opacity-60">Reserva de Prêmios (65%)</p>
                       <div className="grid grid-cols-3 gap-2">
                          <div className="text-center bg-white p-2 rounded-xl border shadow-sm">
                             <Trophy className="w-4 h-4 mx-auto text-accent mb-1" />
                             <p className="text-[8px] font-black uppercase">Bingo</p>
                             <p className="text-[10px] font-black text-primary">R$ {prizes.bingo.toFixed(2)}</p>
                          </div>
                          <div className="text-center bg-white p-2 rounded-xl border shadow-sm">
                             <Zap className="w-4 h-4 mx-auto text-primary mb-1" />
                             <p className="text-[8px] font-black uppercase">Quina</p>
                             <p className="text-[10px] font-black text-primary">R$ {prizes.quina.toFixed(2)}</p>
                          </div>
                          <div className="text-center bg-white p-2 rounded-xl border shadow-sm">
                             <CheckCircle2 className="w-4 h-4 mx-auto text-green-600 mb-1" />
                             <p className="text-[8px] font-black uppercase">Quadra</p>
                             <p className="text-[10px] font-black text-primary">R$ {prizes.quadra.toFixed(2)}</p>
                          </div>
                       </div>
                    </div>
                  )}

                  <div className="bg-primary p-6 rounded-3xl text-center shadow-xl">
                     <p className="text-[10px] font-black uppercase text-white/60 mb-1">Total a Receber</p>
                     <p className="text-4xl font-black text-white">R$ {formData.valorTotal.toFixed(2)}</p>
                  </div>

                  <Button type="submit" className="w-full h-16 font-black uppercase bg-accent text-white rounded-2xl shadow-xl transition-all active:scale-95" disabled={loading}>
                    {loading ? "PROCESSANDO..." : "VENDER AGORA"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {vendaRealizada ? (
                <div className="animate-in zoom-in duration-300">
                  <div id="print-area" className="bg-[#FFFFF4] p-8 shadow-2xl border border-black/10 font-mono rounded-[2rem] text-center relative">
                     <p className="text-2xl font-black text-primary tracking-tighter">LEOBET PRO</p>
                     <p className="text-[8px] font-bold uppercase opacity-60">Auditado Supabase Cloud</p>
                     <div className="my-6 border-y-2 border-dashed border-black/10 py-4 space-y-2 text-xs uppercase font-bold text-left">
                        <p className="flex justify-between"><span>CLI:</span> <span>{vendaRealizada.cliente}</span></p>
                        <p className="flex justify-between"><span>CON:</span> <span className="text-right truncate ml-2">{vendaRealizada.evento_nome}</span></p>
                        <div className="pt-2 border-t mt-2">
                           {vendaRealizada.tickets_data.map((t: any) => (
                             <div key={t.id} className="mb-2">
                               <p className="text-[10px] font-black">BILHETE: {t.id}</p>
                               {t.numeros && <p className="text-[9px] tracking-widest leading-relaxed">{t.numeros.join(' ')}</p>}
                             </div>
                           ))}
                        </div>
                     </div>
                     <p className="text-xl font-black text-primary mb-6">TOTAL: R$ {vendaRealizada.valor_total.toFixed(2)}</p>
                     
                     <div className="flex flex-col gap-2 no-print">
                        <Button onClick={() => printReceipt(vendaRealizada)} className="w-full h-14 bg-primary font-black uppercase text-xs rounded-xl shadow-lg">
                          <Printer className="w-5 h-5 mr-2" /> Imprimir Recibo
                        </Button>
                        <Button onClick={() => setVendaRealizada(null)} variant="outline" className="w-full h-12 font-black uppercase text-[10px] rounded-xl border-2">
                          Nova Venda
                        </Button>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-4 border-dashed rounded-[3rem] opacity-20 bg-white">
                  <Smartphone className="w-20 h-20 text-primary mb-4" />
                  <h3 className="text-xl font-black uppercase text-primary">Terminal de Vendas</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest">O bilhete aparecerá aqui</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; border: none; shadow: none; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
