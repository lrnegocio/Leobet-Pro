
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Printer, Send, ExternalLink, Ticket as TicketIcon, FileText } from 'lucide-react';
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

  const loadEventos = () => {
    const bingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]').filter((b: any) => b.status === 'aberto');
    const boloes = JSON.parse(localStorage.getItem('leobet_boloes') || '[]').filter((b: any) => b.status === 'aberto');
    setEventosAtivos([...bingos.map(b => ({...b, tipo: 'bingo'})), ...boloes.map(b => ({...b, tipo: 'bolao'}))]);
  };

  useEffect(() => {
    loadEventos();
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
    const hasEnoughBalance = user?.role === 'admin' || (user?.balance || 0) >= formData.valorTotal;
    const statusVenda = hasEnoughBalance ? 'pago' : 'pendente';

    setLoading(true);
    
    setTimeout(() => {
      const tickets: any[] = [];
      for(let i=0; i<qtd; i++) {
        tickets.push({
          id: Math.random().toString().substring(2, 13),
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
        const updatedEventos = eventos.map((ev: any) => 
          ev.id === formData.eventoId ? { ...ev, vendidas: (ev.vendidas || 0) + qtd } : ev
        );
        localStorage.setItem(storageKey, JSON.stringify(updatedEventos));
        loadEventos();
      }
      
      setVendaRealizada(receipt);
      setLoading(false);
      
      if (statusVenda === 'pendente') {
        toast({ variant: "destructive", title: "VENDA PENDENTE", description: "Saldo insuficiente. Aguardando aprovação." });
      } else {
        toast({ title: "Sucesso!", description: `${qtd} bilhete(s) emitido(s).` });
      }
    }, 600);
  };

  const shareWhatsApp = () => {
    if (!vendaRealizada) return;
    
    const storageKey = vendaRealizada.tipo === 'bingo' ? 'leobet_bingos' : 'leobet_boloes';
    const todosEventos = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const evento = todosEventos.find((ev: any) => ev.id === vendaRealizada.eventoId);
    
    const totalBruto = (evento?.vendidas || 0) * (evento?.preco || 0);
    const premioLiquido = totalBruto * 0.65;
    
    const quadraPremio = premioLiquido * 0.20;
    const quinaPremio = premioLiquido * 0.30;
    const bingoPremio = premioLiquido * 0.50;
    
    let ticketInfo = "";
    vendaRealizada.tickets.forEach((t: any, i: number) => {
      const trackingLink = `${window.location.origin}/resultados?c=${t.id}`;
      ticketInfo += `\n🎫 *BILHETE ${i+1}:* ${t.id}\n` +
                   (t.numeros ? `🔢 *NÚMEROS:* ${t.numeros.join('-')}\n` : `⚽ *PALPITE:* ${t.palpite}\n`) +
                   `🔗 *Acompanhar:* ${trackingLink}\n`;
    });

    let premiosMsg = `🏆 *PRÊMIO ESTIMADO: R$ ${premioLiquido.toFixed(2)}*\n`;
    if (vendaRealizada.tipo === 'bingo') {
      premiosMsg += `├─ Quadra: R$ ${quadraPremio.toFixed(2)}\n` +
                    `├─ Quina: R$ ${quinaPremio.toFixed(2)}\n` +
                    `└─ Bingo: R$ ${bingoPremio.toFixed(2)}\n`;
    }

    const text = `*LEOBET PRO - RECIBO DE APOSTA*\n` +
      `👤 *CLIENTE:* ${vendaRealizada.cliente}\n` +
      `🤝 *COLABORADOR:* ${vendaRealizada.vendedorNome || 'Diretoria'}\n` +
      `🎯 *CONCURSO:* ${vendaRealizada.eventoNome}\n` +
      `💰 *TOTAL:* R$ ${vendaRealizada.valorTotal.toFixed(2)}\n` +
      `📌 *STATUS:* ${vendaRealizada.status.toUpperCase()}\n` +
      `--------------------------\n` +
      premiosMsg +
      `--------------------------\n` +
      ticketInfo +
      `\n🍀 *Boa sorte!*\n` +
      `📲 *Suporte:* (82) 99334-3941\n` +
      `*Credibilidade É A Nossa MARCA*`;
    
    window.open(`https://wa.me/55${vendaRealizada.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

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
              <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-primary text-white p-6">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
                    <TicketIcon className="w-4 h-4" /> Nova Aposta Múltipla
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
                        <option value="">-- Concursos Abertos --</option>
                        {eventosAtivos.filter(ev => ev.tipo === formData.tipo).map((e: any) => (
                          <option key={e.id} value={e.id}>{e.nome} (R$ {e.preco.toFixed(2)})</option>
                        ))}
                      </select>
                    </div>

                    {formData.tipo === 'bolao' && (
                      <div className="p-6 bg-accent/5 rounded-2xl space-y-3 border-2 border-accent/20 border-dashed">
                         <div className="flex justify-between items-center">
                            <Label className="text-[10px] font-black uppercase text-accent">Sua Grade (1-X-2)</Label>
                            <Badge className="bg-accent font-black text-[9px]">10 JOGOS</Badge>
                         </div>
                         <Input placeholder="Ex: 1-X-2-1-1-X-2-2-1-X" value={formData.palpite} onChange={e => setFormData({...formData, palpite: e.target.value})} required className="font-mono text-center tracking-[0.5em] uppercase h-14 text-xl border-accent/30 focus:border-accent" />
                      </div>
                    )}

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground text-center block">Valor Total das Cartelas</Label>
                      <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary text-xl">R$</span>
                         <Input type="number" step="0.01" value={formData.valorTotal} onChange={e => setFormData({...formData, valorTotal: Number(e.target.value)})} className="h-20 font-black text-4xl text-center text-primary border-4 rounded-3xl focus:ring-0 focus:border-primary pl-12" required />
                      </div>
                      {formData.unitario > 0 && (
                        <p className="text-[10px] font-black text-center text-muted-foreground uppercase tracking-widest">
                          Quantidade a emitir: <span className="text-primary">{(formData.valorTotal / formData.unitario).toFixed(0)}</span> un.
                        </p>
                      )}
                    </div>

                    <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase text-lg shadow-xl rounded-2xl group transition-all" disabled={loading}>
                      {loading ? "PROCESSANDO..." : "GERAR RECIBO TÉRMICO"}
                      <Printer className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-6">
                {vendaRealizada ? (
                  <div className="space-y-4 animate-in fade-in zoom-in-95">
                    {/* Visual de Recibo Estilo Banca */}
                    <div className="bg-[#FFFFF0] p-6 shadow-2xl border border-black/10 rounded-sm font-mono text-[11px] leading-tight text-black max-w-sm mx-auto receipt-view">
                      <div className="text-center border-b border-dashed border-black pb-4 mb-4">
                        <p className="text-lg font-black tracking-tight">LEOBET PRO</p>
                        <p className="text-[9px] uppercase tracking-widest">{window.location.host}</p>
                        <p className="text-[9px] mt-1 font-bold">-------------------------------</p>
                        <p className="text-[10px] font-bold uppercase">Recibo de Aposta Múltipla</p>
                      </div>

                      <div className="space-y-1">
                        <p>DATA: {new Date(vendaRealizada.data).toLocaleString('pt-BR')}</p>
                        <p>COLABORADOR: {(vendaRealizada.vendedorNome || 'DIRETORIA').toUpperCase()}</p>
                        <p>CLIENTE: {vendaRealizada.cliente.toUpperCase()}</p>
                      </div>

                      <div className="mt-4 border-t border-dashed border-black pt-4">
                        <div className="flex justify-between font-black mb-1">
                          <span>CONCURSO</span>
                          <span>TIPO</span>
                        </div>
                        <div className="flex justify-between uppercase">
                          <span className="truncate max-w-[150px]">{vendaRealizada.eventoNome}</span>
                          <span>{vendaRealizada.tipo}</span>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-dashed border-black pt-4 space-y-4">
                        {vendaRealizada.tickets.map((t: any, idx: number) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between font-bold">
                              <span>BILHETE {idx + 1}</span>
                              <span className="text-xs">{t.id}</span>
                            </div>
                            {t.numeros ? (
                              <p className="text-center bg-black/5 p-1 tracking-tighter">
                                N: {t.numeros.join('-')}
                              </p>
                            ) : (
                              <p className="text-center bg-black/5 p-1 font-black">
                                PALPITE: {t.palpite}
                              </p>
                            )}
                            <p className="text-[9px] italic text-center">
                              Link: {window.location.origin}/resultados?c={t.id}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 border-t-2 border-double border-black pt-4 space-y-1">
                        <div className="flex justify-between font-black text-sm">
                          <span>TOTAL APOSTADO:</span>
                          <span>R$ {vendaRealizada.valorTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span>QUANTIDADE JOGOS:</span>
                          <span>{vendaRealizada.qtd}</span>
                        </div>
                      </div>

                      <div className="text-center mt-6 border-t border-dashed border-black pt-4">
                        <p className="font-bold">Boa sorte!</p>
                        <p className="text-[9px] mt-1">Credibilidade É A Nossa MARCA</p>
                        <p className="text-[10px] font-black mt-2">SUPO: (82) 99334-3941</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                       <Button onClick={shareWhatsApp} className="bg-green-600 hover:bg-green-700 font-black uppercase text-[10px] h-14 rounded-xl gap-2 shadow-lg">
                         <Send className="w-4 h-4" /> Enviar WhatsApp
                       </Button>
                       <Button onClick={handlePrint} variant="outline" className="font-black uppercase text-[10px] h-14 rounded-xl gap-2 border-2">
                         <Printer className="w-4 h-4" /> Imprimir Recibo
                       </Button>
                       <Button variant="secondary" className="font-black uppercase text-[10px] h-14 rounded-xl" onClick={() => setVendaRealizada(null)}>
                         Nova Aposta
                       </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-40 text-center text-muted-foreground px-12 space-y-4">
                    <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto opacity-20">
                       <FileText className="w-10 h-10" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-[0.3em] opacity-30 italic">Aguardando Venda...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Versão exclusiva para Impressão */}
      <div className="hidden print:block w-full p-4 text-black bg-white font-mono text-xs">
         {vendaRealizada && (
            <div className="max-w-[300px] mx-auto space-y-4">
               <div className="text-center border-b border-black pb-4">
                  <h1 className="text-xl font-bold">LEOBET PRO</h1>
                  <p className="text-[10px]">{window.location.host}</p>
               </div>
               <div className="space-y-1">
                  <p>DATA: {new Date(vendaRealizada.data).toLocaleString('pt-BR')}</p>
                  <p>COLAB: {(vendaRealizada.vendedorNome || 'DIR').toUpperCase()}</p>
                  <p>CLI: {vendaRealizada.cliente.toUpperCase()}</p>
               </div>
               <div className="border-t border-black pt-2">
                  <p className="font-bold text-center uppercase">{vendaRealizada.eventoNome}</p>
               </div>
               <div className="space-y-4 py-4">
                  {vendaRealizada.tickets.map((t: any, i: number) => (
                    <div key={i} className="border border-black p-2">
                       <p className="font-bold">BILHETE {i+1}: {t.id}</p>
                       <p className="break-all">{t.numeros ? t.numeros.join('-') : `PALPITE: ${t.palpite}`}</p>
                    </div>
                  ))}
               </div>
               <div className="border-t-2 border-double border-black pt-4 font-bold">
                  <div className="flex justify-between">
                     <span>TOTAL:</span>
                     <span>R$ {vendaRealizada.valorTotal.toFixed(2)}</span>
                  </div>
               </div>
               <div className="text-center pt-8">
                  <p>Boa sorte!</p>
                  <p className="text-[10px] mt-2 tracking-widest uppercase">Credibilidade E A Nossa MARCA</p>
                  <p className="mt-4 text-[10px] font-bold">VALIDAÇÃO: (82) 99334-3941</p>
               </div>
            </div>
         )}
      </div>
    </div>
  );
}
