
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, 
  Bluetooth,
  Printer,
  Plus,
  Minus,
  MessageCircle,
  Trophy,
  Database,
  Clock,
  History,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/use-auth-store';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';

export default function VendaPage() {
  const { toast } = useToast();
  const { user, setUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventosAtivos, setEventosAtivos] = useState<any[]>([]);
  const [minhasReservas, setMinhasReservas] = useState<any[]>([]);
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
    if (user?.role === 'cliente') {
      setFormData(prev => ({ 
        ...prev, 
        cliente: user.nome, 
        whatsapp: user.phone || '', 
        pixKey: user.pixKey || '' 
      }));
    }
    loadMinhasReservas();
  }, [user]);

  const loadEventos = async () => {
    try {
      const { data: bingos } = await supabase.from('bingos').select('*').eq('status', 'aberto');
      const { data: boloes } = await supabase.from('boloes').select('*').eq('status', 'aberto');
      const now = new Date();
      
      const validBingos = (bingos || []).filter(item => {
        const limitTime = new Date(new Date(item.data_sorteio).getTime() - 60000);
        return now < limitTime;
      }).map(b => ({ ...b, tipo: 'bingo' }));

      const validBoloes = (boloes || []).filter(item => {
        const matches = item.partidas || [];
        if (matches.length === 0) return false;
        const sortedDates = matches.map((m: any) => m.data ? new Date(m.data).getTime() : 0).filter((d: number) => d > 0).sort((a: number, b: number) => a - b);
        if (sortedDates.length === 0) return false;
        const limitTime = new Date(sortedDates[0] - 60000);
        return now < limitTime;
      }).map(b => ({ ...b, tipo: 'bolao' }));
      
      setEventosAtivos([...validBingos, ...validBoloes]);
    } catch (err) { console.warn(err); }
  };

  const loadMinhasReservas = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('status', 'pendente')
      .or(`vendedor_id.eq.${user.id},cliente.eq.${user.nome}`)
      .order('created_at', { ascending: false });
    setMinhasReservas(data || []);
  };

  const handlePayReservation = async (ticket: any) => {
    if (!user) return;
    const val = Number(ticket.valor_total);
    const myBalance = (user.balance || 0);

    if (myBalance < val) {
      toast({ variant: "destructive", title: "SALDO INSUFICIENTE", description: "Recarregue para quitar esta reserva." });
      return;
    }

    setLoading(true);
    try {
      const newBal = myBalance - val;
      await supabase.from('users').update({ balance: newBal }).eq('id', user.id);
      
      await supabase.from('tickets').update({ status: 'pago' }).eq('id', ticket.id);

      if (user.role === 'cambista') {
        const comCambista = val * 0.10;
        const updatedComm = Number(user.commissionBalance || 0) + comCambista;
        await supabase.from('users').update({ commission_balance: updatedComm }).eq('id', user.id);
        
        if (user.gerenteId) {
          const comGerente = val * 0.05;
          const { data: gerente } = await supabase.from('users').select('commission_balance').eq('id', user.gerenteId).single();
          if (gerente) await supabase.from('users').update({ commission_balance: Number(gerente.commission_balance || 0) + comGerente }).eq('id', user.gerenteId);
        }
        setUser({ ...user, balance: newBal, commissionBalance: updatedComm });
      } else {
        setUser({ ...user, balance: newBal });
      }

      toast({ title: "RESERVA QUITADA!" });
      loadMinhasReservas();
    } catch (err: any) {
      toast({ variant: "destructive", title: "FALHA NO PAGAMENTO" });
    } finally { setLoading(false); }
  };

  const updatePrizes = async (eventId: string, type: string) => {
    try {
      const { data } = await supabase.from('tickets').select('valor_total').eq('evento_id', eventId).in('status', ['pago', 'ganhou', 'premio_pago', 'pendente-resgate']);
      const totalPaid = (data || []).reduce((acc, t) => acc + Number(t.valor_total || 0), 0);
      const pool = Math.floor(totalPaid * 0.65 * 100) / 100;
      if (type === 'bingo') {
        const b = Math.floor(pool * 0.50 * 100) / 100;
        const q = Math.floor(pool * 0.30 * 100) / 100;
        setPrizes({ totalNet: pool, bingo: b, quina: q, quadra: Number((pool - b - q).toFixed(2)), bolao: 0 });
      } else {
        setPrizes({ totalNet: pool, quadra: 0, quina: 0, bingo: 0, bolao: pool });
      }
    } catch (err) { console.error(err); }
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
      }
    }
  };

  const handleSetPalpite = (idx: number, val: string) => {
    const newP = [...palpites];
    newP[idx] = val;
    setPalpites(newP);
  };

  const handleVenda = async (e: React.FormEvent, payWithBalance: boolean = false) => {
    e.preventDefault();
    if (!formData.eventoId) return toast({ variant: "destructive", title: "ESCOLHA O JOGO" });
    if (!formData.cliente || !formData.whatsapp || !formData.pixKey) return toast({ variant: "destructive", title: "DADOS INCOMPLETOS" });
    
    const totalVenda = formData.unitario * quantity;
    const finalStatus = payWithBalance ? 'pago' : 'pendente';

    if (payWithBalance && (user?.balance || 0) < totalVenda) {
      return toast({ variant: "destructive", title: "SALDO INSUFICIENTE", description: "Use o modo 'Reserva' ou recarregue." });
    }

    setLoading(true);
    const receiptId = Math.random().toString(36).substring(7).toUpperCase();
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
        s: finalStatus,
        v: 0
      });
    }

    const receipt = {
      id: receiptId,
      evento_id: String(formData.eventoId),
      evento_nome: formData.eventoNome,
      tipo: formData.tipo,
      cliente: formData.cliente.toUpperCase(),
      whatsapp: formData.whatsapp.replace(/\D/g, ''),
      pix_resgate: formData.pixKey, 
      valor_total: totalVenda,
      vendedor_id: user?.id || 'admin-master',
      vendedor_nome: user?.nome || 'Admin',
      gerente_id: user?.gerenteId || null,
      status: finalStatus, 
      tickets_data: ticketsGenerated,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('tickets').insert([receipt]);
      if (error) throw error;

      if (payWithBalance && user) {
        const newBal = user.balance - totalVenda;
        await supabase.from('users').update({ balance: newBal }).eq('id', user.id);
        
        if (user.role === 'cambista') {
          const comCambista = totalVenda * 0.10;
          const updatedComm = (user.commissionBalance || 0) + comCambista;
          await supabase.from('users').update({ commission_balance: updatedComm }).eq('id', user.id);
          if (user.gerenteId) {
            const comGerente = totalVenda * 0.05;
            const { data: gerente } = await supabase.from('users').select('commission_balance').eq('id', user.gerenteId).single();
            if (gerente) await supabase.from('users').update({ commission_balance: Number(gerente.commission_balance || 0) + comGerente }).eq('id', user.gerenteId);
          }
          setUser({ ...user, balance: newBal, commissionBalance: updatedComm });
        } else {
          setUser({ ...user, balance: newBal });
        }
      }

      setVendaRealizada(receipt);
      toast({ title: !payWithBalance ? "RESERVA REALIZADA!" : "COMPRA CONCLUÍDA!" });
      updatePrizes(formData.eventoId, formData.tipo);
      if (user?.role !== 'cliente') setFormData(prev => ({ ...prev, cliente: '', whatsapp: '', pixKey: '' }));
      loadMinhasReservas();
    } catch (err: any) { toast({ variant: "destructive", title: "ERRO NA TRANSAÇÃO" }); }
    finally { setLoading(false); }
  };

  const connectPrinter = async () => {
    if (typeof window === 'undefined' || !navigator.bluetooth) return;
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
      if (writeChar) { setBtDevice(device); setBtCharacteristic(writeChar); toast({ title: "IMPRESSORA CONECTADA!" }); }
    } catch (err: any) { toast({ variant: "destructive", title: "FALHA DE CONEXÃO" }); }
    finally { setBtConnecting(false); }
  };

  const printReceipt = useCallback(async (receipt: any) => {
    if (!btCharacteristic) return;
    try {
      const encoder = new TextEncoder();
      let text = "\x1B\x40\x1B\x61\x01\x1B\x45\x01LEOBET PRO\x1B\x45\x00\nCUPOM OFICIAL AUDITADO\n--------------------------------\n";
      text += `CLIENTE: ${receipt.cliente}\nJOGO: ${receipt.evento_nome}\n--------------------------------\n`;
      receipt.tickets_data.slice(0, 3).forEach((t: any, i: number) => {
        text += `CARTELA #${i+1}\n`;
        if (t.n) text += `DEZ: ${t.n.join(' ')}\n`;
        if (t.p) text += `PALPITE: ${t.p}\n`;
      });
      text += `--------------------------------\nVALOR: R$ ${Number(receipt.valor_total).toFixed(2)}\nCOD: ${receipt.id}\n\x1B\x61\x01BOA SORTE!\n\n\n\n`;
      const data = encoder.encode(text);
      for (let i = 0; i < data.length; i += 20) await btCharacteristic.writeValue(data.slice(i, i + 20));
      toast({ title: "CUPOM IMPRESSO!" });
    } catch (e) { toast({ variant: "destructive", title: "ERRO DE IMPRESSÃO" }); }
  }, [btCharacteristic, toast]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Tabs defaultValue="venda">
            <TabsList className="bg-white p-1 rounded-2xl w-full flex justify-start gap-2 shadow-sm border h-14 overflow-x-auto">
              <TabsTrigger value="venda" className="font-black uppercase text-[10px] rounded-xl px-8">Terminal de Venda</TabsTrigger>
              <TabsTrigger value="reservas" className="font-black uppercase text-[10px] rounded-xl px-8">
                Minhas Reservas {minhasReservas.length > 0 && <span className="ml-2 bg-orange-600 text-white px-2 py-0.5 rounded-full">{minhasReservas.length}</span>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="venda" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white p-4 rounded-3xl shadow-sm border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-3 rounded-2xl", btCharacteristic ? "bg-green-100" : "bg-muted")}>
                        <Bluetooth className={cn("w-6 h-6", btCharacteristic ? "text-green-600" : "text-muted-foreground")} />
                      </div>
                      <div><p className="text-[10px] font-black uppercase text-muted-foreground">Impressora BT</p><p className="text-sm font-black text-primary">{btDevice ? btDevice.name : "OFFLINE"}</p></div>
                    </div>
                    <Button onClick={connectPrinter} disabled={btConnecting} className="h-12 px-6 font-black uppercase text-[10px] rounded-xl text-white bg-primary">
                      {btConnecting ? "..." : (btCharacteristic ? "CONECTADA" : "CONECTAR")}
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
                  <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-xl font-black uppercase text-primary flex items-center gap-2"><ShoppingCart className="w-6 h-6" /> Novo Bilhete</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-4">
                    <form onSubmit={(e) => handleVenda(e)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Cliente</Label><Input value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} placeholder="NOME" className="h-12 font-bold" required disabled={user?.role === 'cliente'} /></div>
                        <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">WhatsApp</Label><Input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="DDD+NUM" className="h-12 font-bold" required disabled={user?.role === 'cliente'} /></div>
                      </div>
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">PIX para Resgate</Label><Input value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} placeholder="CHAVE PARA RECEBER" className="h-12 font-black border-accent/30" required /></div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase opacity-60 flex justify-between items-center"><span>Escolha o Jogo Ativo</span><span className="text-[8px] text-red-600 font-black"><Clock className="w-2 h-2 inline mb-0.5" /> FECHA 1MIN ANTES</span></Label>
                        <select className="w-full h-14 border-2 rounded-xl px-4 font-black text-xs" value={formData.eventoId} onChange={e => handleSelectEvento(e.target.value)} required>
                          <option value="">-- SELECIONE O CONCURSO --</option>
                          {eventosAtivos.map(e => <option key={e.id} value={e.id}>{e.nome} (R$ {Number(e.preco).toFixed(2)})</option>)}
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
                        <Label className="text-[10px] font-black uppercase opacity-60">Quantidade de Bilhetes</Label>
                        <div className="flex items-center gap-4">
                          <Button type="button" variant="outline" className="h-12 w-12 rounded-xl" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus /></Button>
                          <Input type="number" value={quantity} readOnly className="h-12 text-center font-black text-xl" />
                          <Button type="button" variant="outline" className="h-12 w-12 rounded-xl" onClick={() => setQuantity(quantity + 1)}><Plus /></Button>
                        </div>
                      </div>
                      <div className="bg-primary p-6 rounded-3xl text-center shadow-xl"><p className="text-[10px] font-black uppercase text-white/60 mb-1">Total a Pagar</p><p className="text-4xl font-black text-white">R$ {(formData.unitario * quantity).toFixed(2)}</p></div>
                      
                      <div className="flex flex-col gap-2">
                        {user?.balance >= (formData.unitario * quantity) && (
                          <Button type="button" onClick={(e) => handleVenda(e, true)} className="w-full h-16 font-black uppercase bg-accent text-white rounded-2xl shadow-xl" disabled={loading}>
                            {loading ? "PROCESSANDO..." : "CONCLUIR COM SALDO"}
                          </Button>
                        )}
                        <Button type="button" onClick={(e) => handleVenda(e, false)} variant="outline" className="w-full h-14 font-black uppercase border-2 rounded-2xl" disabled={loading}>
                          {loading ? "PROCESSANDO..." : "GERAR RESERVA (PENDENTE)"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {vendaRealizada ? (
                    <div className="bg-[#FFFFF4] p-8 shadow-2xl border font-mono rounded-[2rem] text-center relative">
                       <p className="text-2xl font-black text-primary">LEOBET PRO</p>
                       <div className="my-6 border-y-2 border-dashed border-black/10 py-4 space-y-2 text-xs uppercase font-bold text-left">
                          <p className="flex justify-between"><span>STATUS:</span> <span className={vendaRealizada.status === 'pendente' ? 'text-orange-600' : 'text-green-600'}>{vendaRealizada.status.toUpperCase()}</span></p>
                          <p className="flex justify-between"><span>CLIENTE:</span> <span>{vendaRealizada.cliente}</span></p>
                          <p className="flex justify-between"><span>JOGO:</span> <span>{vendaRealizada.evento_nome}</span></p>
                          <p className="flex justify-between"><span>VALOR:</span> <span>R$ {Number(vendaRealizada.valor_total).toFixed(2)}</span></p>
                          <p className="text-center pt-2 border-t font-black">CÓDIGO: {vendaRealizada.id}</p>
                       </div>
                       <div className="flex gap-2">
                          <Button onClick={() => printReceipt(vendaRealizada)} className="flex-1 h-16 bg-primary font-black uppercase rounded-2xl gap-2 text-white"><Printer className="w-5 h-5" /> Imprimir</Button>
                          <Button onClick={() => {
                            const message = `*LEOBET PRO*%0A%0A🎟️ *BILHETE OFICIAL*%0A🚩 *STATUS:* ${vendaRealizada.status.toUpperCase()}%0A👤 *CLIENTE:* ${vendaRealizada.cliente}%0A🏆 *JOGO:* ${vendaRealizada.evento_nome}%0A💰 *VALOR:* R$ ${Number(vendaRealizada.valor_total).toFixed(2)}%0A%0A*Auditoria:* ${window.location.origin}/resultados?c=${vendaRealizada.id}`;
                            window.open(`https://api.whatsapp.com/send?phone=55${vendaRealizada.whatsapp}&text=${message}`, '_blank');
                          }} className="flex-1 h-16 bg-green-600 hover:bg-green-700 font-black uppercase rounded-2xl gap-2 text-white"><MessageCircle className="w-5 h-5" /> WhatsApp</Button>
                       </div>
                       <Button onClick={() => setVendaRealizada(null)} variant="ghost" className="w-full h-12 font-black uppercase text-[10px] mt-2">Fazer Outra Venda</Button>
                    </div>
                  ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-4 border-dashed rounded-[3rem] opacity-20 bg-white">
                      <ShoppingCart className="w-20 h-20 text-primary mb-4" />
                      <h3 className="text-xl font-black uppercase text-primary">Aguardando Venda...</h3>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reservas" className="mt-6">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {minhasReservas.length === 0 ? (
                    <Card className="col-span-full py-20 text-center border-dashed opacity-30 rounded-[3rem]">
                       <History className="w-12 h-12 mx-auto mb-4" />
                       <p className="font-black uppercase text-xs">Nenhuma reserva pendente encontrada</p>
                    </Card>
                  ) : minhasReservas.map((r, i) => (
                    <Card key={i} className="p-6 rounded-[2rem] border-l-8 border-l-orange-500 shadow-md bg-white">
                       <div className="flex justify-between items-start mb-4">
                          <div>
                             <p className="font-black uppercase text-xs text-primary">{r.cliente}</p>
                             <p className="text-[10px] font-bold text-muted-foreground uppercase">{r.evento_nome}</p>
                          </div>
                          <Badge variant="outline" className="text-[8px] font-black uppercase">PENDENTE</Badge>
                       </div>
                       <div className="bg-muted/30 p-4 rounded-2xl mb-4 text-center">
                          <p className="text-[10px] font-black uppercase opacity-60">Valor da Reserva</p>
                          <p className="text-2xl font-black text-primary">R$ {Number(r.valor_total).toFixed(2)}</p>
                       </div>
                       <Button onClick={() => handlePayReservation(r)} className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] rounded-xl gap-2 shadow-lg transition-all active:scale-95" disabled={loading}>
                          <CheckCircle2 className="w-4 h-4" /> Pagar com Saldo (Abater)
                       </Button>
                    </Card>
                  ))}
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
