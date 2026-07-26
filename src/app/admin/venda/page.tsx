
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Printer, Plus, Minus, Ticket, QrCode, Copy, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    setMounted(true);
    loadEventos();
  }, []);

  const loadEventos = async () => {
    try {
      const { data: bingos } = await supabase.from('bingos').select('*').in('status', ['aberto', 'encerrado']);
      const { data: boloes } = await supabase.from('boloes').select('*').in('status', ['aberto', 'encerrado']);
      const { data: rifas } = await supabase.from('rifas').select('*').in('status', ['aberto', 'encerrado']);
      
      const validBingos = (bingos || []).map(b => ({ ...b, tipo: 'bingo' }));
      const validBoloes = (boloes || []).map(b => ({ ...b, tipo: b.tipo || 'esportivo' }));
      const validRifas = (rifas || []).map(r => ({ ...r, tipo: 'rifa' }));
      
      setEventosAtivos([...validBingos, ...validBoloes, ...validRifas]);
    } catch (err) { console.warn("Erro carregar eventos:", err); }
  };

  const handleSelectEvento = (eventId: string) => {
    const ev = eventosAtivos.find(e => e.id === eventId);
    if (ev) {
      setSelectedEventData(ev);
      setFormData({ 
        ...formData, 
        eventoId: ev.id, 
        eventoNome: ev.nome, 
        unitario: Number(ev.preco || 0), 
        tipo: ev.tipo 
      });
      setNumerosSelecionados([]);
      
      let pArray = [];
      if (ev.partidas) {
        pArray = typeof ev.partidas === 'string' ? JSON.parse(ev.partidas) : ev.partidas;
      }
      
      if (Array.isArray(pArray)) {
        setPalpitesBolao(new Array(pArray.length).fill(''));
      } else {
        setPalpitesBolao([]);
      }
    } else {
      setSelectedEventData(null);
      setFormData({ ...formData, eventoId: '', eventoNome: '', unitario: 0, tipo: 'bingo' });
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
        return toast({ variant: "destructive", title: "LIMITE ATINGIDO" });
      }
      if (formData.tipo === 'rifa') setNumerosSelecionados([num]);
      else setNumerosSelecionados([...numerosSelecionados, num].sort((a,b) => a-b));
    }
  };

  const finalizeVenda = async () => {
    if (!user || !formData.eventoId) return;
    if (formData.tipo === 'esportivo' && palpitesBolao.some(p => !p)) {
      return toast({ variant: "destructive", title: "PALPITES INCOMPLETOS" });
    }

    setLoading(true);
    const totalVenda = formData.unitario * quantity;
    const currentBalance = (Number(user.balance || 0)) + (Number(user.commissionBalance || 0));
    
    if (currentBalance < totalVenda && user.role !== 'admin' && !isManualPending) {
      try {
        const pix = await createPixPayment(totalVenda, { id: user.id, email: user.email, nome: user.nome });
        if (pix?.qr_code) setCheckoutPix(pix as any);
        else throw new Error("API Indisponível");
      } catch (e: any) {
        toast({ variant: "destructive", title: "ERRO AO GERAR PIX" });
      } finally { setLoading(false); }
      return;
    }

    const shouldBePaid = (currentBalance >= totalVenda && !isManualPending) || user.role === 'admin';
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
      ticketsGenerated.push({ 
        id: Math.random().toString(36).substring(7).toUpperCase(), 
        n, p, status: shouldBePaid ? 'pago' : 'pendente' 
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
      valor_total: totalVenda,
      vendedor_id: user.id,
      vendedor_nome: user.nome,
      status: shouldBePaid ? 'pago' : 'pendente',
      tickets_data: ticketsGenerated,
      created_at: new Date().toISOString()
    };

    try {
      if (shouldBePaid && user.role !== 'admin') {
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
      toast({ title: shouldBePaid ? "BILHETE EMITIDO!" : "BILHETE PENDENTE!" });
    } catch (err: any) { toast({ variant: "destructive", title: "ERRO AO SALVAR" }); } 
    finally { setLoading(false); }
  };

  const matchesList = useMemo(() => {
    if (!selectedEventData?.partidas) return [];
    try {
      return typeof selectedEventData.partidas === 'string' ? JSON.parse(selectedEventData.partidas) : selectedEventData.partidas;
    } catch { return []; }
  }, [selectedEventData]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-sans overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-2 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto space-y-6 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-[2.5rem] shadow-2xl bg-white border-t-8 border-primary print:hidden overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black uppercase text-primary flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" /> Terminal de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                {checkoutPix ? (
                   <div className="space-y-6 text-center py-6">
                      <div className="p-4 bg-orange-50 rounded-2xl border-2 border-orange-200">
                        <p className="text-sm font-black uppercase text-orange-600">Saldo Insuficiente</p>
                      </div>
                      <img src={`data:image/png;base64,${checkoutPix.qr_code_base64}`} className="w-48 h-48 mx-auto" alt="Pix" />
                      <Button onClick={() => { navigator.clipboard.writeText(checkoutPix.qr_code); toast({ title: "COPIADO!" }); }} variant="outline" className="w-full h-14 rounded-2xl gap-2 font-black uppercase text-xs">
                        <Copy className="w-4 h-4" /> Copiar Código
                      </Button>
                      <Button onClick={() => setCheckoutPix(null)} variant="ghost" className="w-full text-[10px] font-black uppercase opacity-60">Voltar</Button>
                   </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); finalizeVenda(); }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Cliente</Label><Input value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} placeholder="NOME" className="h-12 font-bold" required /></div>
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">WhatsApp</Label><Input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="DDD + CEL" className="h-12 font-bold" required /></div>
                    </div>
                    <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Chave PIX Resgate</Label><Input value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} placeholder="CPF/EMAIL/CEL" className="h-12 font-black uppercase" required /></div>
                    
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase opacity-60">Concurso Disponível</Label>
                      <select className="w-full h-14 border-2 rounded-xl px-4 font-black text-xs bg-white" value={formData.eventoId} onChange={e => handleSelectEvento(e.target.value)} required>
                        <option value="">-- SELECIONE --</option>
                        {eventosAtivos.map(e => <option key={e.id} value={e.id}>{e.nome} - R$ {Number(e.preco || 0).toFixed(2)}</option>)}
                      </select>
                    </div>

                    {selectedEventData && (
                      <div className="p-4 bg-muted/40 rounded-[2rem] border-2 border-dashed space-y-4">
                        {formData.tipo === 'esportivo' && matchesList.length > 0 && (
                           <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                             {matchesList.map((p: any, idx: number) => (
                               <div key={idx} className="flex items-center justify-between gap-2 bg-white p-3 rounded-2xl border shadow-sm mb-2">
                                  <span className="text-[10px] font-black uppercase flex-1 truncate">{p?.time1} vs {p?.time2}</span>
                                  <div className="flex gap-1">
                                     {['1', 'X', '2'].map((c) => (
                                       <button key={c} type="button" onClick={() => { const nP = [...palpitesBolao]; nP[idx] = c; setPalpitesBolao(nP); }} className={cn("w-9 h-9 rounded-xl font-black text-xs", palpitesBolao[idx] === c ? "bg-primary text-white scale-110 shadow-md" : "bg-muted text-muted-foreground opacity-40")}>
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
                               <p className="text-[9px] font-black uppercase text-primary">Escolha suas Cotas/Dezenas:</p>
                               <Badge className="text-[9px] bg-primary">{numerosSelecionados.length} MARCADOS</Badge>
                             </div>
                             <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 h-48 overflow-y-auto custom-scrollbar p-3 bg-white rounded-2xl border">
                                {Array.from({ length: formData.tipo === 'mega' ? 60 : (formData.tipo === 'quina' ? 80 : (selectedEventData?.total_numeros || 100)) }).map((_, i) => {
                                  const n = i + 1; const isS = numerosSelecionados.includes(n);
                                  return (
                                    <button key={n} type="button" onClick={() => handleToggleNumero(n)} className={cn("h-10 rounded-xl font-black text-[10px] transition-all border-2", isS ? "bg-accent text-white border-accent scale-105 shadow-md" : "bg-muted/10 border-transparent text-muted-foreground/40")}>
                                      {formData.tipo === 'rifa' && selectedEventData?.tipo === 'fazendinha' ? ANIMAIS_FAZENDINHA[n-1]?.substring(0,3) : (n < 10 ? `0${n}` : n)}
                                    </button>
                                  );
                                })}
                             </div>
                           </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 bg-muted/20 p-2 rounded-2xl">
                      <Button type="button" variant="outline" className="h-12 w-12 rounded-xl" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus className="w-4 h-4" /></Button>
                      <Input type="number" value={quantity} readOnly className="h-12 text-center font-black text-2xl border-none bg-transparent shadow-none" />
                      <Button type="button" variant="outline" className="h-12 w-12 rounded-xl" onClick={() => setQuantity(quantity + 1)}><Plus className="w-4 h-4" /></Button>
                    </div>

                    {(user?.role === 'admin' || user?.role === 'gerente') && (
                      <div className="flex items-center space-x-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                        <Checkbox id="manual" checked={isManualPending} onCheckedChange={(v) => setIsManualPending(v as boolean)} className="h-5 w-5" />
                        <label htmlFor="manual" className="text-[11px] font-black uppercase text-primary cursor-pointer">Venda Pendente (Vender a Prazo)</label>
                      </div>
                    )}

                    <Button type="submit" className="w-full h-16 font-black uppercase bg-primary hover:bg-primary/90 text-white rounded-[1.5rem] shadow-xl gap-3 text-lg" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" /> : <Ticket className="w-6 h-6" />} {loading ? 'PROCESSANDO...' : 'EMITIR BILHETE'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              {vendaRealizada ? (
                <div className="bg-[#FFFFF4] p-8 shadow-2xl border-4 border-dashed border-black/5 font-mono rounded-[3rem] text-center relative overflow-hidden animate-in slide-in-from-right duration-500">
                   <div className="absolute top-0 left-0 w-full h-3 bg-primary"></div>
                   <p className="text-3xl font-black text-primary tracking-tighter">LEOBET PRO</p>
                   <Badge className={cn("mb-6 font-black uppercase text-[10px] h-8 px-6 rounded-full text-white", vendaRealizada.status === 'pago' ? "bg-green-600" : "bg-orange-600")}>
                     {vendaRealizada.status === 'pago' ? "VALIDADO" : "PENDENTE VALIDAÇÃO"}
                   </Badge>
                   
                   <div className="my-6 border-y-2 border-dashed border-black/10 py-6 space-y-3 text-xs uppercase font-bold text-left">
                      <p className="flex justify-between items-center"><span>RECIBO:</span> <span className="font-black text-primary">{vendaRealizada.id}</span></p>
                      <p className="flex justify-between items-center"><span>CLIENTE:</span> <span className="max-w-[150px] truncate">{vendaRealizada.cliente}</span></p>
                      <p className="flex justify-between items-center"><span>JOGO:</span> <span className="text-[10px] text-right">{vendaRealizada.evento_nome}</span></p>
                      <p className="flex justify-between font-black border-t-2 border-dashed border-black/10 pt-4 text-xl text-primary"><span>TOTAL:</span> <span>R$ {Number(vendaRealizada.valor_total).toFixed(2)}</span></p>
                   </div>
                   
                   <div className="space-y-3 mb-8 text-left">
                      {vendaRealizada.tickets_data.map((t: any, idx: number) => (
                        <div key={idx} className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex flex-col gap-1">
                           <div className="flex justify-between border-b border-primary/10 pb-1">
                              <span className="text-[8px] font-black opacity-40 uppercase">Bilhete #{idx+1}</span>
                              <span className="text-[8px] font-black text-primary">{t.id}</span>
                           </div>
                           <span className="text-[10px] font-black text-primary leading-relaxed break-all">
                             {vendaRealizada.tipo === 'bingo' ? `DEZENAS: ${t.n?.join(' - ')}` : 
                              vendaRealizada.tipo === 'rifa' ? `COTA: ${t.n?.[0]} ${selectedEventData?.tipo === 'fazendinha' ? `(${ANIMAIS_FAZENDINHA[t.n[0]-1]})` : ''}` : 
                              vendaRealizada.tipo === 'esportivo' ? `PALPITES: ${t.p}` :
                              `DEZENAS: ${t.n?.join(' - ')}`}
                           </span>
                        </div>
                      ))}
                   </div>

                   <div className="bg-white p-6 rounded-[2.5rem] border-2 border-dashed border-primary/20 mb-8 flex flex-col items-center gap-3">
                      <p className="text-[10px] font-black uppercase opacity-40">Autenticidade Garantida</p>
                      <div className="p-3 bg-muted/20 rounded-3xl"><QrCode className="w-20 h-20 text-primary" /></div>
                   </div>

                   <Button onClick={() => window.print()} className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black uppercase rounded-2xl gap-3 shadow-lg"><Printer className="w-5 h-5" /> Imprimir Recibo</Button>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-4 border-dashed rounded-[3.5rem] opacity-20 bg-white p-12 text-center">
                  <Ticket className="w-20 h-20 text-primary mb-6" />
                  <h3 className="text-xl font-black uppercase text-primary">Aguardando Seleção</h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(30, 58, 138, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
