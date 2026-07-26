'use client';

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Printer, Plus, Minus, Ticket, QrCode, Copy, Loader2, CheckCircle2 } from 'lucide-react';
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
      if (formData.tipo === 'rifa') {
        setNumerosSelecionados([num]);
      } else {
        setNumerosSelecionados([...numerosSelecionados, num].sort((a,b) => a-b));
      }
    }
  };

  const finalizeVenda = async () => {
    if (!user || !formData.eventoId) return;
    
    if (formData.tipo === 'esportivo' && palpitesBolao.some(p => !p)) {
      return toast({ variant: "destructive", title: "PALPITES INCOMPLETOS", description: "Marque todos os jogos do bolão." });
    }
    if ((formData.tipo === 'mega' || formData.tipo === 'quina') && numerosSelecionados.length === 0) {
      return toast({ variant: "destructive", title: "ESCOLHA OS NÚMEROS" });
    }

    setLoading(true);
    const totalVenda = formData.unitario * quantity;
    const totalBalance = (Number(user.balance) || 0) + (Number(user.commissionBalance) || 0);
    
    // Regra: Se não for Admin, não tiver saldo e não for venda a prazo, gera PIX
    if (totalBalance < totalVenda && user.role !== 'admin' && !isManualPending) {
      try {
        const pix = await createPixPayment(totalVenda, { id: user.id, email: user.email, nome: user.nome });
        if (pix && pix.qr_code) {
          setCheckoutPix(pix as any);
        } else {
          throw new Error("Erro na resposta do PIX");
        }
      } catch (e: any) {
        toast({ variant: "destructive", title: "ERRO AO GERAR PIX", description: "Verifique sua conexão ou tente mais tarde." });
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
      ticketsGenerated.push({ 
        id: Math.random().toString(36).substring(7).toUpperCase(), 
        n, 
        p, 
        status: shouldBePaid ? 'pago' : 'pendente' 
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
      toast({ title: shouldBePaid ? "BILHETE EMITIDO!" : "BILHETE PENDENTE!", description: "Aguardando validação do Administrador." });
    } catch (err: any) { toast({ variant: "destructive", title: "ERRO AO SALVAR VENDA" }); } 
    finally { setLoading(false); }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
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
                   <div className="space-y-6 text-center py-6 animate-in fade-in zoom-in-95">
                      <div className="p-4 bg-orange-50 rounded-2xl border-2 border-orange-200">
                        <p className="text-sm font-black uppercase text-orange-600">Saldo Insuficiente</p>
                        <p className="text-[10px] font-bold text-orange-800">Pague o PIX abaixo para validar este bilhete instantaneamente.</p>
                      </div>
                      <div className="bg-white p-4 rounded-3xl border-2 border-primary/20 inline-block">
                         <img src={`data:image/png;base64,${checkoutPix.qr_code_base64}`} className="w-48 h-48" alt="Pix" />
                      </div>
                      <Button onClick={() => { navigator.clipboard.writeText(checkoutPix.qr_code); toast({ title: "CÓDIGO COPIADO!" }); }} variant="outline" className="w-full h-14 rounded-2xl gap-2 font-black uppercase text-xs">
                        <Copy className="w-4 h-4" /> Copiar Código PIX
                      </Button>
                      <Button onClick={() => setCheckoutPix(null)} variant="ghost" className="w-full text-[10px] font-black uppercase opacity-60">Cancelar e Voltar</Button>
                   </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); finalizeVenda(); }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Nome do Cliente</Label><Input value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} placeholder="EX: JOÃO SILVA" className="h-12 font-bold uppercase" required /></div>
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">WhatsApp</Label><Input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="DDD + NÚMERO" className="h-12 font-bold" required /></div>
                    </div>
                    <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Chave PIX (Para Resgate de Prêmios)</Label><Input value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} placeholder="CPF, CELULAR OU EMAIL" className="h-12 font-black uppercase border-accent/30" required /></div>
                    
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase opacity-60">Escolha o Concurso</Label>
                      <select className="w-full h-14 border-2 rounded-xl px-4 font-black text-xs bg-white" value={formData.eventoId} onChange={e => handleSelectEvento(e.target.value)} required>
                        <option value="">-- SELECIONE --</option>
                        {eventosAtivos.map(e => <option key={e.id} value={e.id}>{e.nome} - R$ {Number(e.preco).toFixed(2)}</option>)}
                      </select>
                    </div>

                    {selectedEventData && (
                      <div className="p-4 bg-muted/40 rounded-[2rem] border-2 border-dashed space-y-4">
                        {formData.tipo === 'esportivo' && selectedEventData.partidas && (
                           <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                             <p className="text-[9px] font-black uppercase text-primary mb-2">Marque seus Palpites:</p>
                             {selectedEventData.partidas.map((p: any, idx: number) => (
                               <div key={idx} className="flex items-center justify-between gap-2 bg-white p-3 rounded-2xl border shadow-sm mb-2">
                                  <span className="text-[10px] font-black uppercase flex-1 truncate">{p.time1} vs {p.time2}</span>
                                  <div className="flex gap-1">
                                     {['1', 'X', '2'].map((c) => (
                                       <button key={c} type="button" onClick={() => { const nP = [...palpitesBolao]; nP[idx] = c; setPalpitesBolao(nP); }} className={cn("w-9 h-9 rounded-xl font-black text-xs transition-all", palpitesBolao[idx] === c ? "bg-primary text-white scale-110 shadow-md" : "bg-muted text-muted-foreground opacity-40")}>
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
                               <Badge className="text-[9px] bg-primary h-5">{numerosSelecionados.length} MARCADOS</Badge>
                             </div>
                             <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5 h-48 overflow-y-auto custom-scrollbar p-3 bg-white rounded-2xl border">
                                {Array.from({ length: formData.tipo === 'mega' ? 60 : (formData.tipo === 'quina' ? 80 : (selectedEventData?.total_numeros || 100)) }).map((_, i) => {
                                  const n = i + 1; const isS = numerosSelecionados.includes(n);
                                  return (
                                    <button key={n} type="button" onClick={() => handleToggleNumero(n)} className={cn("h-10 rounded-xl font-black text-[10px] transition-all border-2", isS ? "bg-accent text-white border-accent scale-105 shadow-md" : "bg-muted/10 border-transparent text-muted-foreground/40 hover:bg-muted/30")}>
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
                      <Button type="button" variant="outline" className="h-12 w-12 rounded-xl border-2" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus className="w-4 h-4" /></Button>
                      <Input type="number" value={quantity} readOnly className="h-12 text-center font-black text-2xl border-none bg-transparent shadow-none" />
                      <Button type="button" variant="outline" className="h-12 w-12 rounded-xl border-2" onClick={() => setQuantity(quantity + 1)}><Plus className="w-4 h-4" /></Button>
                    </div>

                    {(user?.role === 'admin' || user?.role === 'gerente') && (
                      <div className="flex items-center space-x-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                        <Checkbox id="manual" checked={isManualPending} onCheckedChange={(v) => setIsManualPending(v as boolean)} className="h-5 w-5" />
                        <label htmlFor="manual" className="text-[11px] font-black uppercase text-primary cursor-pointer">Vender a Prazo (Aposta Pendente)</label>
                      </div>
                    )}

                    <Button type="submit" className="w-full h-16 font-black uppercase bg-primary hover:bg-primary/90 text-white rounded-[1.5rem] shadow-xl gap-3 text-lg" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" /> : <Ticket className="w-6 h-6" />} {loading ? 'GERANDO BILHETE...' : 'EMITIR BILHETE'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              {vendaRealizada ? (
                <div id="bilhete-final" className="bg-[#FFFFF4] p-8 shadow-2xl border-4 border-dashed border-black/5 font-mono rounded-[3rem] text-center relative overflow-hidden animate-in slide-in-from-right duration-500">
                   <div className="absolute top-0 left-0 w-full h-3 bg-primary"></div>
                   <p className="text-3xl font-black text-primary tracking-tighter">LEOBET PRO</p>
                   <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 mb-4">Auditoria Cloud Live</p>
                   <Badge className={cn("mb-6 font-black uppercase text-[10px] h-8 px-6 rounded-full", vendaRealizada.status === 'pago' ? "bg-green-600" : "bg-orange-600")}>
                     {vendaRealizada.status === 'pago' ? "VALIDADO E PAGO" : "AGUARDANDO VALIDAÇÃO"}
                   </Badge>
                   
                   <div className="my-6 border-y-2 border-dashed border-black/10 py-8 space-y-4 text-xs uppercase font-bold text-left">
                      <p className="flex justify-between items-center"><span>RECIBO:</span> <span className="font-black text-primary text-sm">{vendaRealizada.id}</span></p>
                      <p className="flex justify-between items-center"><span>CLIENTE:</span> <span className="max-w-[150px] truncate">{vendaRealizada.cliente}</span></p>
                      <p className="flex justify-between items-center"><span>JOGO:</span> <span className="text-[9px] text-right max-w-[150px]">{vendaRealizada.evento_nome}</span></p>
                      <p className="flex justify-between font-black border-t-2 border-dashed border-black/10 pt-4 text-xl text-primary"><span>TOTAL:</span> <span>R$ {Number(vendaRealizada.valor_total).toFixed(2)}</span></p>
                   </div>
                   
                   <div className="space-y-3 mb-8 text-left">
                      {vendaRealizada.tickets_data.map((t: any, idx: number) => (
                        <div key={idx} className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex flex-col gap-2">
                           <div className="flex justify-between border-b border-primary/10 pb-2">
                              <span className="text-[10px] font-black opacity-40">BILHETE #{idx+1}</span>
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

                   <div className="bg-white p-6 rounded-[2.5rem] border-2 border-dashed border-primary/20 mb-8 flex flex-col items-center gap-3">
                      <p className="text-[10px] font-black uppercase opacity-40">Autenticidade Garantida</p>
                      <div className="p-3 bg-muted/20 rounded-3xl"><QrCode className="w-24 h-24 text-primary" /></div>
                      <p className="text-[8px] font-bold uppercase tracking-widest opacity-50">Conferir em: leotv.fun/resultados</p>
                   </div>

                   <Button onClick={() => window.print()} className="w-full h-16 bg-green-600 hover:bg-green-700 text-white font-black uppercase rounded-3xl gap-3 shadow-lg"><Printer className="w-6 h-6" /> Imprimir Bilhete</Button>
                </div>
              ) : (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-4 border-dashed rounded-[3.5rem] opacity-20 bg-white p-12 text-center">
                  <Ticket className="w-24 h-24 text-primary mb-6" />
                  <h3 className="text-2xl font-black uppercase text-primary leading-tight">Aguardando Seleção no Terminal</h3>
                  <p className="text-[10px] font-bold uppercase mt-4">Preencha os dados à esquerda para gerar o recibo oficial.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(30, 58, 138, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
