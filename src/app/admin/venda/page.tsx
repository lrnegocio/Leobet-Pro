
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Printer, Send, Ticket as TicketIcon, FileText, AlertTriangle } from 'lucide-react';
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
    tipo: 'bingo' as 'bingo' | 'bolao',
    valorTotal: 0,
    unitario: 0,
    palpite: '', 
  });
  const [vendaRealizada, setVendaRealizada] = useState<any>(null);

  const loadEventos = () => {
    const now = new Date();
    const bingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]').filter((b: any) => {
      const drawDate = new Date(b.dataSorteio);
      const limit = new Date(drawDate.getTime() - 60000);
      return b.status === 'aberto' && now < limit;
    });
    const boloes = JSON.parse(localStorage.getItem('leobet_boloes') || '[]').filter((b: any) => {
      const drawDate = new Date(b.dataFim);
      const limit = new Date(drawDate.getTime() - 60000);
      return b.status === 'aberto' && now < limit;
    });
    setEventosAtivos([...bingos.map(b => ({...b, tipo: 'bingo'})), ...boloes.map(b => ({...b, tipo: 'bolao'}))]);
  };

  useEffect(() => {
    loadEventos();
    const interval = setInterval(loadEventos, 10000); // Atualiza a cada 10s para checar travas
    return () => clearInterval(interval);
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

    const ev = eventosAtivos.find(e => e.id === formData.eventoId);
    if (!ev) {
      toast({ variant: "destructive", title: "Vendas Encerradas", description: "Este evento não aceita mais apostas." });
      return;
    }

    // Trava de 1 minuto
    const now = new Date();
    const drawTime = new Date(formData.tipo === 'bingo' ? ev.dataSorteio : ev.dataFim);
    if (now >= new Date(drawTime.getTime() - 60000)) {
      toast({ variant: "destructive", title: "Tempo Esgotado", description: "Vendas encerradas 1 minuto antes do início." });
      loadEventos();
      return;
    }

    const totalCents = Math.round(formData.valorTotal * 100);
    const unitCents = Math.round(formData.unitario * 100);

    if (unitCents > 0 && totalCents % unitCents !== 0) {
      toast({ 
        variant: "destructive", 
        title: "Valor Inválido", 
        description: `O valor deve ser múltiplo exato do preço unitário (R$ ${formData.unitario.toFixed(2)})` 
      });
      return;
    }

    const qtd = unitCents > 0 ? Math.floor(totalCents / unitCents) : 0;
    if (qtd === 0) {
      toast({ variant: "destructive", title: "Erro", description: "Quantidade de bilhetes não pode ser zero." });
      return;
    }

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
          status: 'aberto',
          eventoId: formData.eventoId 
        });
      }
      
      const receipt = {
        id: Math.random().toString(36).substring(7).toUpperCase(),
        data: new Date().toISOString(),
        status: statusVenda,
        tipo: formData.tipo,
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
        const updatedEventos = eventos.map((evItem: any) => 
          evItem.id === formData.eventoId ? { ...evItem, vendidas: (evItem.vendidas || 0) + qtd } : evItem
        );
        localStorage.setItem(storageKey, JSON.stringify(updatedEventos));
        loadEventos();
      }
      
      setVendaRealizada(receipt);
      setLoading(false);
      
      if (statusVenda === 'pendente') {
        toast({ variant: "destructive", title: "VENDA PENDENTE", description: "Saldo insuficiente. Aguardando aprovação administrativa." });
      } else {
        toast({ title: "Sucesso!", description: `${qtd} bilhete(s) emitido(s) em um único recibo.` });
      }
    }, 600);
  };

  const getDynamicPrizes = () => {
    if (!formData.eventoId) return { quadra: 0, quina: 0, bingo: 0, total: 0 };
    const allBingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]');
    const allBoloes = JSON.parse(localStorage.getItem('leobet_boloes') || '[]');
    const ev = [...allBingos, ...allBoloes].find(e => e.id === formData.eventoId);
    if (!ev) return { quadra: 0, quina: 0, bingo: 0, total: 0 };
    
    const bruto = (ev.vendidas || 0) * (ev.preco || 0);
    const liquido = bruto * 0.65;
    return {
      quadra: liquido * 0.20,
      quina: liquido * 0.30,
      bingo: liquido * 0.50,
      total: liquido
    };
  };

  const shareWhatsApp = () => {
    if (!vendaRealizada) return;
    
    const prizes = getDynamicPrizes();
    let ticketInfo = "";
    
    // Link único para o recibo completo
    const trackingLink = `${window.location.origin}/resultados?c=${vendaRealizada.tickets[0].id}`;

    vendaRealizada.tickets.forEach((t: any, i: number) => {
      ticketInfo += `\n🎫 *JOGO ${i+1}:* ${t.id}\n` +
                   (t.numeros ? `🔢 *B-I-N-G-O:* ${t.numeros.join('-')}\n` : `⚽ *PALPITE:* ${t.palpite}\n`);
    });

    let premiosMsg = `🏆 *PRÊMIO ACUMULADO: R$ ${prizes.total.toFixed(2)}*\n`;
    if (vendaRealizada.tipo === 'bingo') {
      premiosMsg += `├─ Quadra (20%): R$ ${prizes.quadra.toFixed(2)}\n` +
                    `├─ Quina (30%): R$ ${prizes.quina.toFixed(2)}\n` +
                    `└─ Bingo (50%): R$ ${prizes.bingo.toFixed(2)}\n`;
    }

    const text = `*LEOBET PRO - RECIBO DE APOSTA*\n` +
      `👤 *CLIENTE:* ${vendaRealizada.cliente}\n` +
      `🎯 *CONCURSO:* ${vendaRealizada.eventoNome}\n` +
      `💰 *VALOR TOTAL:* R$ ${vendaRealizada.valorTotal.toFixed(2)}\n` +
      `📌 *STATUS:* ${vendaRealizada.status.toUpperCase()}\n` +
      `--------------------------\n` +
      premiosMsg +
      `--------------------------\n` +
      ticketInfo +
      `\n🔗 *Acompanhar em tempo real:* \n${trackingLink}\n` +
      `\n🍀 *BOA SORTE!*\n` +
      `📲 *Suporte/Dúvidas:* (82) 99334-3941\n` +
      `*Credibilidade É A Nossa MARCA*`;
    
    window.open(`https://wa.me/55${vendaRealizada.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const prizes = getDynamicPrizes();

  return (
    <div className="flex h-screen bg-muted/30 print:bg-white">
      <div className="print:hidden h-full flex w-full">
        <SidebarNav />
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <h1 className="text-4xl font-black font-headline uppercase text-primary tracking-tighter">Terminal de Vendas</h1>
                <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.3em]">Bilhetes Térmicos • LEOBET PRO</p>
              </div>
              <div className="bg-white px-6 py-3 rounded-2xl shadow-xl border-2 border-primary/10 flex items-center gap-4">
                 <div className="text-right">
                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Saldo Disponível</p>
                    <p className="text-lg font-black text-primary leading-none">{user?.role === 'admin' ? 'ILIMITADO' : `R$ ${user?.balance.toFixed(2)}`}</p>
                 </div>
                 <div className="bg-primary/10 p-2 rounded-xl">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-none shadow-2xl rounded-3xl overflow-hidden h-fit">
                <CardHeader className="bg-primary text-white p-6">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
                    <TicketIcon className="w-4 h-4" /> Nova Aposta Agrupada
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
                      <Button type="button" variant={formData.tipo === 'bingo' ? 'default' : 'ghost'} onClick={() => setFormData({...formData, tipo: 'bingo', eventoId: '', eventoNome: ''})} className="font-black uppercase text-xs h-11 rounded-xl">Bingo Profissional</Button>
                      <Button type="button" variant={formData.tipo === 'bolao' ? 'default' : 'ghost'} onClick={() => setFormData({...formData, tipo: 'bolao', eventoId: '', eventoNome: ''})} className="font-black uppercase text-xs h-11 rounded-xl">Bolão Futebol</Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Selecione o Evento</Label>
                      <select 
                        className="w-full h-12 px-4 border-2 rounded-xl text-sm font-black outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none bg-white"
                        value={formData.eventoId}
                        onChange={e => {
                          const ev = eventosAtivos.find(evItem => evItem.id === e.target.value);
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
                        <option value="">-- Selecione o Concurso --</option>
                        {eventosAtivos.filter(evItem => evItem.tipo === formData.tipo).map((e: any) => (
                          <option key={e.id} value={e.id}>{e.nome} (Preço: R$ {e.preco.toFixed(2)})</option>
                        ))}
                      </select>
                      {eventosAtivos.filter(evItem => evItem.tipo === formData.tipo).length === 0 && (
                        <p className="text-[9px] font-black uppercase text-destructive flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3" /> Nenhum concurso aberto para vendas no momento.
                        </p>
                      )}
                    </div>

                    {formData.tipo === 'bolao' && (
                      <div className="p-6 bg-accent/5 rounded-2xl space-y-3 border-2 border-accent/20 border-dashed">
                         <div className="flex justify-between items-center">
                            <Label className="text-[10px] font-black uppercase text-accent">Grade de Palpites (1-X-2)</Label>
                            <Badge className="bg-accent font-black text-[9px]">10 JOGOS</Badge>
                         </div>
                         <Input placeholder="Ex: 1-X-2-1-1-X-2-2-1-X" value={formData.palpite} onChange={e => setFormData({...formData, palpite: e.target.value})} required className="font-mono text-center tracking-[0.5em] uppercase h-14 text-xl border-accent/30 focus:border-accent" />
                      </div>
                    )}

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground text-center block">Valor Total da Compra (R$)</Label>
                      <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary text-xl">R$</span>
                         <Input type="number" step="0.01" value={formData.valorTotal} onChange={e => setFormData({...formData, valorTotal: Number(e.target.value)})} className="h-20 font-black text-4xl text-center text-primary border-4 rounded-3xl focus:ring-0 focus:border-primary pl-12" required />
                      </div>
                      {formData.unitario > 0 && (
                        <div className="flex justify-between items-center px-2">
                           <p className="text-[10px] font-black text-muted-foreground uppercase">
                             Emitindo: <span className="text-primary">{Math.floor(formData.valorTotal / formData.unitario)}</span> bilhete(s)
                           </p>
                           <p className="text-[10px] font-black text-primary uppercase">
                             Preço Unitário: R$ {formData.unitario.toFixed(2)}
                           </p>
                        </div>
                      )}
                    </div>

                    <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase text-lg shadow-xl rounded-2xl group transition-all" disabled={loading || eventosAtivos.filter(evItem => evItem.tipo === formData.tipo).length === 0}>
                      {loading ? "PROCESSANDO..." : "EMITIR RECIBO ÚNICO"}
                      <ShoppingCart className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-6">
                {vendaRealizada ? (
                  <div className="space-y-4 animate-in fade-in zoom-in-95">
                    <div className="bg-[#FFFFF0] p-6 shadow-2xl border border-black/10 rounded-sm font-mono text-[11px] leading-tight text-black max-w-sm mx-auto">
                      <div className="text-center border-b border-dashed border-black pb-4 mb-4">
                        <p className="text-lg font-black tracking-tight">LEOBET PRO</p>
                        <p className="text-[9px] uppercase tracking-widest">{window.location.host}</p>
                        <p className="text-[9px] mt-1 font-bold">-------------------------------</p>
                        <p className="text-[10px] font-bold uppercase">Recibo Agrupado de Aposta</p>
                      </div>

                      <div className="space-y-1">
                        <p>DATA: {new Date(vendaRealizada.data).toLocaleString('pt-BR')}</p>
                        <p>CLIENTE: {vendaRealizada.cliente.toUpperCase()}</p>
                        <p>CONCURSO: {vendaRealizada.eventoNome.toUpperCase()}</p>
                      </div>

                      <div className="mt-4 border-b border-dashed border-black pb-2 mb-2 text-center">
                        <p className="font-black text-xs text-primary">VALOR TOTAL: R$ {vendaRealizada.valorTotal.toFixed(2)}</p>
                        <p className="text-[10px] font-black uppercase mt-1">Estimativa Prêmio: R$ {prizes.total.toFixed(2)}</p>
                      </div>

                      <div className="mt-4 space-y-4">
                        {vendaRealizada.tickets.map((t: any, idx: number) => (
                          <div key={idx} className="space-y-1 border-b border-black/5 pb-2">
                            <p className="font-bold">BILHETE {idx + 1}: {t.id}</p>
                            {t.numeros ? (
                              <p className="text-center bg-black/5 p-1 tracking-tighter text-sm font-black">
                                {t.numeros.join(' - ')}
                              </p>
                            ) : (
                              <p className="text-center bg-black/5 p-1 font-black uppercase">
                                PALPITE: {t.palpite}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="text-center mt-6 border-t border-dashed border-black pt-4">
                        <p className="font-black">LINK DE ACOMPANHAMENTO:</p>
                        <p className="text-[9px] break-all">{window.location.origin}/resultados?c={vendaRealizada.tickets[0].id}</p>
                        <p className="font-bold mt-4">BOA SORTE!</p>
                        <p className="text-[10px] font-black mt-2">Dúvidas: (82) 99334-3941</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                       <Button onClick={shareWhatsApp} className="bg-green-600 hover:bg-green-700 font-black uppercase text-[10px] h-14 rounded-xl gap-2 shadow-lg">
                         <Send className="w-4 h-4" /> WhatsApp
                       </Button>
                       <Button onClick={() => window.print()} variant="outline" className="font-black uppercase text-[10px] h-14 rounded-xl gap-2 border-2">
                         <Printer className="w-4 h-4" /> Imprimir
                       </Button>
                       <Button variant="secondary" className="font-black uppercase text-[10px] h-14 rounded-xl" onClick={() => setVendaRealizada(null)}>
                         Nova Venda
                       </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-40 text-center text-muted-foreground px-12 space-y-4">
                    <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto opacity-20">
                       <FileText className="w-10 h-10" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-[0.3em] opacity-30 italic">Aguardando Nova Aposta...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <div className="hidden print:block w-full p-4 text-black bg-white font-mono text-xs">
         {vendaRealizada && (
            <div className="max-w-[300px] mx-auto">
               <div className="text-center border-b border-black pb-4 mb-4">
                  <h1 className="text-xl font-bold">LEOBET PRO</h1>
                  <p>RECIBO DE APOSTA</p>
               </div>
               <p>DATA: {new Date(vendaRealizada.data).toLocaleString('pt-BR')}</p>
               <p>CLIENTE: {vendaRealizada.cliente.toUpperCase()}</p>
               <p>CONCURSO: {vendaRealizada.eventoNome.toUpperCase()}</p>
               <div className="border-t border-black my-4 py-4 space-y-4">
                  {vendaRealizada.tickets.map((t: any, i: number) => (
                    <div key={i} className="border border-black p-2">
                       <p className="font-bold">BILHETE {i+1}: {t.id}</p>
                       <p className="font-black text-sm">{t.numeros ? t.numeros.join(' - ') : `PALPITE: ${t.palpite}`}</p>
                    </div>
                  ))}
               </div>
               <p className="font-bold text-lg text-center">TOTAL PAGO: R$ {vendaRealizada.valorTotal.toFixed(2)}</p>
               <p className="text-center mt-8">BOA SORTE! CONTATO: (82) 99334-3941</p>
            </div>
         )}
      </div>
    </div>
  );
}
