
'use client';

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Printer, Plus, Minus, Ticket, AlertCircle, QrCode, Copy, Loader2, CheckCircle2, LayoutGrid } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/use-auth-store';
import { supabase } from '@/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { createPixPayment } from '@/app/actions/mercadopago';

const ANIMAIS_FAZENDINHA = [
  "AVESTRUZ", "ÁGUIA", "BURRO", "BORBOLETA", "CACHORRO", "CABRA", "CARNEIRO", "CAMELO", "COBRA", "COELHO",
  "CAVALO", "ELEFANTE", "GALO", "GATO", "JACARÉ", "LEÃO", "MACACO", "PORCO", "PAVÃO", "PERU", "TOURO", "TIGRE", "URSO", "VEADO", "VACA"
];

export default function VendaPage() {
  const { toast } = useToast();
  const { user, setUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventosAtivos, setEventosAtivos] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedEventData, setSelectedEventData] = useState<any>(null);
  const [isManualPending, setIsManualPending] = useState(false);
  
  // Estados para escolhas do cliente
  const [palpitesBolao, setPalpitesBolao] = useState<string[]>([]);
  const [numerosSelecionados, setNumerosSelecionados] = useState<number[]>([]);
  const [checkoutPix, setCheckoutPix] = useState<{ qr_code: string, qr_code_base64: string } | null>(null);

  const [formData, setFormData] = useState({ 
    cliente: '', 
    whatsapp: '', 
    pixKey: '', 
    eventoId: '', 
    eventoNome: '', 
    tipo: 'bingo' as any, 
    unitario: 0 
  });
  
  const [vendaRealizada, setVendaRealizada] = useState<any>(null);

  const loadEventos = async () => {
    try {
      const { data: bingos } = await supabase.from('bingos').select('*').eq('status', 'aberto');
      const { data: boloes } = await supabase.from('boloes').select('*').eq('status', 'aberto');
      const { data: rifas } = await supabase.from('rifas').select('*').eq('status', 'aberto');
      const now = new Date();
      
      const validBingos = (bingos || []).filter(item => now < new Date(new Date(item.data_sorteio).getTime() - 60000)).map(b => ({ ...b, tipo: 'bingo' }));
      const validBoloes = (boloes || []).filter(item => now < new Date(new Date(item.data_fim).getTime() - 60000)).map(b => ({ ...b, tipo: b.tipo || 'esportivo' }));
      const validRifas = (rifas || []).map(r => ({ ...r, tipo: 'rifa' }));
      
      setEventosAtivos([...validBingos, ...validBoloes, ...validRifas]);
    } catch (err) { console.warn(err); }
  };

  useEffect(() => {
    setMounted(true);
    loadEventos();
  }, []);

  const handleSelectEvento = (eventId: string) => {
    const ev = eventosAtivos.find(e => e.id === eventId);
    if (ev) {
      setSelectedEventData(ev);
      setFormData({ 
        ...formData, 
        eventoId: ev.id, 
        eventoNome: ev.nome, 
        unitario: Number(ev.preco), 
        tipo: ev.tipo 
      });
      setNumerosSelecionados([]);
      if (ev.partidas) {
        setPalpitesBolao(new Array(ev.partidas.length).fill(''));
      } else {
        setPalpitesBolao([]);
      }
    } else {
      setSelectedEventData(null);
      setPalpitesBolao([]);
      setNumerosSelecionados([]);
    }
  };

  const handleToggleNumero = (num: number) => {
    if (numerosSelecionados.includes(num)) {
      setNumerosSelecionados(numerosSelecionados.filter(n => n !== num));
    } else {
      const limit = formData.tipo === 'mega' ? 15 : (formData.tipo === 'quina' ? 20 : 1);
      if (numerosSelecionados.length >= limit && formData.tipo !== 'rifa') {
        return toast({ variant: "destructive", title: "LIMITE", description: `Máximo ${limit} números.` });
      }
      if (formData.tipo === 'rifa') {
        setNumerosSelecionados([num]);
      } else {
        setNumerosSelecionados([...numerosSelecionados, num].sort((a,b) => a-b));
      }
    }
  };

  const finalizeVenda = async () => {
    if (!user) return;
    
    if (formData.tipo === 'esportivo' && palpitesBolao.some(p => !p)) {
      return toast({ variant: "destructive", title: "PALPITES INCOMPLETOS" });
    }
    if ((formData.tipo === 'mega' || formData.tipo === 'quina') && numerosSelecionados.length === 0) {
      return toast({ variant: "destructive", title: "ESCOLHA OS NÚMEROS" });
    }

    setLoading(true);
    const totalVenda = formData.unitario * quantity;
    const totalBalance = (Number(user.balance) || 0) + (Number(user.commissionBalance) || 0);
    
    if (totalBalance < totalVenda && user.role !== 'admin' && !isManualPending) {
      try {
        const pix = await createPixPayment(totalVenda, { id: user.id, email: user.email, nome: user.nome });
        setCheckoutPix(pix as any);
      } catch (e) {
        toast({ variant: "destructive", title: "ERRO AO GERAR PIX" });
      } finally { setLoading(false); }
      return;
    }

    const shouldBePaid = (totalBalance >= totalVenda && !isManualPending) || user.role === 'admin';
    const ticketsGenerated = [];

    for (let i = 0; i < quantity; i++) {
      let n = null; let p = null;
      if (formData.tipo === 'bingo') {
        n = []; while(n.length < 15) { const num = Math.floor(Math.random() * 90) + 1; if(!n.includes(num)) n.push(num); }
      } else if (formData.tipo === 'rifa') {
         n = numerosSelecionados.length > 0 ? [numerosSelecionados[0]] : [Math.floor(Math.random() * (selectedEventData?.total_numeros || 100)) + 1];
      } else if (formData.tipo === 'mega' || formData.tipo === 'quina') {
         n = [...numerosSelecionados];
      } else if (formData.tipo === 'esportivo') {
         p = palpitesBolao.join('-');
      }
      ticketsGenerated.push({ id: Math.random().toString(36).substring(7).toUpperCase(), n, p, status: shouldBePaid ? 'pago' : 'pendente' });
    }

    const receipt = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      evento_id: String(formData.eventoId),
      evento_nome: formData.eventoNome,
      tipo: formData.tipo,
      cliente: formData.cliente.toUpperCase(),
      whatsapp: formData.whatsapp.replace(/\D/g, ''),
      pix_resgate: formData.pixKey.toUpperCase(),
      valor_total: totalVenda,
      vendedor_id: user.id,
      vendedor_nome: user.nome,
      status: shouldBePaid ? 'pago' : 'pendente',
      tickets_data: ticketsGenerated,
      created_at: new Date().toISOString()
    };

    try {
      if (shouldBePaid && user.id !== 'MASTER-ADMIN') {
        const { data: userData } = await supabase.from('users').select('balance, commission_balance').eq('id', user.id).single();
        if (userData) {
           let rem = totalVenda; let newComm = Number(userData.commission_balance || 0); let newBal = Number(userData.balance || 0);
           if (newComm >= rem) { newComm -= rem; rem = 0; } else { rem -= newComm; newComm = 0; newBal -= rem; }
           await supabase.from('users').update({ balance: newBal, commission_balance: newComm }).eq('id', user.id);
           setUser({ ...user, balance: newBal, commissionBalance: newComm });
        }
      }
      await supabase.from('tickets').insert([receipt]);
      setVendaRealizada(receipt);
      toast({ title: shouldBePaid ? "BILHETE VALIDADO!" : "BILHETE PENDENTE!" });
    } catch (err: any) { toast({ variant: "destructive", title: "ERRO AO SALVAR VENDA" }); } 
    finally { setLoading(false); }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
            <Card className="rounded-[2.5rem] shadow-2xl bg-white border-t-8 border-primary print:hidden overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black uppercase text-primary flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" /> Terminal de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                {checkoutPix ? (
                   <div className="space-y-6 text-center py-4">
                      <p className="text-sm font-black uppercase text-orange-600">Pague o PIX para validar:</p>
                      <div className="bg-white p-4 rounded-3xl border-2 border-primary/20 inline-block">
                         <img src={`data:image/png;base64,${checkoutPix.qr_code_base64}`} className="w-48 h-48" alt="Pix" />
                      </div>
                      <Button onClick={() => { navigator.clipboard.writeText(checkoutPix.qr_code); toast({ title: "COPIADO!" }); }} variant="outline" className="w-full h-12 rounded-xl gap-2 font-black uppercase text-xs">
                        <Copy className="w-4 h-4" /> Copiar Código PIX
                      </Button>
                      <Button onClick={() => setCheckoutPix(null)} variant="ghost" className="w-full text-[10px] font-black uppercase">Cancelar</Button>
                   </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); if (!formData.eventoId) return toast({ variant: "destructive", title: "ESCOLHA O JOGO" }); finalizeVenda(); }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Cliente</Label><Input value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} placeholder="NOME DO CLIENTE" className="h-12 font-bold uppercase" required /></div>
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">WhatsApp</Label><Input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="DDD + NÚMERO" className="h-12 font-bold" required /></div>
                    </div>
                    <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">PIX de Resgate</Label><Input value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} placeholder="CHAVE PIX" className="h-12 font-black uppercase border-accent/30" required /></div>
                    
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase opacity-60">Concurso Oficial</Label>
                      <select className="w-full h-14 border-2 rounded-xl px-4 font-black text-xs bg-white" value={formData.eventoId} onChange={e => handleSelectEvento(e.target.value)} required>
                        <option value="">-- SELECIONE O CONCURSO --</option>
                        {eventosAtivos.map(e => <option key={e.id} value={e.id}>{e.nome} - R$ {Number(e.preco).toFixed(2)}</option>)}
                      </select>
                    </div>

                    {/* SELETORES DE BOLÃO / RIFA */}
                    {selectedEventData && (
                      <div className="p-4 bg-muted/40 rounded-[2rem] border-2 border-dashed space-y-4">
                        {formData.tipo === 'esportivo' && selectedEventData.partidas && (
                           <div className="space-y-2">
                             <p className="text-[9px] font-black uppercase text-primary">Marque os Palpites:</p>
                             {selectedEventData.partidas.map((p: any, idx: number) => (
                               <div key={idx} className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border">
                                  <span className="text-[9px] font-black uppercase flex-1 truncate">{p.time1} vs {p.time2}</span>
                                  <div className="flex gap-1">
                                     {['1', 'X', '2'].map((c) => (
                                       <button key={c} type="button" onClick={() => { const nP = [...palpitesBolao]; nP[idx] = c; setPalpitesBolao(nP); }} className={cn("w-8 h-8 rounded-lg font-black text-xs", palpitesBolao[idx] === c ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                                         {c === '1' ? 'M' : c === '2' ? 'V' : 'E'}
                                       </button>
                                     ))}
                                  </div>
                               </div>
                             ))}
                           </div>
                        )}

                        {(formData.tipo === 'mega' || formData.tipo === 'quina' || formData.tipo === 'rifa') && (
                           <div className="space-y-3">
                             <div className="flex justify-between items-center">
                               <p className="text-[9px] font-black uppercase text-primary">{formData.tipo === 'rifa' ? 'Escolha sua Cota:' : 'Escolha suas Dezenas:'}</p>
                               <Badge className="text-[9px] bg-primary">{numerosSelecionados.length} SELECIONADOS</Badge>
                             </div>
                             <div className="grid grid-cols-6 md:grid-cols-10 gap-1 h-48 overflow-y-auto custom-scrollbar p-2 bg-white rounded-xl border">
                                {Array.from({ length: formData.tipo === 'mega' ? 60 : (formData.tipo === 'quina' ? 80 : (selectedEventData?.total_numeros || 100)) }).map((_, i) => {
                                  const n = i + 1; const isS = numerosSelecionados.includes(n);
                                  return (
                                    <button key={n} type="button" onClick={() => handleToggleNumero(n)} className={cn("h-8 rounded-md font-black text-[10px] transition-all", isS ? "bg-accent text-white" : "bg-muted/30 text-muted-foreground")}>
                                      {formData.tipo === 'rifa' && selectedEventData?.tipo === 'fazendinha' ? ANIMAIS_FAZENDINHA[n-1]?.substring(0,3) : (n < 10 ? `0${n}` : n)}
                                    </button>
                                  );
                                })}
                             </div>
                           </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <Button type="button" variant="outline" className="h-12 w-12 rounded-xl" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus /></Button>
                      <Input type="number" value={quantity} readOnly className="h-12 text-center font-black text-xl border-2" />
                      <Button type="button" variant="outline" className="h-12 w-12 rounded-xl" onClick={() => setQuantity(quantity + 1)}><Plus /></Button>
                    </div>

                    {(user?.role === 'admin' || user?.role === 'gerente') && (
                      <div className="flex items-center space-x-2 bg-primary/5 p-4 rounded-xl border border-primary/20">
                        <Checkbox id="manual" checked={isManualPending} onCheckedChange={(v) => setIsManualPending(v as boolean)} />
                        <label htmlFor="manual" className="text-[10px] font-black uppercase text-primary cursor-pointer">Vender a Prazo (Pendente)</label>
                      </div>
                    )}

                    <Button type="submit" className="w-full h-16 font-black uppercase bg-primary text-white rounded-2xl shadow-xl gap-2" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" /> : <Ticket className="w-5 h-5" />} {loading ? 'GERANDO...' : 'EMITIR BILHETE'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              {vendaRealizada ? (
                <div id="bilhete-final" className="bg-[#FFFFF4] p-8 shadow-2xl border font-mono rounded-[2.5rem] text-center relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
                   <p className="text-3xl font-black text-primary">LEOBET PRO</p>
                   <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-50">Auditoria Live 365 Dias</p>
                   <Badge className={cn("mt-4 font-black uppercase text-[10px] h-7 px-4", vendaRealizada.status === 'pago' ? "bg-green-600" : "bg-orange-600")}>
                     {vendaRealizada.status === 'pago' ? "VALIDADO E PAGO" : "AGUARDANDO PAGAMENTO"}
                   </Badge>
                   
                   <div className="my-6 border-y-2 border-dashed border-black/10 py-6 space-y-3 text-sm uppercase font-bold text-left">
                      <p className="flex justify-between"><span>CÓDIGO:</span> <span className="font-black text-primary">{vendaRealizada.id}</span></p>
                      <p className="flex justify-between"><span>CLIENTE:</span> <span>{vendaRealizada.cliente}</span></p>
                      <p className="flex justify-between"><span>CONCURSO:</span> <span className="text-[10px]">{vendaRealizada.evento_nome}</span></p>
                      <p className="flex justify-between font-black border-t pt-3 text-lg"><span>TOTAL:</span> <span>R$ {Number(vendaRealizada.valor_total).toFixed(2)}</span></p>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-2 mb-8 text-left">
                      {vendaRealizada.tickets_data.map((t: any, idx: number) => (
                        <div key={idx} className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex flex-col gap-2">
                           <div className="flex justify-between border-b border-primary/10 pb-2">
                              <span className="text-[10px] font-black opacity-50">BILHETE #{idx+1}</span>
                              <span className="text-[10px] font-black text-primary">{t.id}</span>
                           </div>
                           <span className="text-[11px] font-black text-primary leading-relaxed break-all">
                             {vendaRealizada.tipo === 'bingo' ? `DEZENAS: ${t.n?.join(' - ')}` : 
                              vendaRealizada.tipo === 'rifa' ? `COTA: ${t.n?.[0]}` : 
                              vendaRealizada.tipo === 'esportivo' ? `PALPITES: ${t.p}` :
                              `DEZENAS: ${t.n?.join(' - ')}`}
                           </span>
                        </div>
                      ))}
                   </div>

                   <div className="bg-white p-6 rounded-[2rem] border-2 border-dashed border-primary/20 mb-8 flex flex-col items-center gap-3">
                      <p className="text-[10px] font-black uppercase opacity-40">Autenticidade Cloud Supabase</p>
                      <div className="p-3 bg-muted/30 rounded-2xl"><QrCode className="w-28 h-24 text-primary" /></div>
                      <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">Acesse: leotv.fun/resultados</p>
                   </div>

                   <Button onClick={() => window.print()} className="w-full h-16 bg-green-600 hover:bg-green-700 text-white font-black uppercase rounded-2xl gap-3 shadow-lg"><Printer className="w-6 h-6" /> Imprimir Bilhete</Button>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-4 border-dashed rounded-[3rem] opacity-20 bg-white">
                  <Ticket className="w-20 h-20 text-primary mb-4" />
                  <h3 className="text-xl font-black uppercase text-primary text-center px-8">Aguardando Emissão</h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
