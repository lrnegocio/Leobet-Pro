
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Bluetooth,
  RefreshCcw,
  Smartphone,
  Printer,
  Plus,
  Minus,
  Database,
  MessageCircle,
  Trophy,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/use-auth-store';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';

export default function VendaPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventosAtivos, setEventosAtivos] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  
  const [btCharacteristic, setBtCharacteristic] = useState<any>(null);
  const [btDevice, setBtDevice] = useState<any>(null);
  const [btConnecting, setBtConnecting] = useState(false);

  const [prizes, setPrizes] = useState({ totalNet: 0, quadra: 0, quina: 0, bingo: 0, bolao: 0 });
  const [selectedEventData, setSelectedEventData] = useState<any>(null);
  
  const [formData, setFormData] = useState({ 
    cliente: '', 
    whatsapp: '', 
    pixKey: '',
    eventoId: '', 
    eventoNome: '', 
    tipo: 'bingo' as 'bingo' | 'bolao', 
    unitario: 0 
  });

  const [partidasBolao, setPartidasBolao] = useState<any[]>([]);
  const [palpites, setPalpites] = useState<string[]>([]);
  const [vendaRealizada, setVendaRealizada] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    loadEventos();
  }, []);

  const loadEventos = async () => {
    try {
      const { data: bingos } = await supabase.from('bingos').select('*').eq('status', 'aberto');
      const { data: boloes } = await supabase.from('boloes').select('*').eq('status', 'aberto');
      
      const validBingos = (bingos || []).map(b => ({ ...b, tipo: 'bingo' }));
      const validBoloes = (boloes || []).map(b => ({ ...b, tipo: 'bolao' }));

      setEventosAtivos([...validBingos, ...validBoloes]);
    } catch (err: any) {
      console.warn("Erro ao carregar concursos:", err.message);
    }
  };

  const updatePrizes = async (eventId: string, type: string) => {
    try {
      const { data } = await supabase.from('tickets').select('valor_total').eq('evento_id', eventId).in('status', ['pago', 'ganhou', 'premio_pago', 'pendente-resgate']);
      const totalPaid = (data || []).reduce((acc, t) => acc + Number(t.valor_total || 0), 0);
      const pool = Math.floor(totalPaid * 0.65 * 100) / 100;

      if (type === 'bingo') {
        const bingoVal = Math.floor(pool * 0.50 * 100) / 100;
        const quinaVal = Math.floor(pool * 0.30 * 100) / 100;
        const quadraVal = Number((pool - bingoVal - quinaVal).toFixed(2));
        setPrizes({ totalNet: pool, bingo: bingoVal, quina: quinaVal, quadra: quadraVal, bolao: 0 });
      } else {
        setPrizes({ totalNet: pool, quadra: 0, quina: 0, bingo: 0, bolao: pool });
      }
    } catch (err: any) {
      console.error("Erro ao calcular prêmios live:", err.message);
    }
  };

  const handleSelectEvento = (eventId: string) => {
    const ev = eventosAtivos.find(e => e.id === eventId);
    if (ev) {
      setSelectedEventData(ev);
      setFormData({ ...formData, eventoId: ev.id, eventoNome: ev.nome, unitario: ev.preco, tipo: ev.tipo });
      updatePrizes(ev.id, ev.tipo);
      if (ev.tipo === 'bolao') {
        setPartidasBolao(ev.partidas || []);
        setPalpites(Array(ev.partidas?.length || 10).fill(''));
      } else {
        setPartidasBolao([]);
        setPalpites([]);
      }
    } else {
      setSelectedEventData(null);
    }
  };

  const handleSetPalpite = (idx: number, choice: string) => {
    const newPalpites = [...palpites];
    newPalpites[idx] = choice;
    setPalpites(newPalpites);
  };

  const connectPrinter = async () => {
    if (typeof window === 'undefined' || !navigator.bluetooth) {
      toast({ variant: "destructive", title: "BLUETOOTH INDISPONÍVEL" });
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
        toast({ title: "IMPRESSORA CONECTADA!" });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "FALHA DE CONEXÃO", description: err.message });
    } finally {
      setBtConnecting(false);
    }
  };

  const printReceipt = useCallback(async (receipt: any) => {
    if (!btCharacteristic) {
      toast({ variant: "destructive", title: "CONECTE A IMPRESSORA" });
      return;
    }
    try {
      const encoder = new TextEncoder();
      let text = "\x1B\x40\x1B\x61\x01\x1B\x45\x01LEOBET PRO\x1B\x45\x00\n";
      text += "CUPOM OFICIAL AUDITADO\n";
      text += "--------------------------------\n";
      text += `CLIENTE: ${receipt.cliente}\n`;
      text += `PIX: ${receipt.pix_resgate}\n`;
      text += `JOGO: ${receipt.evento_nome}\n`;
      text += "--------------------------------\n";
      receipt.tickets_data.slice(0, 5).forEach((t: any, i: number) => {
        text += `BILHETE #${i+1}: ${t.id}\n`;
        if (t.n) text += `DEZ: ${t.n.join(' ')}\n`;
        if (t.p) text += `PALPITE: ${t.p}\n`;
        text += "\n";
      });
      if (receipt.tickets_data.length > 5) text += `+ ${receipt.tickets_data.length - 5} BILHETES NO LINK\n`;
      text += "--------------------------------\n";
      text += `VALOR: R$ ${receipt.valor_total.toFixed(2)}\n`;
      text += `CÓDIGO: ${receipt.id}\n`;
      text += "\x1B\x61\x01BOA SORTE!\n\n\n\n";
      const data = encoder.encode(text);
      const chunkSize = 20;
      for (let i = 0; i < data.length; i += chunkSize) {
        await btCharacteristic.writeValue(data.slice(i, i + chunkSize));
      }
      toast({ title: "CUPOM IMPRESSO!" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "ERRO DE IMPRESSÃO", description: e.message });
    }
  }, [btCharacteristic, toast]);

  const handleVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventoId) return toast({ variant: "destructive", title: "ESCOLHA O JOGO" });
    if (formData.tipo === 'bolao' && palpites.some(p => p === '')) return toast({ variant: "destructive", title: "PREENCHA TODOS OS PALPITES" });

    setLoading(true);
    const receiptId = Math.random().toString(36).substring(7).toUpperCase();
    
    // PAYLOAD OTIMIZADO: Chaves de 1 letra para reduzir peso no banco (n=numeros, p=palpites, s=status)
    const ticketsGenerated = [];
    for (let i = 0; i < quantity; i++) {
      let numsArr = null;
      if (formData.tipo === 'bingo') {
        const nums = new Set<number>();
        while(nums.size < 15) nums.add(Math.floor(Math.random() * 90) + 1);
        numsArr = Array.from(nums).sort((a,b) => a-b);
      }
      ticketsGenerated.push({
        id: Math.random().toString(36).substring(7).toUpperCase(),
        n: numsArr, 
        p: formData.tipo === 'bolao' ? palpites.join('-') : null,
        s: 'pago'
      });
    }

    const totalVenda = formData.unitario * quantity;
    const receipt = {
      id: receiptId,
      evento_id: formData.eventoId,
      evento_nome: formData.eventoNome,
      tipo: formData.tipo,
      cliente: formData.cliente.toUpperCase(),
      whatsapp: formData.whatsapp.replace(/\D/g, ''),
      pix_resgate: formData.pixKey, 
      valor_total: totalVenda,
      vendedor_id: user?.id || 'admin-master',
      status: 'pago', 
      tickets_data: ticketsGenerated,
      detalhe_premios: prizes,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('tickets').insert([receipt]);
      if (error) throw error;
      setVendaRealizada(receipt);
      toast({ title: "VENDA REGISTRADA!" });
      updatePrizes(formData.eventoId, formData.tipo);
      setFormData(prev => ({ ...prev, cliente: '', whatsapp: '', pixKey: '' }));
    } catch (err: any) {
      console.error("Erro venda:", err);
      toast({ 
        variant: "destructive", 
        title: "FALHA NA VENDA", 
        description: "Payload muito grande ou erro de conexão. Tente novamente." 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white p-4 rounded-3xl shadow-sm border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-3 rounded-2xl", btCharacteristic ? "bg-green-100" : "bg-muted")}>
                    <Bluetooth className={cn("w-6 h-6", btCharacteristic ? "text-green-600" : "text-muted-foreground")} />
                  </div>
                  <div><p className="text-[10px] font-black uppercase text-muted-foreground">Impressora BT</p><p className="text-sm font-black text-primary">{btDevice ? btDevice.name : "DESCONECTADO"}</p></div>
                </div>
                <Button onClick={connectPrinter} disabled={btConnecting} className="h-12 px-6 font-black uppercase text-[10px] rounded-xl">
                  {btConnecting ? <RefreshCcw className="animate-spin" /> : (btCharacteristic ? "CONECTADO" : "PAREAR")}
                </Button>
            </Card>

            {formData.eventoId && (
              <Card className="bg-primary text-white p-4 rounded-3xl shadow-xl border-none">
                 <div className="flex justify-between items-center h-full">
                    <div><p className="text-[10px] font-black uppercase opacity-60">Prêmios Live (65%)</p><p className="text-2xl font-black">R$ {prizes.totalNet.toFixed(2)}</p></div>
                    {formData.tipo === 'bingo' ? (
                      <div className="flex gap-2">
                         <div className="bg-white/10 p-2 rounded-xl text-center"><p className="text-[7px] uppercase">Bingo</p><p className="text-[9px] font-black">R$ {prizes.bingo.toFixed(2)}</p></div>
                         <div className="bg-white/10 p-2 rounded-xl text-center"><p className="text-[7px] uppercase">Quina</p><p className="text-[9px] font-black">R$ {prizes.quina.toFixed(2)}</p></div>
                         <div className="bg-white/10 p-2 rounded-xl text-center"><p className="text-[7px] uppercase">Quadra</p><p className="text-[9px] font-black">R$ {prizes.quadra.toFixed(2)}</p></div>
                      </div>
                    ) : <div className="bg-accent p-3 rounded-2xl flex items-center gap-2"><Trophy className="w-5 h-5" /> <p className="text-sm font-black">R$ {prizes.bolao.toFixed(2)}</p></div>}
                 </div>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
            <Card className="rounded-[2.5rem] shadow-2xl bg-white border-t-8 border-primary">
              <CardHeader className="p-8 pb-0"><CardTitle className="text-xl font-black uppercase text-primary flex items-center gap-2"><ShoppingCart className="w-6 h-6" /> Terminal de Vendas</CardTitle></CardHeader>
              <CardContent className="p-8 space-y-6">
                <form onSubmit={handleVenda} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Cliente</Label><Input value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} placeholder="NOME" className="h-12 font-bold uppercase" required /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">WhatsApp</Label><Input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="DDD + NÚMERO" className="h-12 font-bold" required /></div>
                  </div>
                  <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Chave PIX Resgate</Label><Input value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} placeholder="PIX DO CLIENTE" className="h-12 font-black border-accent/30" required /></div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase opacity-60">Escolher Concurso</Label>
                    <select className="w-full h-14 border-2 rounded-xl px-4 font-black text-xs" value={formData.eventoId} onChange={e => handleSelectEvento(e.target.value)} required>
                      <option value="">-- SELECIONE --</option>
                      {eventosAtivos.map(e => (
                        <option key={e.id} value={e.id}>{e.nome} (R$ {Number(e.preco).toFixed(2)})</option>
                      ))}
                    </select>
                  </div>

                  {formData.tipo === 'bolao' && (
                    <div className="space-y-2 pt-4 border-t max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                       {partidasBolao.map((p, idx) => (
                         <div key={idx} className="bg-muted/30 p-2 rounded-xl border flex justify-between items-center gap-2">
                            <p className="text-[8px] font-black uppercase w-20 truncate">{p.time1} vs {p.time2}</p>
                            <div className="flex gap-1">
                               {['1', 'X', '2'].map(c => (
                                 <Button key={c} type="button" variant={palpites[idx] === (c === '1' ? p.time1 : c === '2' ? p.time2 : 'X') ? 'default' : 'outline'} className="h-8 w-8 p-0 text-[10px] font-black" onClick={() => handleSetPalpite(idx, c === '1' ? p.time1 : c === '2' ? p.time2 : 'X')}>{c}</Button>
                               ))}
                            </div>
                         </div>
                       ))}
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase opacity-60">Bilhetes</Label>
                    <div className="flex items-center gap-4">
                      <Button type="button" variant="outline" className="h-12 w-12 rounded-xl" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus /></Button>
                      <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="h-12 text-center font-black text-xl" />
                      <Button type="button" variant="outline" className="h-12 w-12 rounded-xl" onClick={() => setQuantity(quantity + 1)}><Plus /></Button>
                    </div>
                  </div>

                  <div className="bg-primary p-6 rounded-3xl text-center shadow-xl"><p className="text-[10px] font-black uppercase text-white/60 mb-1">Total</p><p className="text-4xl font-black text-white">R$ {(formData.unitario * quantity).toFixed(2)}</p></div>
                  <Button type="submit" className="w-full h-16 font-black uppercase bg-accent text-white rounded-2xl shadow-xl" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : "CONCLUIR VENDA"}</Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {vendaRealizada ? (
                <div className="bg-[#FFFFF4] p-8 shadow-2xl border font-mono rounded-[2rem] text-center relative">
                   <p className="text-2xl font-black text-primary">LEOBET PRO</p>
                   <div className="my-6 border-y-2 border-dashed border-black/10 py-4 space-y-2 text-xs uppercase font-bold text-left">
                      <p className="flex justify-between"><span>CLIENTE:</span> <span>{vendaRealizada.cliente}</span></p>
                      <p className="flex justify-between"><span>JOGO:</span> <span>{vendaRealizada.evento_nome}</span></p>
                      <p className="flex justify-between"><span>VALOR:</span> <span>R$ {vendaRealizada.valor_total.toFixed(2)}</span></p>
                      <p className="text-center pt-2 border-t font-black">CÓDIGO: {vendaRealizada.id}</p>
                   </div>
                   <div className="flex gap-2">
                      <Button onClick={() => printReceipt(vendaRealizada)} className="flex-1 h-16 bg-primary font-black uppercase rounded-2xl gap-2"><Printer className="w-5 h-5" /> Imprimir</Button>
                      <Button onClick={() => {
                        const link = `${window.location.origin}/resultados?c=${vendaRealizada.id}`;
                        const msg = `*LEOBET PRO*%0A%0A🎟️ *BILHETE OFICIAL*%0A👤 *CLIENTE:* ${vendaRealizada.cliente}%0A🏆 *JOGO:* ${vendaRealizada.evento_nome}%0A💰 *VALOR:* R$ ${vendaRealizada.valor_total.toFixed(2)}%0A%0A*Conferir Auditoria:*%0A${link}`;
                        window.open(`https://api.whatsapp.com/send?phone=55${vendaRealizada.whatsapp}&text=${msg}`, '_blank');
                      }} className="flex-1 h-16 bg-green-600 hover:bg-green-700 font-black uppercase rounded-2xl gap-2 text-white"><MessageCircle className="w-5 h-5" /> WhatsApp</Button>
                   </div>
                   <Button onClick={() => setVendaRealizada(null)} variant="ghost" className="w-full h-12 font-black uppercase text-[10px] mt-2">Nova Venda</Button>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-4 border-dashed rounded-[3rem] opacity-20 bg-white">
                  <Smartphone className="w-20 h-20 text-primary mb-4" />
                  <h3 className="text-xl font-black uppercase text-primary">Aguardando operação...</h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
