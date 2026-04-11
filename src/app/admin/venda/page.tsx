
'use client';

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, 
  Printer,
  Plus,
  Minus,
  MessageCircle,
  Database,
  Clock,
  LayoutGrid,
  Zap,
  Info,
  Trophy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/use-auth-store';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

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
  
  const [formData, setFormData] = useState({ 
    cliente: '', 
    whatsapp: '', 
    pixKey: '',
    eventoId: '', 
    eventoNome: '', 
    tipo: 'bingo' as 'bingo' | 'bolao' | 'mega' | 'quina', 
    unitario: 0 
  });

  const [partidasBolao, setPartidasBolao] = useState<any[]>([]);
  const [palpites, setPalpites] = useState<string[]>([]);
  const [numerosLoteria, setNumerosLoteria] = useState<number[]>([]);
  const [vendaRealizada, setVendaRealizada] = useState<any>(null);
  
  const [openMultiOption, setOpenMultiOption] = useState(false);
  const [pendingPayWithBalance, setPendingPayWithBalance] = useState(false);

  const loadEventos = async () => {
    try {
      const { data: bingos } = await supabase.from('bingos').select('*').eq('status', 'aberto');
      const { data: boloes } = await supabase.from('boloes').select('*').eq('status', 'aberto');
      const now = new Date();
      
      const validBingos = (bingos || []).filter(item => {
        if (!item.data_sorteio) return true;
        const limitTime = new Date(new Date(item.data_sorteio).getTime() - 60000);
        return now < limitTime;
      }).map(b => ({ ...b, tipo: 'bingo' }));

      const validBoloes = (boloes || []).filter(item => {
        const timeField = item.data_fim || item.data_sorteio;
        if (!timeField) return true;
        const limitTime = new Date(new Date(timeField).getTime() - 60000);
        return now < limitTime;
      }).map(b => ({ ...b, tipo: b.tipo || 'esportivo' }));
      
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

  useEffect(() => {
    setMounted(true);
    loadEventos();
    const interval = setInterval(loadEventos, 30000);

    if (user?.role === 'cliente') {
      setFormData(prev => ({ 
        ...prev, 
        cliente: user.nome, 
        whatsapp: user.phone || '', 
        pixKey: user.pixKey || '' 
      }));
    }
    loadMinhasReservas();

    return () => clearInterval(interval);
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

      const { data: tickets } = await supabase.from('tickets').select('valor_total').eq('evento_id', ev.id).in('status', ['pago', 'ganhou', 'premio_pago', 'pendente-resgate']);
      const total = tickets?.reduce((acc, t) => acc + (Number(t.valor_total) || 0), 0) || 0;
      setCurrentPool(total * 0.65);

    } else {
      setSelectedEventData(null);
      setCurrentPool(0);
    }
  };

  const handleLoteriaToggle = (num: number) => {
    const limit = formData.tipo === 'mega' ? 15 : 20;
    if (numerosLoteria.includes(num)) {
      setNumerosLoteria(numerosLoteria.filter(n => n !== num));
    } else if (numerosLoteria.length < limit) {
      setNumerosLoteria([...numerosLoteria, num].sort((a,b) => a-b));
    } else {
      toast({ variant: "destructive", title: `LIMITE ATINGIDO`, description: `O máximo permitido é ${limit} números.` });
    }
  };

  const generateRandomNumbers = (count: number, max: number) => {
    const nums = new Set<number>();
    while(nums.size < count) nums.add(Math.floor(Math.random() * max) + 1);
    return Array.from(nums).sort((a,b) => a-b);
  };

  const generateRandomPicks = (matches: any[]) => {
    return matches.map(m => {
      const opts = [m.time1, 'X', m.time2];
      return opts[Math.floor(Math.random() * 3)];
    }).join('-');
  };

  const finalizeVenda = async (mode: 'repeat' | 'random' = 'repeat') => {
    setOpenMultiOption(false);
    setLoading(true);
    const ticketsGenerated = [];
    const finalStatus = pendingPayWithBalance ? 'pago' : 'pendente';

    let firstLotNums = null;
    if (formData.tipo === 'bingo') firstLotNums = generateRandomNumbers(15, 90);
    else if (formData.tipo === 'mega' || formData.tipo === 'quina') firstLotNums = [...numerosLoteria];

    ticketsGenerated.push({
      id: Math.random().toString(36).substring(7).toUpperCase(),
      n: firstLotNums,
      p: (formData.tipo === 'bolao' || formData.tipo === 'esportivo') ? palpites.join('-') : null,
      status: finalStatus,
      valorPremio: 0
    });

    for (let i = 1; i < quantity; i++) {
      let lotNums = null;
      let pPicks = null;

      if (mode === 'repeat') {
        lotNums = firstLotNums ? [...firstLotNums] : null;
        pPicks = ticketsGenerated[0].p;
      } else {
        if (formData.tipo === 'bingo') lotNums = generateRandomNumbers(15, 90);
        else if (formData.tipo === 'mega') lotNums = generateRandomNumbers(15, 60);
        else if (formData.tipo === 'quina') lotNums = generateRandomNumbers(20, 80);
        
        if (formData.tipo === 'bolao' || formData.tipo === 'esportivo') {
          pPicks = generateRandomPicks(partidasBolao);
        }
      }

      ticketsGenerated.push({
        id: Math.random().toString(36).substring(7).toUpperCase(),
        n: lotNums,
        p: pPicks,
        status: finalStatus,
        valorPremio: 0
      });
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
      status: finalStatus, 
      tickets_data: ticketsGenerated,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('tickets').insert([receipt]);
      if (error) throw error;

      if (pendingPayWithBalance && user) {
        const total = formData.unitario * quantity;
        const currentBal = Number(user.balance || 0);
        const currentComm = Number(user.commissionBalance || 0);
        
        let remaining = total;
        let newComm = currentComm;
        let newBal = currentBal;

        if (newComm >= remaining) { newComm -= remaining; } 
        else { remaining -= newComm; newComm = 0; newBal -= remaining; }

        await supabase.from('users').update({ balance: newBal, commission_balance: newComm }).eq('id', user.id);
      }

      setVendaRealizada({ ...receipt, currentPool });
      toast({ title: "VENDA PROCESSADA!" });
      loadMinhasReservas();
    } catch (err: any) { toast({ variant: "destructive", title: "ERRO NA TRANSAÇÃO" }); }
    finally { setLoading(false); }
  };

  const handleVenda = async (e: React.FormEvent, payWithBalance: boolean = false) => {
    e.preventDefault();
    if (!formData.eventoId) return toast({ variant: "destructive", title: "ESCOLHA O JOGO" });
    if (!formData.cliente || !formData.whatsapp || !formData.pixKey) return toast({ variant: "destructive", title: "DADOS INCOMPLETOS" });
    
    if ((formData.tipo === 'bolao' || formData.tipo === 'esportivo') && palpites.some(p => !p)) {
      return toast({ variant: "destructive", title: "PALPITES INCOMPLETOS", description: "Selecione todos os jogos." });
    }

    const lotLimit = formData.tipo === 'mega' ? 15 : 20;
    if ((formData.tipo === 'mega' || formData.tipo === 'quina') && numerosLoteria.length !== lotLimit) {
      return toast({ 
        variant: "destructive", 
        title: "QUANTIDADE INVÁLIDA", 
        description: `Escolha exatamente ${lotLimit} números.` 
      });
    }

    if (quantity > 1) {
      setPendingPayWithBalance(payWithBalance);
      setOpenMultiOption(true);
    } else {
      setPendingPayWithBalance(payWithBalance);
      finalizeVenda('repeat');
    }
  };

  const shareReceipt = (receipt: any) => {
    let msg = `*LEOBET PRO - RECIBO*%0A%0A*CLIENTE:* ${receipt.cliente}%0A*VALOR:* R$ ${Number(receipt.valor_total).toFixed(2)}%0A*PRÊMIO ATUAL:* R$ ${currentPool.toFixed(2)}%0A%0A*Confira sua aposta:*%0A${window.location.origin}/resultados?c=${receipt.id}`;
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
  };

  if (!mounted) return null;

  const userTotalBalance = (Number(user?.balance) || 0) + (Number(user?.commissionBalance) || 0);
  const totalPurchase = formData.unitario * quantity;
  const canPayWithBalance = userTotalBalance >= totalPurchase && totalPurchase > 0;

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
                  <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-xl font-black uppercase text-primary flex items-center gap-2"><ShoppingCart className="w-6 h-6" /> Novo Bilhete</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-4">
                    <form onSubmit={(e) => handleVenda(e)} className="space-y-4">
                      {selectedEventData && (
                        <div className="bg-primary/5 p-4 rounded-2xl border-2 border-primary/10 flex justify-between items-center">
                           <div><p className="text-[10px] font-black uppercase opacity-60">Prêmio Acumulado (65%)</p><p className="text-2xl font-black text-primary">R$ {currentPool.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
                           <Badge className="bg-primary text-white h-8 px-4 font-black uppercase text-[9px]">Live Pool</Badge>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Cliente</Label><Input value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} placeholder="NOME" className="h-12 font-bold uppercase" required disabled={user?.role === 'cliente'} /></div>
                        <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">WhatsApp</Label><Input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="DDD+NUM" className="h-12 font-bold" required disabled={user?.role === 'cliente'} /></div>
                      </div>
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">PIX para Resgate</Label><Input value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} placeholder="CHAVE PIX" className="h-12 font-black border-accent/30 uppercase" required /></div>
                      
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase opacity-60">Escolha o Concurso</Label>
                        <select className="w-full h-14 border-2 rounded-xl px-4 font-black text-xs" value={formData.eventoId} onChange={e => handleSelectEvento(e.target.value)} required>
                          <option value="">-- SELECIONE --</option>
                          {eventosAtivos.map(e => <option key={e.id} value={e.id}>{e.nome} ({e.tipo.toUpperCase()}) - R$ {Number(e.preco).toFixed(2)}</option>)}
                        </select>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-[8px] font-bold text-orange-600 uppercase flex items-center gap-1"><Clock className="w-2 h-2" /> 1 minuto antes.</p>
                          {selectedEventData && (
                            <Dialog><DialogTrigger asChild><Button variant="link" className="h-4 p-0 text-[9px] font-black uppercase text-primary flex items-center gap-1"><Info className="w-3 h-3" /> Regras</Button></DialogTrigger>
                              <DialogContent className="bg-white rounded-[2rem]"><DialogHeader><DialogTitle className="font-black uppercase text-primary">Regras: {selectedEventData.nome}</DialogTitle></DialogHeader>
                                <div className="p-4 bg-muted/30 rounded-2xl text-xs font-bold leading-relaxed whitespace-pre-line">{selectedEventData.regras || 'Rateio de 65% para os vencedores.'}</div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>

                      {(formData.tipo === 'mega' || formData.tipo === 'quina') && (
                        <div className="space-y-4 pt-4 border-t">
                           <div className="flex justify-between items-center">
                              <Badge className={cn("h-8 px-4 font-black uppercase text-[10px]", numerosLoteria.length === (formData.tipo === 'mega' ? 15 : 20) ? "bg-green-600" : "bg-primary")}>
                                {numerosLoteria.length} / {formData.tipo === 'mega' ? '15' : '20'} MARCADO
                              </Badge>
                              <Button type="button" onClick={() => setNumerosLoteria(generateRandomNumbers(formData.tipo === 'mega' ? 15 : 20, formData.tipo === 'mega' ? 60 : 80))} variant="outline" className="h-8 gap-2 font-black uppercase text-[10px] rounded-lg border-accent text-accent"><Zap className="w-3 h-3" /> Automático</Button>
                           </div>
                           <div className="grid grid-cols-6 sm:grid-cols-10 gap-1 max-h-60 overflow-y-auto p-2 border rounded-2xl bg-muted/10">
                              {Array.from({ length: formData.tipo === 'mega' ? 60 : 80 }).map((_, i) => {
                                const n = i + 1; const isSel = numerosLoteria.includes(n);
                                return (
                                  <button key={n} type="button" onClick={() => handleLoteriaToggle(n)} className={cn("h-8 rounded-lg flex items-center justify-center font-black text-[10px] transition-all", isSel ? "bg-accent text-white scale-110 shadow-lg" : "bg-white border")}>{n < 10 ? `0${n}` : n}</button>
                                );
                              })}
                           </div>
                        </div>
                      )}

                      {(formData.tipo === 'bolao' || formData.tipo === 'esportivo') && (
                        <div className="space-y-2 pt-4 border-t max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                           {partidasBolao.map((p, idx) => (
                             <div key={idx} className="bg-muted/30 p-2 rounded-xl border flex justify-between items-center gap-2">
                                <p className="text-[8px] font-black uppercase w-20 truncate">{p.time1} vs {p.time2}</p>
                                <div className="flex gap-1">
                                   {['1', 'X', '2'].map(c => {
                                     const val = c === '1' ? p.time1 : c === '2' ? p.time2 : 'X';
                                     return (<Button key={c} type="button" variant={palpites[idx] === val ? 'default' : 'outline'} className="h-8 w-8 p-0 text-[10px] font-black" onClick={() => { const newP = [...palpites]; newP[idx] = val; setPalpites(newP); }}>{c}</Button>);
                                   })}
                                </div>
                             </div>
                           ))}
                        </div>
                      )}

                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase opacity-60">Qtd Bilhetes</Label>
                        <div className="flex items-center gap-4">
                          <Button type="button" variant="outline" className="h-12 w-12 rounded-xl" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus /></Button>
                          <Input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} className="h-12 text-center font-black text-xl border-2" />
                          <Button type="button" variant="outline" className="h-12 w-12 rounded-xl" onClick={() => setQuantity(quantity + 1)}><Plus /></Button>
                        </div>
                      </div>

                      <div className="bg-primary p-6 rounded-3xl text-center shadow-xl">
                        <p className="text-4xl font-black text-white">R$ {totalPurchase.toFixed(2)}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {canPayWithBalance && (
                          <Button type="button" onClick={(e) => handleVenda(e, true)} className="w-full h-16 font-black uppercase bg-green-600 text-white rounded-2xl shadow-xl border-4 border-white/20">CONCLUIR COM SALDO</Button>
                        )}
                        {(user?.role === 'admin' || !canPayWithBalance) && (
                          <Button type="submit" variant="outline" className="w-full h-16 font-black uppercase border-primary text-primary rounded-2xl">GERAR RESERVA (PENDENTE)</Button>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {vendaRealizada ? (
                    <div className="bg-[#FFFFF4] p-8 shadow-2xl border font-mono rounded-[2rem] text-center print:border-none print:shadow-none print:p-0 overflow-y-auto max-h-[80vh]">
                       <p className="text-2xl font-black text-primary">LEOBET PRO</p>
                       <p className="text-[10px] font-black uppercase">Cupom Oficial</p>
                       <div className="my-6 border-y-2 border-dashed border-black/10 py-4 space-y-2 text-xs uppercase font-bold text-left">
                          <p className="flex justify-between"><span>CLIENTE:</span> <span>{vendaRealizada.cliente}</span></p>
                          <p className="flex justify-between"><span>JOGO:</span> <span>{vendaRealizada.evento_nome}</span></p>
                          <p className="flex justify-between font-black border-t pt-2"><span>PRÊMIO ATUAL:</span> <span>R$ {currentPool.toFixed(2)}</span></p>
                          <div className="pt-2 mt-2 border-t border-dashed space-y-4">
                             {vendaRealizada.tickets_data.map((t: any, idx: number) => (
                               <div key={idx} className="p-2 border rounded bg-white/50">
                                  <p className="font-black text-[9px] mb-1">BILHETE #{idx + 1}:</p>
                                  {t.p ? <div className="space-y-0.5">{t.p.split('-').map((pal: string, pi: number) => (<p key={pi} className="text-[8px]">{partidasBolao[pi]?.time1} x {partidasBolao[pi]?.time2} = {pal}</p>))}</div> : null}
                                  {t.n ? <p className="text-[8px]">NÚMEROS: {t.n.join(', ')}</p> : null}
                               </div>
                             ))}
                          </div>
                          <p className="text-center pt-2 border-t font-black">CÓDIGO: {vendaRealizada.id}</p>
                       </div>
                       <div className="space-y-2 print:hidden">
                          <Button onClick={() => shareReceipt(vendaRealizada)} className="w-full h-14 bg-green-600 text-white font-black uppercase rounded-xl gap-2"><MessageCircle /> Enviar WhatsApp</Button>
                          <Button onClick={() => window.print()} variant="outline" className="w-full h-14 border-2 font-black uppercase rounded-xl gap-2"><Printer /> Imprimir Bilhete</Button>
                          <Button onClick={() => setVendaRealizada(null)} variant="ghost" className="w-full h-12 font-black uppercase text-[10px]">Nova Venda</Button>
                       </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-4 border-dashed rounded-[3rem] opacity-20 bg-white print:hidden">
                      <LayoutGrid className="w-20 h-20 text-primary mb-4" />
                      <h3 className="text-xl font-black uppercase text-primary">Aguardando Seleção...</h3>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reservas" className="mt-6 space-y-4">
               {minhasReservas.length === 0 ? (
                 <div className="py-20 text-center opacity-30 font-black uppercase text-xs">Sem reservas pendentes</div>
               ) : minhasReservas.map((res, i) => (
                 <Card key={i} className="p-6 rounded-3xl border-l-8 border-l-orange-500 shadow-md bg-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div><p className="font-black uppercase text-primary">{res.cliente}</p><p className="text-[10px] font-bold text-muted-foreground uppercase">{res.evento_nome} • R$ {Number(res.valor_total).toFixed(2)}</p></div>
                    {userTotalBalance >= Number(res.valor_total) ? (
                      <Button onClick={async () => { setLoading(true); try { await supabase.from('tickets').update({ status: 'pago' }).eq('id', res.id); toast({ title: "BILHETE PAGO!" }); loadMinhasReservas(); } catch (e) {} finally { setLoading(false); } }} className="bg-green-600 h-12 font-black uppercase rounded-xl">Pagar com Saldo</Button>
                    ) : <Badge variant="outline" className="text-orange-600 border-orange-200 uppercase font-black">Aguardando Admin</Badge>}
                 </Card>
               ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={openMultiOption} onOpenChange={setOpenMultiOption}>
        <DialogContent className="bg-white rounded-[2rem] max-w-sm">
          <DialogHeader><DialogTitle className="font-black uppercase text-primary text-center">Configurar {quantity} Apostas</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-xs font-bold text-center text-muted-foreground">Deseja repetir a escolha ou gerar novos?</p>
            <Button onClick={() => finalizeVenda('repeat')} className="w-full h-14 font-black uppercase rounded-xl border-2 border-primary text-primary" variant="outline">Repetir Bilhete Atual</Button>
            <Button onClick={() => finalizeVenda('random')} className="w-full h-14 font-black uppercase bg-primary text-white rounded-xl">Gerar Aleatórios (Surpresinha)</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
