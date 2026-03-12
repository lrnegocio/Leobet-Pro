
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Bluetooth,
  RefreshCcw,
  Smartphone,
  Trophy,
  Printer,
  Zap,
  CheckCircle2,
  Send,
  Plus,
  Minus,
  Youtube,
  Globe,
  Database
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
  const [settings, setSettings] = useState({ youtubeUrl: '', systemUrl: 'https://leobet-probets.vercel.app/' });
  
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
    const savedSettings = JSON.parse(localStorage.getItem('leobet_settings') || '{}');
    if (savedSettings.youtubeUrl || savedSettings.systemUrl) {
      setSettings({
        youtubeUrl: savedSettings.youtubeUrl || '',
        systemUrl: savedSettings.systemUrl || 'https://leobet-probets.vercel.app/'
      });
    }
  }, []);

  const loadEventos = async () => {
    try {
      const { data: bingos } = await supabase.from('bingos').select('*').eq('status', 'aberto');
      const { data: boloes } = await supabase.from('boloes').select('*').eq('status', 'aberto');
      const bFormated = (bingos || []).map(b => ({ ...b, tipo: 'bingo' }));
      const bolFormated = (boloes || []).map(b => ({ ...b, tipo: 'bolao' }));
      setEventosAtivos([...bFormated, ...bolFormated]);
    } catch (err) {
      console.warn("Erro ao carregar eventos");
    }
  };

  const updatePrizes = async (eventId: string, type: string) => {
    try {
      const { data } = await supabase
        .from('tickets')
        .select('valor_total')
        .eq('evento_id', eventId)
        .in('status', ['pago', 'ganhou', 'premio_pago']);
      
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
    } catch (err) {
      console.error("Erro ao calcular prêmios");
    }
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
      toast({ variant: "destructive", title: "FALHA DE CONEXÃO" });
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
      text += `JOGO: ${receipt.evento_nome}\n`;
      text += `DATA: ${new Date(receipt.created_at).toLocaleString()}\n`;
      text += "--------------------------------\n";
      receipt.tickets_data.forEach((t: any, i: number) => {
        text += `BILHETE #${i+1}: ${t.id}\n`;
        if (t.numeros) text += `DEZ: ${t.numeros.join(' ')}\n`;
        text += "\n";
      });
      text += "--------------------------------\n";
      text += "PREMIACAO ACUMULADA (65%):\n";
      if (receipt.tipo === 'bingo') {
        text += `BINGO: R$ ${receipt.detalhe_premios.bingo.toFixed(2)}\n`;
        text += `QUINA: R$ ${receipt.detalhe_premios.quina.toFixed(2)}\n`;
        text += `QUADRA: R$ ${receipt.detalhe_premios.quadra.toFixed(2)}\n`;
      } else {
        text += `ACUMULADO: R$ ${receipt.detalhe_premios.bolao.toFixed(2)}\n`;
      }
      text += "--------------------------------\n";
      text += `TOTAL: R$ ${receipt.valor_total.toFixed(2)}\n\n`;
      
      if (settings.youtubeUrl) {
        text += `AO VIVO NO YOUTUBE:\n${settings.youtubeUrl}\n\n`;
      }
      
      text += `CONFERIR NO SITE:\n${settings.systemUrl}\n`;
      text += "--------------------------------\n";
      text += `BARCODE: ${receipt.barcode}\n\n`;
      text += "     [ QR CODE DIGITAL ]\n";
      text += `  ${settings.systemUrl}/resultados?c=${receipt.id}\n`;
      text += "\x1B\x61\x01BOA SORTE!\n";
      text += "\n\n\n\n";

      const data = encoder.encode(text);
      const chunkSize = 20;
      for (let i = 0; i < data.length; i += chunkSize) {
        await btCharacteristic.writeValue(data.slice(i, i + chunkSize));
      }
      toast({ title: "CUPOM IMPRESSO!" });
    } catch (e) {
      toast({ variant: "destructive", title: "ERRO DE IMPRESSÃO" });
    }
  }, [btCharacteristic, settings, toast]);

  const sendToWhatsapp = (receipt: any) => {
    let prizeMsg = "";
    if (receipt.tipo === 'bingo') {
      prizeMsg = `🔥 *PRÊMIOS:*%0ABingo: R$ ${receipt.detalhe_premios.bingo.toFixed(2)}%0AQuina: R$ ${receipt.detalhe_premios.quina.toFixed(2)}%0AQuadra: R$ ${receipt.detalhe_premios.quadra.toFixed(2)}`;
    } else {
      prizeMsg = `🔥 *ACUMULADO:* R$ ${receipt.detalhe_premios.bolao.toFixed(2)}`;
    }

    const msg = `*LEOBET PRO*%0A%0A👤 *CLIENTE:* ${receipt.cliente}%0A🎟️ *JOGO:* ${receipt.evento_nome}%0A💰 *VALOR:* R$ ${receipt.valor_total.toFixed(2)}%0A%0A${prizeMsg}%0A%0A📺 *SORTEIO:* ${settings.youtubeUrl}%0A%0A🔍 *CONFERIR:* ${settings.systemUrl}/resultados?c=${receipt.id}%0A%0A📊 *CÓDIGO:* ${receipt.barcode}`;
    window.open(`https://api.whatsapp.com/send?phone=55${receipt.whatsapp}&text=${msg}`, '_blank');
  };

  const handleVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventoId) {
      toast({ variant: "destructive", title: "ESCOLHA O JOGO" });
      return;
    }

    setLoading(true);
    const receiptId = Math.random().toString(36).substring(7).toUpperCase();
    const barcode = Math.floor(10000000000 + Math.random() * 90000000000).toString(); 
    
    const generateBingoNumbers = () => {
      const nums = new Set<number>();
      while(nums.size < 15) nums.add(Math.floor(Math.random() * 90) + 1);
      return Array.from(nums).sort((a,b) => a-b);
    };

    const ticketsGenerated = Array.from({ length: quantity }).map(() => ({
      id: Math.random().toString().substring(2, 10),
      numeros: formData.tipo === 'bingo' ? generateBingoNumbers() : null,
      status: 'pago'
    }));

    const totalVenda = formData.unitario * quantity;
    const isMaster = localStorage.getItem('is_master_admin') === 'true';

    const receipt = {
      id: receiptId,
      barcode: barcode,
      evento_id: formData.eventoId,
      evento_nome: formData.eventoNome,
      tipo: formData.tipo,
      cliente: formData.cliente.toUpperCase(),
      whatsapp: formData.whatsapp.replace(/\D/g, ''),
      valor_total: totalVenda,
      vendedor_id: user?.id || 'admin-master',
      status: isMaster ? 'pago' : 'pendente', 
      tickets_data: ticketsGenerated,
      detalhe_premios: { ...prizes },
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('tickets').insert([receipt]);
      if (error) throw error;
      
      setVendaRealizada(receipt);
      toast({ title: "VENDA REGISTRADA!" });
      updatePrizes(formData.eventoId, formData.tipo);
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO AO SALVAR" });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-5xl mx-auto space-y-6">
          
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            <Card className="flex-1 bg-white p-4 rounded-3xl shadow-sm border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-3 rounded-2xl", btCharacteristic ? "bg-green-100" : "bg-muted")}>
                    <Bluetooth className={cn("w-6 h-6", btCharacteristic ? "text-green-600" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Impressora BT</p>
                    <p className="text-sm font-black text-primary">{btDevice ? btDevice.name : "DESCONECTADO"}</p>
                  </div>
                </div>
                <Button onClick={connectPrinter} disabled={btConnecting} className="h-12 px-6 font-black uppercase text-[10px] rounded-xl shadow-lg">
                  {btConnecting ? <RefreshCcw className="animate-spin" /> : (btCharacteristic ? "CONECTADO" : "PAREAR")}
                </Button>
            </Card>

            <Card className="bg-red-600 text-white p-4 rounded-3xl shadow-lg flex items-center gap-4 border-none cursor-pointer" onClick={() => window.open(settings.youtubeUrl, '_blank')}>
               <Youtube className="w-8 h-8" />
               <div className="text-left">
                  <p className="text-[9px] font-black uppercase opacity-60">Sorteio Online</p>
                  <p className="text-xs font-black uppercase">Assistir YouTube</p>
               </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden border-t-8 border-primary">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xl font-black uppercase flex items-center gap-2 text-primary">
                  <ShoppingCart className="w-6 h-6" /> Novo Bilhete
                </CardTitle>
              </CardHeader>
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
                    <Label className="text-[10px] font-black uppercase opacity-60">Escolher Concurso</Label>
                    <select 
                      className="w-full h-14 border-2 rounded-xl px-4 font-black text-xs bg-white" 
                      value={formData.eventoId} 
                      onChange={e => {
                        const ev = eventosAtivos.find(ev => ev.id === e.target.value);
                        if (ev) {
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

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase opacity-60">Quantas Cartelas?</Label>
                    <div className="flex items-center gap-4">
                      <Button type="button" variant="outline" size="icon" className="h-12 w-12 rounded-xl border-2" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                        <Minus className="w-6 h-6" />
                      </Button>
                      <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="h-12 text-center font-black text-xl rounded-xl border-2" />
                      <Button type="button" variant="outline" size="icon" className="h-12 w-12 rounded-xl border-2" onClick={() => setQuantity(quantity + 1)}>
                        <Plus className="w-6 h-6" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-primary/5 p-6 rounded-3xl border-2 border-primary/10 space-y-4">
                     <p className="text-[10px] font-black uppercase text-center opacity-60 flex items-center justify-center gap-2">
                       <Database className="w-3 h-3 text-green-600" /> Prêmios Acumulados (65%)
                     </p>
                     <div className="grid grid-cols-3 gap-2">
                        <div className="text-center bg-white p-2 rounded-xl border shadow-sm">
                           <Trophy className="w-4 h-4 mx-auto text-accent mb-1" />
                           <p className="text-[8px] font-black uppercase">Bingo</p>
                           <p className="text-[10px] font-black text-primary leading-none mt-1">R$ {prizes.bingo.toFixed(2)}</p>
                        </div>
                        <div className="text-center bg-white p-2 rounded-xl border shadow-sm">
                           <Zap className="w-4 h-4 mx-auto text-primary mb-1" />
                           <p className="text-[8px] font-black uppercase">Quina</p>
                           <p className="text-[10px] font-black text-primary leading-none mt-1">R$ {prizes.quina.toFixed(2)}</p>
                        </div>
                        <div className="text-center bg-white p-2 rounded-xl border shadow-sm">
                           <CheckCircle2 className="w-4 h-4 mx-auto text-green-600 mb-1" />
                           <p className="text-[8px] font-black uppercase">Quadra</p>
                           <p className="text-[10px] font-black text-primary leading-none mt-1">R$ {prizes.quadra.toFixed(2)}</p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-primary p-6 rounded-3xl text-center shadow-xl">
                     <p className="text-[10px] font-black uppercase text-white/60 mb-1">Total da Venda</p>
                     <p className="text-4xl font-black text-white">R$ {(formData.unitario * quantity).toFixed(2)}</p>
                  </div>

                  <Button type="submit" className="w-full h-16 font-black uppercase bg-accent text-white rounded-2xl shadow-xl transition-all active:scale-95" disabled={loading}>
                    {loading ? "Processando..." : "Registrar Aposta"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {vendaRealizada ? (
                <div className="animate-in zoom-in duration-300">
                  <div className="bg-[#FFFFF4] p-8 shadow-2xl border border-black/10 font-mono rounded-[2rem] text-center relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
                     <p className="text-2xl font-black text-primary tracking-tighter">LEOBET PRO</p>
                     <p className="text-[8px] font-bold uppercase opacity-60">Cupom de Auditoria</p>
                     
                     <div className="my-6 border-y-2 border-dashed border-black/10 py-4 space-y-2 text-xs uppercase font-bold text-left">
                        <p className="flex justify-between"><span>CLIENTE:</span> <span>{vendaRealizada.cliente}</span></p>
                        <p className="flex justify-between"><span>CONCURSO:</span> <span className="text-right truncate ml-2">{vendaRealizada.evento_nome}</span></p>
                        <p className="flex justify-between"><span>QTD:</span> <span>{vendaRealizada.tickets_data.length} CARTELAS</span></p>
                        
                        <div className="pt-2 border-t mt-2">
                           <p className="text-[9px] font-black uppercase mb-2">Prêmios Acumulados (65%):</p>
                           {vendaRealizada.tipo === 'bingo' ? (
                             <div className="bg-black/5 p-2 rounded space-y-1 text-[10px]">
                               <p className="flex justify-between"><span>Bingo:</span> <span>R$ {vendaRealizada.detalhe_premios.bingo.toFixed(2)}</span></p>
                               <p className="flex justify-between"><span>Quina:</span> <span>R$ {vendaRealizada.detalhe_premios.quina.toFixed(2)}</span></p>
                               <p className="flex justify-between"><span>Quadra:</span> <span>R$ {vendaRealizada.detalhe_premios.quadra.toFixed(2)}</span></p>
                             </div>
                           ) : (
                             <div className="bg-black/5 p-2 rounded text-[10px]">
                               <p className="flex justify-between"><span>Prêmio:</span> <span>R$ {vendaRealizada.detalhe_premios.bolao.toFixed(2)}</span></p>
                             </div>
                           )}
                        </div>

                        <div className="pt-2">
                           {vendaRealizada.tickets_data.map((t: any, idx: number) => (
                             <div key={t.id} className="mb-4">
                               <p className="text-[10px] font-black">CARTELA #{idx+1}: {t.id}</p>
                               {t.numeros && <p className="text-[9px] tracking-widest font-code leading-relaxed bg-black/5 p-1 rounded">{t.numeros.join(' ')}</p>}
                             </div>
                           ))}
                        </div>
                     </div>
                     
                     <div className="space-y-2 mb-6 text-center">
                        <p className="text-xl font-black text-primary">TOTAL: R$ {vendaRealizada.valor_total.toFixed(2)}</p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">BARCODE: {vendaRealizada.barcode}</p>
                     </div>

                     <div className="flex flex-col gap-2 no-print">
                        <Button onClick={() => printReceipt(vendaRealizada)} className="w-full h-14 bg-primary font-black uppercase text-xs rounded-xl shadow-lg gap-2">
                          <Printer className="w-5 h-5" /> Imprimir Cupom
                        </Button>
                        <Button onClick={() => sendToWhatsapp(vendaRealizada)} variant="outline" className="w-full h-14 font-black uppercase text-xs rounded-xl border-2 text-green-600 border-green-200 hover:bg-green-50 gap-2">
                          <Send className="w-5 h-5" /> Enviar WhatsApp
                        </Button>
                        <Button onClick={() => setVendaRealizada(null)} variant="ghost" className="w-full h-12 font-black uppercase text-[10px] rounded-xl opacity-40">
                          Próxima Venda
                        </Button>
                     </div>
                     
                     <div className="mt-4 pt-4 border-t border-dashed">
                        <Globe className="w-4 h-4 mx-auto text-primary/20 mb-1" />
                        <p className="text-[8px] font-bold opacity-30">{settings.systemUrl}</p>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-4 border-dashed rounded-[3rem] opacity-20 bg-white">
                  <Smartphone className="w-20 h-20 text-primary mb-4" />
                  <h3 className="text-xl font-black uppercase text-primary">Terminal de Auditoria</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Database className="w-3 h-3 text-green-600" /> Aguardando operação...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
