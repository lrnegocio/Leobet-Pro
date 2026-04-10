
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
  LayoutGrid,
  Zap,
  CheckCircle2
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
  
  const [selectedEventData, setSelectedEventData] = useState<any>(null);
  
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

  const loadEventos = async () => {
    try {
      const { data: bingos } = await supabase.from('bingos').select('*').eq('status', 'aberto');
      const { data: boloes } = await supabase.from('boloes').select('*').eq('status', 'aberto');
      const now = new Date();
      
      // REGRA: Encerra 1 minuto (60000ms) antes do sorteio
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
      }).map(b => ({ ...b, tipo: b.tipo || 'bolao' }));
      
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
    
    // Atualiza a lista a cada 30 segundos para respeitar a trava de 1 minuto
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

  const handleSelectEvento = (eventId: string) => {
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
    }
  };

  const handleLoteriaToggle = (num: number) => {
    const limit = formData.tipo === 'mega' ? 15 : 20;
    if (numerosLoteria.includes(num)) {
      setNumerosLoteria(numerosLoteria.filter(n => n !== num));
    } else if (numerosLoteria.length < limit) {
      setNumerosLoteria([...numerosLoteria, num].sort((a,b) => a-b));
    } else {
      toast({ variant: "destructive", title: `MÁXIMO ${limit} NÚMEROS` });
    }
  };

  const handleSurpresinha = () => {
    const limit = formData.tipo === 'mega' ? 15 : 20;
    const total = formData.tipo === 'mega' ? 60 : 80;
    const nums = new Set<number>();
    while(nums.size < limit) nums.add(Math.floor(Math.random() * total) + 1);
    setNumerosLoteria(Array.from(nums).sort((a,b) => a-b));
  };

  const handleVenda = async (e: React.FormEvent, payWithBalance: boolean = false) => {
    e.preventDefault();
    if (!formData.eventoId) return toast({ variant: "destructive", title: "ESCOLHA O JOGO" });
    if (!formData.cliente || !formData.whatsapp || !formData.pixKey) return toast({ variant: "destructive", title: "DADOS INCOMPLETOS" });
    
    if ((formData.tipo === 'bolao' || formData.tipo === 'esportivo') && palpites.some(p => !p)) {
      return toast({ variant: "destructive", title: "MARQUE TODOS OS JOGOS" });
    }
    const lotLimit = formData.tipo === 'mega' ? 15 : 20;
    if ((formData.tipo === 'mega' || formData.tipo === 'quina') && numerosLoteria.length < lotLimit) {
      return toast({ variant: "destructive", title: `ESCOLHA OS ${lotLimit} NÚMEROS` });
    }

    setLoading(true);
    const ticketsGenerated = [];
    const finalStatus = payWithBalance ? 'pago' : 'pendente';

    for (let i = 0; i < quantity; i++) {
      let lotNums = null;
      if (formData.tipo === 'bingo') {
        const nums = new Set<number>();
        while(nums.size < 15) nums.add(Math.floor(Math.random() * 90) + 1);
        lotNums = Array.from(nums).sort((a,b) => a-b);
      } else if (formData.tipo === 'mega' || formData.tipo === 'quina') {
        lotNums = numerosLoteria;
      }

      ticketsGenerated.push({
        id: Math.random().toString(36).substring(7).toUpperCase(),
        n: lotNums,
        p: (formData.tipo === 'bolao' || formData.tipo === 'esportivo') ? palpites.join('-') : null,
        s: finalStatus,
        v: 0
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

      if (payWithBalance && user) {
        const total = formData.unitario * quantity;
        const currentBal = Number(user.balance || 0);
        const currentComm = Number(user.commissionBalance || 0);
        
        let remaining = total;
        let newComm = currentComm;
        let newBal = currentBal;

        if (newComm >= remaining) { newComm -= remaining; } 
        else { remaining -= newComm; newComm = 0; newBal -= remaining; }

        await supabase.from('users').update({ balance: newBal, commission_balance: newComm }).eq('id', user.id);
        
        const comCambista = total * 0.10;
        await supabase.from('users').update({ commission_balance: newComm + comCambista }).eq('id', user.id);
        
        if (user.gerenteId) {
          const comGerente = total * 0.05;
          const { data: gData } = await supabase.from('users').select('commission_balance').eq('id', user.gerenteId).single();
          if (gData) await supabase.from('users').update({ commission_balance: Number(gData.commission_balance || 0) + comGerente }).eq('id', user.gerenteId);
        }
      }

      setVendaRealizada(receipt);
      toast({ title: "VENDA PROCESSADA!" });
      loadMinhasReservas();
    } catch (err: any) { toast({ variant: "destructive", title: "ERRO NA TRANSAÇÃO" }); }
    finally { setLoading(false); }
  };

  const shareReceipt = (receipt: any) => {
    let msg = `*LEOBET PRO - RECIBO*%0A%0A*CLIENTE:* ${receipt.cliente}%0A*CÓDIGO:* ${receipt.id}%0A*VALOR:* R$ ${Number(receipt.valor_total).toFixed(2)}%0A%0A`;
    
    if (receipt.tipo === 'bolao' || receipt.tipo === 'esportivo') {
      const pArr = receipt.tickets_data[0].p.split('-');
      msg += `*PALPITES DO BOLÃO:*%0A`;
      partidasBolao.forEach((match, i) => {
        msg += `⚽ ${match.time1} x ${match.time2} = ${pArr[i]}%0A`;
      });
    } else if (receipt.tipo === 'mega' || receipt.tipo === 'quina') {
      msg += `*NÚMEROS ESCOLHIDOS:*%0A`;
      msg += `🔢 ${receipt.tickets_data[0].n.join(', ')}%0A`;
    } else {
      msg += `🎟️ ${receipt.evento_nome}%0A`;
      if (receipt.tickets_data[0].n) {
        msg += `🔢 NÚMEROS: ${receipt.tickets_data[0].n.join(', ')}`;
      }
    }
    
    msg += `%0A%0A*Confira sua aposta:*%0A${window.location.origin}/resultados?c=${receipt.id}`;
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
            <TabsList className="bg-white p-1 rounded-2xl w-full flex justify-start gap-2 shadow-sm border h-14 overflow-x-auto">
              <TabsTrigger value="venda" className="font-black uppercase text-[10px] rounded-xl px-8">Vendas</TabsTrigger>
              <TabsTrigger value="reservas" className="font-black uppercase text-[10px] rounded-xl px-8">Minhas Reservas</TabsTrigger>
            </TabsList>

            <TabsContent value="venda" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                <Card className="rounded-[2.5rem] shadow-2xl bg-white border-t-8 border-primary">
                  <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-xl font-black uppercase text-primary flex items-center gap-2"><ShoppingCart className="w-6 h-6" /> Novo Bilhete</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-4">
                    <form onSubmit={(e) => handleVenda(e)} className="space-y-4">
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
                        <p className="text-[8px] font-bold text-orange-600 uppercase mt-1">Vendas encerram 1 minuto antes do sorteio.</p>
                      </div>

                      {(formData.tipo === 'mega' || formData.tipo === 'quina') && (
                        <div className="space-y-4 pt-4 border-t">
                           <div className="flex justify-between items-center">
                              <Badge className="bg-primary h-8 px-4 font-black uppercase text-[10px]">Escolha {formData.tipo === 'mega' ? '15 de 60' : '20 de 80'}</Badge>
                              <Button type="button" onClick={handleSurpresinha} variant="outline" className="h-8 gap-2 font-black uppercase text-[10px] rounded-lg border-accent text-accent">
                                 <Zap className="w-3 h-3" /> Automático
                              </Button>
                           </div>
                           <div className="grid grid-cols-6 sm:grid-cols-10 gap-1 max-h-60 overflow-y-auto p-2 border rounded-2xl bg-muted/10 custom-scrollbar">
                              {Array.from({ length: formData.tipo === 'mega' ? 60 : 80 }).map((_, i) => {
                                const n = i + 1;
                                const isSel = numerosLoteria.includes(n);
                                return (
                                  <button key={n} type="button" onClick={() => handleLoteriaToggle(n)} className={cn(
                                    "h-8 rounded-lg flex items-center justify-center font-black text-[10px] transition-all",
                                    isSel ? "bg-accent text-white scale-110 shadow-lg" : "bg-white border hover:bg-muted"
                                  )}>{n < 10 ? `0${n}` : n}</button>
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
                                     const result = c === '1' ? p.time1 : c === '2' ? p.time2 : 'X';
                                     return (
                                       <Button key={c} type="button" variant={palpites[idx] === result ? 'default' : 'outline'} className="h-8 w-8 p-0 text-[10px] font-black" onClick={() => {
                                         const newP = [...palpites]; newP[idx] = result; setPalpites(newP);
                                       }}>{c}</Button>
                                     );
                                   })}
                                </div>
                             </div>
                           ))}
                        </div>
                      )}

                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase opacity-60">Quantidade de Bilhetes</Label>
                        <div className="flex items-center gap-4">
                          <Button type="button" variant="outline" className="h-12 w-12 rounded-xl" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus /></Button>
                          <Input 
                            type="number" 
                            value={quantity} 
                            onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} 
                            className="h-12 text-center font-black text-xl border-2" 
                          />
                          <Button type="button" variant="outline" className="h-12 w-12 rounded-xl" onClick={() => setQuantity(quantity + 1)}><Plus /></Button>
                        </div>
                      </div>

                      <div className="bg-primary p-6 rounded-3xl text-center shadow-xl">
                        <p className="text-[10px] font-black uppercase text-white/60 mb-1">Total a Pagar</p>
                        <p className="text-4xl font-black text-white">R$ {totalPurchase.toFixed(2)}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {canPayWithBalance && (
                          <Button type="button" onClick={(e) => handleVenda(e, true)} className="w-full h-16 font-black uppercase bg-green-600 text-white rounded-2xl shadow-xl border-4 border-white/20" disabled={loading}>
                            CONCLUIR COM SALDO
                          </Button>
                        )}
                        
                        {(user?.role === 'admin' || !canPayWithBalance) && (
                          <Button type="submit" variant="outline" className="w-full h-16 font-black uppercase border-primary text-primary rounded-2xl" disabled={loading}>
                            GERAR RESERVA (PENDENTE)
                          </Button>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {vendaRealizada ? (
                    <div className="bg-[#FFFFF4] p-8 shadow-2xl border font-mono rounded-[2rem] text-center">
                       <p className="text-2xl font-black text-primary">LEOBET PRO</p>
                       <p className="text-[10px] font-black uppercase tracking-widest">Cupom Oficial</p>
                       <div className="my-6 border-y-2 border-dashed border-black/10 py-4 space-y-2 text-xs uppercase font-bold text-left">
                          <p className="flex justify-between"><span>STATUS:</span> <span className={vendaRealizada.status === 'pago' ? "text-green-600" : "text-orange-600"}>{vendaRealizada.status.toUpperCase()}</span></p>
                          <p className="flex justify-between"><span>CLIENTE:</span> <span>{vendaRealizada.cliente}</span></p>
                          <p className="flex justify-between"><span>JOGO:</span> <span>{vendaRealizada.evento_nome}</span></p>
                          <p className="flex justify-between"><span>TIPO:</span> <span>{vendaRealizada.tipo.toUpperCase()}</span></p>
                          
                          <div className="pt-2 mt-2 border-t border-dashed">
                             {vendaRealizada.tickets_data[0].p && (
                                <div className="space-y-1">
                                   <p className="font-black text-[8px]">PALPITES:</p>
                                   {vendaRealizada.tickets_data[0].p.split('-').map((pal: string, pi: number) => (
                                      <p key={pi} className="text-[9px]">{partidasBolao[pi]?.time1} x {partidasBolao[pi]?.time2} = {pal}</p>
                                   ))}
                                </div>
                             )}
                             {vendaRealizada.tickets_data[0].n && (
                                <p className="text-[9px]">NÚMEROS: {vendaRealizada.tickets_data[0].n.join(', ')}</p>
                             )}
                          </div>

                          <p className="text-center pt-2 border-t font-black">CÓDIGO: {vendaRealizada.id}</p>
                       </div>
                       <Button onClick={() => shareReceipt(vendaRealizada)} className="w-full h-14 bg-green-600 text-white font-black uppercase rounded-xl mb-2 gap-2"><MessageCircle /> Enviar WhatsApp</Button>
                       <Button onClick={() => setVendaRealizada(null)} variant="ghost" className="w-full h-12 font-black uppercase text-[10px]">Nova Venda</Button>
                    </div>
                  ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-4 border-dashed rounded-[3rem] opacity-20 bg-white">
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
                    <div>
                       <p className="font-black uppercase text-primary">{res.cliente}</p>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">{res.evento_nome} • R$ {Number(res.valor_total).toFixed(2)}</p>
                    </div>
                    {((Number(user?.balance) || 0) + (Number(user?.commissionBalance) || 0)) >= Number(res.valor_total) ? (
                      <Button onClick={async () => {
                        setLoading(true);
                        try {
                          const { error } = await supabase.from('tickets').update({ status: 'pago' }).eq('id', res.id);
                          if (error) throw error;
                          toast({ title: "BILHETE PAGO COM SALDO!" });
                          loadMinhasReservas();
                        } catch (e) {} finally { setLoading(false); }
                      }} className="bg-green-600 h-12 font-black uppercase rounded-xl">Pagar com Saldo</Button>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-200 uppercase font-black">Aguardando Admin</Badge>
                    )}
                 </Card>
               ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
