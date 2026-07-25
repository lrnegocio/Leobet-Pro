
'use client';

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Printer, Plus, Minus, Ticket, ShieldCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/use-auth-store';
import { supabase } from '@/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
    if (user?.role === 'cliente') {
      setFormData(p => ({ 
        ...p, 
        cliente: user.nome, 
        whatsapp: user.phone || '', 
        pixKey: user.pixKey || '' 
      }));
    }
  }, [user]);

  const handleSelectEvento = (eventId: string) => {
    const ev = eventosAtivos.find(e => e.id === eventId);
    if (ev) {
      setSelectedEventData(ev);
      setFormData({ 
        ...formData, 
        eventoId: ev.id, 
        eventoNome: ev.nome, 
        unitario: ev.preco, 
        tipo: ev.tipo 
      });
    } else {
      setSelectedEventData(null);
    }
  };

  const finalizeVenda = async () => {
    if (!user) return;
    setLoading(true);
    
    const totalVenda = formData.unitario * quantity;
    const hasBalance = (Number(user.balance) + Number(user.commissionBalance)) >= totalVenda;
    
    const ticketsGenerated = [];
    for (let i = 0; i < quantity; i++) {
      let n = null;
      if (formData.tipo === 'bingo') n = Array.from({length: 15}, () => Math.floor(Math.random() * 90) + 1);
      else if (formData.tipo === 'rifa') {
         if (selectedEventData?.tipo === 'fazendinha') n = [Math.floor(Math.random() * 25) + 1];
         else n = [Math.floor(Math.random() * (selectedEventData?.total_numeros || 100)) + 1];
      }
      ticketsGenerated.push({ 
        id: Math.random().toString(36).substring(7).toUpperCase(), 
        n, 
        status: hasBalance ? 'pago' : 'pendente' 
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
      status: hasBalance ? 'pago' : 'pendente',
      tickets_data: ticketsGenerated,
      created_at: new Date().toISOString()
    };

    try {
      // Se tiver saldo, desconta na hora
      if (hasBalance) {
        let remaining = totalVenda;
        let newComm = Number(user.commissionBalance || 0);
        let newBal = Number(user.balance || 0);

        if (newComm >= remaining) {
          newComm -= remaining;
          remaining = 0;
        } else {
          remaining -= newComm;
          newComm = 0;
          newBal -= remaining;
        }

        const { error: userError } = await supabase.from('users').update({
          balance: newBal,
          commission_balance: newComm
        }).eq('id', user.id);
        
        if (userError) throw userError;
        setUser({ ...user, balance: newBal, commissionBalance: newComm });
      }

      const { error } = await supabase.from('tickets').insert([receipt]);
      if (error) throw error;
      
      setVendaRealizada(receipt);
      toast({ 
        title: hasBalance ? "BILHETE PAGO E AUDITADO!" : "BILHETE AGUARDANDO PAGAMENTO!",
        variant: hasBalance ? "default" : "destructive"
      });
    } catch (err: any) { 
      toast({ variant: "destructive", title: "ERRO AO SALVAR VENDA" }); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleVenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventoId) return toast({ variant: "destructive", title: "ESCOLHA O JOGO" });
    finalizeVenda();
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20 print:grid-cols-1">
            <Card className="rounded-[2.5rem] shadow-2xl bg-white border-t-8 border-primary print:hidden">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xl font-black uppercase text-primary flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" /> Terminal LEOBET
                </CardTitle>
                <div className="mt-2 flex items-center gap-2 text-[10px] font-black uppercase text-orange-600">
                  <AlertCircle className="w-3 h-3" /> Vendas sem saldo ficam pendentes de validação.
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                <form onSubmit={handleVenda} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Cliente</Label><Input value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} placeholder="NOME DO CLIENTE" className="h-12 font-bold uppercase" required /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-black uppercase">WhatsApp</Label><Input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="DDD + NÚMERO" className="h-12 font-bold" required /></div>
                  </div>
                  <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Chave PIX Resgate</Label><Input value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} placeholder="CHAVE PIX" className="h-12 font-black uppercase border-accent/30" required /></div>
                  
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase">Concurso</Label>
                    <select className="w-full h-14 border-2 rounded-xl px-4 font-black text-xs bg-white" value={formData.eventoId} onChange={e => handleSelectEvento(e.target.value)} required>
                      <option value="">-- SELECIONE --</option>
                      {eventosAtivos.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.nome} - R$ {Number(e.preco).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" className="h-12 w-12 rounded-xl" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus /></Button>
                    <Input type="number" value={quantity} readOnly className="h-12 text-center font-black text-xl border-2" />
                    <Button type="button" variant="outline" className="h-12 w-12 rounded-xl" onClick={() => setQuantity(quantity + 1)}><Plus /></Button>
                  </div>

                  <Button type="submit" className="w-full h-16 font-black uppercase bg-primary text-white rounded-2xl shadow-xl" disabled={loading}>
                    {loading ? 'PROCESSANDO...' : 'EMITIR BILHETE'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {vendaRealizada ? (
                <div className="bg-[#FFFFF4] p-8 shadow-2xl border font-mono rounded-[2rem] text-center overflow-y-auto max-h-[80vh]">
                   <p className="text-2xl font-black text-primary">LEOBET PRO</p>
                   <Badge className={cn("mt-2 font-black uppercase text-[9px]", vendaRealizada.status === 'pago' ? "bg-green-600" : "bg-orange-600")}>
                     {vendaRealizada.status === 'pago' ? "VALIDADO E PAGO" : "AGUARDANDO PAGAMENTO"}
                   </Badge>
                   
                   {selectedEventData?.imagem_url && (
                     <img src={selectedEventData.imagem_url} alt="Prêmio" className="w-full h-32 object-cover rounded-xl my-4 border-2" />
                   )}
                   
                   <div className="my-6 border-y-2 border-dashed border-black/10 py-4 space-y-2 text-xs uppercase font-bold text-left">
                      <p className="flex justify-between"><span>CLIENTE:</span> <span>{vendaRealizada.cliente}</span></p>
                      <p className="flex justify-between"><span>JOGO:</span> <span>{vendaRealizada.evento_nome}</span></p>
                      <p className="flex justify-between font-black border-t pt-2"><span>VALOR:</span> <span>R$ {Number(vendaRealizada.valor_total).toFixed(2)}</span></p>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-2 mb-6">
                      {vendaRealizada.tickets_data.map((t: any, idx: number) => (
                        <div key={idx} className="bg-primary/5 p-3 rounded-lg border text-sm font-black flex justify-between">
                           <span>COTA #{idx+1}:</span>
                           <span className="text-primary">
                             {vendaRealizada.tipo === 'rifa' && selectedEventData?.tipo === 'fazendinha' 
                               ? ANIMAIS_FAZENDINHA[Number(t.n[0]) - 1] 
                               : t.n.join(' - ')}
                           </span>
                        </div>
                      ))}
                   </div>
                   <Button onClick={() => window.print()} className="w-full h-14 bg-green-600 text-white font-black uppercase rounded-xl gap-2"><Printer /> Imprimir</Button>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-4 border-dashed rounded-[3rem] opacity-20 bg-white">
                  <Ticket className="w-20 h-20 text-primary mb-4" />
                  <h3 className="text-xl font-black uppercase text-primary text-center px-8 leading-tight">Terminal de Vendas<br/>Aguardando Bilhete</h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
