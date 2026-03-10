"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Printer, Send, AlertTriangle, Ticket as TicketIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/use-auth-store';

export default function VendaPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [eventosAtivos, setEventosAtivos] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    cliente: '',
    whatsapp: '',
    eventoId: '',
    eventoNome: '',
    tipo: 'bingo',
    valorTotal: 0,
    unitario: 0,
    palpite: '', 
  });
  const [vendaRealizada, setVendaRealizada] = useState<any>(null);

  useEffect(() => {
    const bingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]').filter((b: any) => b.status === 'aberto');
    const boloes = JSON.parse(localStorage.getItem('leobet_boloes') || '[]').filter((b: any) => b.status === 'aberto');
    setEventosAtivos([...bingos.map(b => ({...b, tipo: 'bingo'})), ...boloes.map(b => ({...b, tipo: 'bolao'}))]);
  }, []);

  const generateBingoTicket = () => {
    const numbers: number[] = [];
    while (numbers.length < 15) {
      const n = Math.floor(Math.random() * 90) + 1;
      if (!numbers.includes(n)) numbers.push(n);
    }
    return numbers.sort((a, b) => a - b);
  };

  const handleVenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventoId) {
        toast({ variant: "destructive", title: "Erro", description: "Selecione um concurso." });
        return;
    }

    if (formData.unitario > 0 && formData.valorTotal % formData.unitario !== 0) {
      toast({ 
        variant: "destructive", 
        title: "Valor Inválido", 
        description: `O valor deve ser múltiplo de R$ ${formData.unitario.toFixed(2)}` 
      });
      return;
    }

    const qtd = formData.unitario > 0 ? Math.floor(formData.valorTotal / formData.unitario) : 0;
    
    // Verificação de Saldo Inteligente
    const hasEnoughBalance = user?.role === 'admin' || (user?.balance || 0) >= formData.valorTotal;
    const statusVenda = hasEnoughBalance ? 'pago' : 'pendente';

    setLoading(true);
    
    setTimeout(() => {
      const tickets: any[] = [];
      for(let i=0; i<qtd; i++) {
        tickets.push({
          id: Math.random().toString().substring(2, 13), // 11 dígitos
          numeros: formData.tipo === 'bingo' ? generateBingoTicket() : null,
          palpite: formData.tipo === 'bolao' ? formData.palpite : null,
          status: 'aberto', // Status do bilhete para o concurso
          eventoId: formData.eventoId // VINCULADO AO CONCURSO ESPECÍFICO
        });
      }
      
      const receipt = {
        id: Math.random().toString(36).substring(7).toUpperCase(),
        data: new Date().toISOString(),
        status: statusVenda,
        qtd,
        tickets,
        vendedorId: user?.id,
        vendedorRole: user?.role,
        vendedorNome: user?.nome,
        ...formData
      };
      
      const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
      localStorage.setItem('leobet_tickets', JSON.stringify([...allReceipts, receipt]));

      if (hasEnoughBalance && user?.role !== 'admin') {
        const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
        const updatedUsers = allUsers.map((u: any) => 
          u.id === user?.id ? { ...u, balance: u.balance - formData.valorTotal } : u
        );
        localStorage.setItem('leobet_users', JSON.stringify(updatedUsers));
      }

      if (statusVenda === 'pago') {
        const storageKey = formData.tipo === 'bingo' ? 'leobet_bingos' : 'leobet_boloes';
        const eventos = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updatedEventos = eventos.map((ev: any) => 
          ev.id === formData.eventoId ? { ...ev, vendidas: (ev.vendidas || 0) + qtd } : ev
        );
        localStorage.setItem(storageKey, JSON.stringify(updatedEventos));
      }
      
      setVendaRealizada(receipt);
      setLoading(false);
      
      if (statusVenda === 'pendente') {
        toast({ 
          variant: "destructive", 
          title: "VENDA PENDENTE", 
          description: "Saldo insuficiente. Aguardando aprovação do Admin.",
          duration: 10000
        });
      } else {
        toast({ title: "Sucesso!", description: `${qtd} bilhete(s) emitido(s).` });
      }
    }, 600);
  };

  const shareWhatsApp = () => {
    if (!vendaRealizada) return;
    
    const evento = eventosAtivos.find(ev => ev.id === vendaRealizada.eventoId);
    const totalBruto = (evento?.vendidas || 0) * (evento?.preco || 0);
    const premioLiquido = totalBruto * 0.65;
    
    let ticketInfo = "";
    vendaRealizada.tickets.forEach((t: any, i: number) => {
      ticketInfo += `\n🎫 *BILHETE ${i+1}:* ${t.id}\n` +
                   (t.numeros ? `🔢 *B-I-N-G-O:* ${t.numeros.join('-')}\n` : `⚽ *PALPITE:* ${t.palpite}\n`);
    });

    const text = `*LEOBET PRO - RECIBO OFICIAL*\n` +
      `👤 *CLIENTE:* ${vendaRealizada.cliente}\n` +
      `🎯 *CONCURSO:* ${vendaRealizada.eventoNome}\n` +
      `💰 *VALOR TOTAL:* R$ ${vendaRealizada.valorTotal.toFixed(2)}\n` +
      `📌 *STATUS:* ${vendaRealizada.status.toUpperCase()}\n` +
      `--------------------------\n` +
      (vendaRealizada.status === 'pendente' ? `⚠️ *AGUARDANDO APROVAÇÃO FINANCEIRA*\n` : `🏆 *PRÊMIO LÍQUIDO ATUAL: R$ ${premioLiquido.toFixed(2)}*\n`) +
      `--------------------------\n` +
      ticketInfo +
      `\n🔗 *Conferir Resultado:* ${window.location.origin}/resultados\n` +
      `\n📲 *Dúvidas/Suporte:* (82) 99334-3941\n` +
      `🍀 *Boa sorte!*`;
    
    window.open(`https://wa.me/55${vendaRealizada.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h1 className="text-4xl font-black font-headline uppercase text-primary leading-none tracking-tighter">Terminal de Vendas</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.3em]">Emissão de Bilhetes • LEOBET PRO</p>
            </div>
            <div className="bg-white px-6 py-3 rounded-2xl shadow-xl border-2 border-primary/10 flex items-center gap-4">
               <div className="text-right">
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Saldo Atual</p>
                  <p className="text-lg font-black text-primary leading-none">{user?.role === 'admin' ? 'ILIMITADO' : `R$ ${user?.balance.toFixed(2)}`}</p>
               </div>
               <div className="bg-primary/10 p-2 rounded-xl">
                  <ShoppingCart className="w-6 h-6 text-primary" />
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-primary text-white p-6">
                <CardTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <TicketIcon className="w-4 h-4" /> Nova Aposta
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleVenda} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Nome do Cliente</Label>
                      <Input placeholder="Ex: João Silva" value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} required className="h-12 border-2 rounded-xl font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">WhatsApp</Label>
                      <Input placeholder="DDD + Número" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} required className="h-12 border-2 rounded-xl font-bold" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-2xl">
                    <Button type="button" variant={formData.tipo === 'bingo' ? 'default' : 'ghost'} onClick={() => setFormData({...formData, tipo: 'bingo', eventoId: '', eventoNome: ''})} className="font-black uppercase text-xs h-11 rounded-xl">Bingo</Button>
                    <Button type="button" variant={formData.tipo === 'bolao' ? 'default' : 'ghost'} onClick={() => setFormData({...formData, tipo: 'bolao', eventoId: '', eventoNome: ''})} className="font-black uppercase text-xs h-11 rounded-xl">Bolão</Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Selecionar Concurso Aberto</Label>
                    <select 
                      className="w-full h-12 px-4 border-2 rounded-xl text-sm font-black outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none bg-white"
                      value={formData.eventoId}
                      onChange={e => {
                        const ev = eventosAtivos.find(ev => ev.id === e.target.value);
                        setFormData({
                          ...formData, 
                          eventoId: e.target.value,
                          eventoNome: ev?.nome || '',
                          unitario: ev?.preco || 0,
                          valorTotal: ev?.preco || 0
                        });
                      }}
                      required
                    >
                      <option value="">-- Selecione um Concurso --</option>
                      {eventosAtivos.filter(ev => ev.tipo === formData.tipo).map((e: any) => (
                        <option key={e.id} value={e.id}>{e.nome} (R$ {e.preco.toFixed(2)})</option>
                      ))}
                    </select>
                  </div>

                  {formData.tipo === 'bolao' && (
                    <div className="p-6 bg-accent/5 rounded-2xl space-y-3 border-2 border-accent/20 border-dashed">
                       <div className="flex justify-between items-center">
                          <Label className="text-[10px] font-black uppercase text-accent">Palpites (1-X-2)</Label>
                          <Badge className="bg-accent font-black text-[9px]">10 PARTIDAS</Badge>
                       </div>
                       <Input placeholder="1-X-2-1-1-X-2-2-1-X" value={formData.palpite} onChange={e => setFormData({...formData, palpite: e.target.value})} required className="font-mono text-center tracking-[0.5em] uppercase h-14 text-xl border-accent/30 focus:border-accent" />
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground text-center block">Valor da Compra</Label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary text-xl">R$</span>
                       <Input type="number" step="0.01" value={formData.valorTotal} onChange={e => setFormData({...formData, valorTotal: Number(e.target.value)})} className="h-20 font-black text-4xl text-center text-primary border-4 rounded-3xl focus:ring-0 focus:border-primary pl-12" required />
                    </div>
                    {formData.unitario > 0 && (
                      <p className="text-[10px] font-black text-center text-muted-foreground uppercase tracking-widest">
                        Equivale a <span className="text-primary font-black">{(formData.valorTotal / formData.unitario).toFixed(0)}</span> bilhete(s) individual(ais)
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase text-lg shadow-xl rounded-2xl group transition-all" disabled={loading}>
                    {loading ? "PROCESSANDO..." : "EMITIR BILHETES"}
                    <Printer className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className={vendaRealizada ? `border-none shadow-2xl animate-in zoom-in-95 rounded-3xl overflow-hidden ${vendaRealizada.status === 'pendente' ? 'ring-8 ring-orange-500/20' : 'ring-8 ring-primary/5'}` : "opacity-20 pointer-events-none"}>
                <CardContent className="p-0">
                  {vendaRealizada ? (
                    <div className="p-8 space-y-6">
                      <div className="bg-white p-8 border-8 border-double border-primary/10 font-code text-[11px] leading-relaxed relative shadow-inner rounded-xl">
                        {vendaRealizada.status === 'pendente' && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 rotate-12">
                            <p className="text-6xl font-black text-orange-600 border-[15px] border-orange-600 p-8">PENDENTE</p>
                          </div>
                        )}
                        <div className="text-center border-b-4 border-primary/10 pb-6 mb-6">
                            <p className="font-black text-4xl tracking-tighter text-primary">LEOBET PRO</p>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-1">Sorteios Profissionais</p>
                        </div>
                        <div className="space-y-3">
                            <p className="flex justify-between border-b border-dashed pb-1"><span>DATA/HORA:</span> <span className="font-black">{new Date(vendaRealizada.data).toLocaleString('pt-BR')}</span></p>
                            <p className="flex justify-between border-b border-dashed pb-1"><span>CLIENTE:</span> <span className="font-black uppercase">{vendaRealizada.cliente}</span></p>
                            <p className="flex justify-between border-b border-dashed pb-1"><span>CONCURSO:</span> <span className="font-black uppercase text-primary">{vendaRealizada.eventoNome}</span></p>
                            
                            <div className="py-6 border-y-4 border-primary/5 my-6 space-y-6">
                              {vendaRealizada.tickets.map((t: any, idx: number) => (
                                <div key={idx} className="bg-muted/30 p-4 rounded-xl relative">
                                  <p className="font-black text-primary text-sm text-center mb-3">BILHETE {idx + 1} DE {vendaRealizada.tickets.length}</p>
                                  <p className="text-center font-black text-lg tracking-widest bg-white p-2 rounded-lg border-2 border-primary/10 mb-3">{t.id}</p>
                                  {t.numeros && (
                                    <div className="space-y-2">
                                      <p className="text-[9px] font-black text-center opacity-40 uppercase tracking-[1em]">B  I  N  G  O</p>
                                      <div className="grid grid-cols-5 gap-2 text-center font-black text-lg">
                                        {t.numeros.map((n: number) => <span key={n} className="bg-white rounded-md shadow-sm border border-primary/5">{n.toString().padStart(2, '0')}</span>)}
                                      </div>
                                    </div>
                                  )}
                                  {t.palpite && <p className="font-black text-center bg-primary text-white p-3 rounded-lg text-xl tracking-[0.5em]">{t.palpite}</p>}
                                </div>
                              ))}
                            </div>

                            <div className="flex justify-between items-center bg-primary text-white p-4 rounded-xl shadow-lg">
                              <span className="text-sm font-black uppercase tracking-widest">VALOR TOTAL:</span> 
                              <span className="text-2xl font-black">R$ {vendaRealizada.valorTotal.toFixed(2)}</span>
                            </div>
                            <p className="text-center text-[10px] font-black uppercase mt-4 tracking-[0.2em] opacity-60">Status: {vendaRealizada.status.toUpperCase()}</p>
                        </div>
                        <div className="text-center mt-8 pt-6 border-t-2 border-dashed border-primary/10">
                            <p className="font-black text-xs">Suporte: (82) 99334-3941</p>
                            <p className="text-[8px] font-bold mt-1">Conclua o pagamento para validar seus bilhetes.</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <Button onClick={shareWhatsApp} className="w-full bg-green-600 hover:bg-green-700 font-black uppercase gap-3 h-16 rounded-2xl shadow-xl text-lg">
                          <Send className="w-5 h-5" /> Enviar para WhatsApp
                        </Button>
                        <div className="grid grid-cols-2 gap-3">
                          <Button variant="outline" className="font-black uppercase gap-2 h-14 rounded-2xl border-2 hover:bg-primary/5" onClick={() => window.print()}><Printer className="w-5 h-5" /> Imprimir</Button>
                          <Button variant="secondary" className="font-black uppercase h-14 rounded-2xl" onClick={() => setVendaRealizada(null)}>Nova Venda</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-40 text-center text-muted-foreground px-12 space-y-4">
                      <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto opacity-20">
                         <Printer className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-black uppercase tracking-widest opacity-30 italic">Aguardando emissão...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}