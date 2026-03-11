
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Printer, Send, Ticket as TicketIcon, Trophy, Smartphone, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/use-auth-store';

export default function VendaPage() {
  const { toast } = useToast();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [eventosAtivos, setEventosAtivos] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    cliente: '',
    whatsapp: '',
    eventoId: '',
    eventoNome: '',
    tipo: 'bingo' as 'bingo' | 'bolao',
    valorTotal: 0,
    unitario: 0,
  });

  const [bolaoPalpites, setBolaoPalpites] = useState<string[]>(Array(10).fill(''));
  const [vendaRealizada, setVendaRealizada] = useState<any>(null);

  const loadEventos = () => {
    const now = new Date();
    
    // Carrega Bingos e Bolões Ativos simultaneamente
    const bingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]').filter((b: any) => {
      const drawDate = new Date(b.dataSorteio);
      return b.status === 'aberto' && now < new Date(drawDate.getTime() - 60000);
    }).map((b: any) => ({ ...b, tipo: 'bingo' }));

    const boloes = JSON.parse(localStorage.getItem('leobet_boloes') || '[]').filter((b: any) => {
      const startDate = new Date(b.dataFim || b.createdAt); 
      return b.status === 'aberto' && now < new Date(startDate.getTime() - 60000);
    }).map((b: any) => ({ ...b, tipo: 'bolao' }));

    setEventosAtivos([...bingos, ...boloes]);
  };

  useEffect(() => {
    loadEventos();
    const interval = setInterval(loadEventos, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectEvent = (eventId: string) => {
    const ev = eventosAtivos.find(e => String(e.id) === String(eventId));
    setSelectedEvent(ev);
    
    if (ev) {
      setFormData({
        ...formData,
        eventoId: eventId,
        eventoNome: ev.nome,
        unitario: ev.preco,
        valorTotal: ev.preco,
        tipo: ev.tipo
      });
      setBolaoPalpites(Array(10).fill(''));
    } else {
      setSelectedEvent(null);
      setFormData(prev => ({ ...prev, eventoId: '', eventoNome: '', valorTotal: 0 }));
    }
  };

  const handleSetPalpite = (matchIndex: number, value: string) => {
    const newPalpites = [...bolaoPalpites];
    newPalpites[matchIndex] = value;
    setBolaoPalpites(newPalpites);
  };

  const generateUniqueNumbers = (count: number, max: number) => {
    const nums: Set<number> = new Set();
    while (nums.size < count) {
      const n = Math.floor(Math.random() * max) + 1;
      nums.add(n);
    }
    return Array.from(nums).sort((a, b) => a - b);
  };

  const handleVenda = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanPhone = formData.whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast({ variant: "destructive", title: "DDD OBRIGATÓRIO" });
      return;
    }

    if (formData.tipo === 'bolao' && bolaoPalpites.some(p => !p)) {
      toast({ variant: "destructive", title: "GRADE INCOMPLETA", description: "Selecione o palpite para os 10 jogos." });
      return;
    }

    if (!selectedEvent) {
      toast({ variant: "destructive", title: "CONCURSO INDISPONÍVEL" });
      return;
    }

    const userTotalBalance = (user?.balance || 0) + (user?.commissionBalance || 0);
    const hasEnoughBalance = user?.role === 'admin' || userTotalBalance >= formData.valorTotal;
    const statusVenda = hasEnoughBalance ? 'pago' : 'pendente';

    setLoading(true);
    setTimeout(() => {
      const currentPalpite = bolaoPalpites.join('-');
      const ticketsGenerated: any[] = [];
      ticketsGenerated.push({
        id: Math.random().toString().substring(2, 13),
        numeros: formData.tipo === 'bingo' ? generateUniqueNumbers(15, 90) : null,
        palpite: formData.tipo === 'bolao' ? currentPalpite : null,
        status: 'aberto'
      });

      const receipt = {
        id: Math.random().toString(36).substring(7).toUpperCase(),
        data: new Date().toISOString(),
        status: statusVenda,
        vendedorId: user?.id,
        vendedorNome: user?.nome,
        vendedorRole: user?.role,
        gerenteId: user?.gerenteId || (user?.role === 'cambista' ? 'admin-master' : undefined),
        ...formData,
        palpite: formData.tipo === 'bolao' ? currentPalpite : null,
        whatsapp: cleanPhone,
        tickets: ticketsGenerated,
        qtd: 1
      };

      const all = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
      localStorage.setItem('leobet_tickets', JSON.stringify([...all, receipt]));

      if (statusVenda === 'pago' && user?.role !== 'admin') {
        const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
        const updatedUsers = allUsers.map((u: any) => {
          if (u.id === user?.id) {
            let remaining = formData.valorTotal;
            let newComm = u.commissionBalance || 0;
            let newBal = u.balance || 0;

            if (newComm >= remaining) { newComm -= remaining; remaining = 0; }
            else { remaining -= newComm; newComm = 0; newBal -= remaining; }

            const myCommRate = user?.role === 'cambista' ? 0.10 : user?.role === 'gerente' ? 0.15 : 0;
            newComm += (formData.valorTotal * myCommRate);

            return { ...u, balance: newBal, commissionBalance: newComm };
          }
          if (user?.role === 'cambista' && user?.gerenteId && u.id === user.gerenteId) {
             return { ...u, commissionBalance: (u.commissionBalance || 0) + (formData.valorTotal * 0.05) };
          }
          return u;
        });
        localStorage.setItem('leobet_users', JSON.stringify(updatedUsers));
        const updatedMe = updatedUsers.find((u: any) => u.id === user?.id);
        setUser(updatedMe);
      }

      setVendaRealizada(receipt);
      setLoading(false);
      
      if (statusVenda === 'pendente') {
        toast({ variant: "destructive", title: "AGUARDANDO APROVAÇÃO MASTER" });
      } else {
        toast({ title: "VENDA REALIZADA COM SUCESSO!" });
      }
    }, 800);
  };

  const handleWhatsApp = () => {
    if (!vendaRealizada) return;
    const host = window.location.origin;
    const firstTicketId = vendaRealizada.tickets[0].id;
    const link = `${host}/resultados?c=${firstTicketId}`;
    
    let palpitesTexto = '';
    if (vendaRealizada.tipo === 'bolao' && vendaRealizada.palpite && selectedEvent) {
      const matches = selectedEvent.partidas || [];
      palpitesTexto = `%0A%0A*MEUS PALPITES:*%0A${vendaRealizada.palpite.split('-').map((p: string, i: number) => {
        const time1 = matches[i]?.time1 || `Jogo ${i+1}A`;
        const time2 = matches[i]?.time2 || `Jogo ${i+1}B`;
        return `${time1} x ${time2}: [${p}]`;
      }).join('%0A')}`;
    }

    let message = `*LEOBET PRO - RECIBO*%0A%0A👤 *CLIENTE:* ${vendaRealizada.cliente}%0A🎟️ *CONCURSO:* ${vendaRealizada.eventoNome}%0A💰 *VALOR:* R$ ${vendaRealizada.valorTotal.toFixed(2)}%0A✅ *STATUS:* ${vendaRealizada.status === 'pago' ? 'VALIDADO' : 'PENDENTE'}${palpitesTexto}%0A%0A*CONFERIR:* ${link}`;
    window.open(`https://api.whatsapp.com/send?phone=55${vendaRealizada.whatsapp}&text=${message}`, '_blank');
  };

  const printBluetooth = async () => {
    if (!vendaRealizada) return;
    toast({ title: "Buscando Impressora...", description: "Inicie o pareamento com o dispositivo Bluetooth." });
    setTimeout(() => { window.print(); }, 500);
  };

  const userTotalBalance = (user?.balance || 0) + (user?.commissionBalance || 0);

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-end print:hidden">
            <div>
              <h1 className="text-3xl font-black uppercase text-primary leading-none tracking-tighter">Terminal de Vendas</h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Sorteios e Bolões Auditados</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className="bg-primary text-white font-black px-4 py-2 text-sm rounded-xl shadow-lg">
                 SALDO: R$ {user?.role === 'admin' ? 'ILIMITADO' : userTotalBalance.toFixed(2)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white print:hidden">
              <CardContent className="p-8">
                <form onSubmit={handleVenda} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="uppercase text-[9px] font-black opacity-60">Apostador</Label>
                      <Input placeholder="NOME" value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value.toUpperCase()})} required className="font-bold h-11" />
                    </div>
                    <div className="space-y-1">
                      <Label className="uppercase text-[9px] font-black opacity-60">WhatsApp</Label>
                      <Input placeholder="DDD + NÚMERO" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} required className="font-bold h-11" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="uppercase text-[9px] font-black opacity-60">Concurso</Label>
                    <select 
                      className="w-full h-12 border-2 rounded-xl px-3 font-bold bg-white focus:border-primary"
                      value={formData.eventoId}
                      onChange={e => handleSelectEvent(e.target.value)}
                      required
                    >
                      <option value="">-- SELECIONE --</option>
                      {eventosAtivos.map(e => <option key={e.id} value={e.id}>{e.tipo.toUpperCase()}: {e.nome} (R$ {e.preco.toFixed(2)})</option>)}
                    </select>
                  </div>

                  {selectedEvent?.tipo === 'bolao' && (
                    <div className="space-y-4 bg-muted/30 p-4 rounded-2xl border-2 border-dashed">
                      <h3 className="font-black uppercase text-xs flex items-center gap-2"><Trophy className="w-4 h-4 text-accent" /> Palpites (10 Jogos)</h3>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {(Array.isArray(selectedEvent.partidas) ? selectedEvent.partidas : []).map((p: any, i: number) => (
                          <div key={i} className="flex flex-col gap-1.5 p-2 bg-white rounded-xl border shadow-sm">
                             <div className="flex justify-between text-[8px] font-black uppercase opacity-60 px-1">
                                <span>#{i+1}</span>
                                <span className="truncate">{p.time1 || 'CASA'} vs {p.time2 || 'FORA'}</span>
                             </div>
                             <div className="grid grid-cols-3 gap-2">
                                {['1', 'X', '2'].map((val) => (
                                  <Button 
                                    key={val}
                                    type="button" 
                                    onClick={() => handleSetPalpite(i, val)} 
                                    variant={bolaoPalpites[i] === val ? 'default' : 'outline'}
                                    className="h-8 text-[10px] font-black"
                                  >
                                    {val}
                                  </Button>
                                ))}
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-2xl text-primary/30">R$</span>
                     <Input 
                      type="number" 
                      value={formData.valorTotal} 
                      readOnly
                      className="h-20 text-4xl font-black text-center border-primary/20 bg-primary/5 rounded-2xl pl-12" 
                    />
                  </div>

                  <Button type="submit" className="w-full h-16 font-black uppercase text-lg shadow-xl rounded-2xl bg-primary hover:bg-primary/90" disabled={loading}>
                    {loading ? "PROCESSANDO..." : "FINALIZAR BILHETE"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {vendaRealizada ? (
                <div className="bg-[#FFFFF0] p-8 shadow-2xl border border-black/10 font-mono text-[10px] rounded-[2.5rem] relative overflow-hidden">
                   <div className="text-center border-b-2 border-dashed border-black/20 pb-4 mb-4">
                      <p className="text-2xl font-black text-primary tracking-tighter">LEOBET PRO</p>
                      <p className="font-bold uppercase tracking-[0.3em] text-[7px] mt-1">Comprovante de Aposta</p>
                   </div>
                   
                   <div className="space-y-1.5 mb-4 text-[9px] uppercase font-bold relative z-10">
                      <p className="flex justify-between"><span>CLIENTE:</span> <span className="text-right">{vendaRealizada.cliente}</span></p>
                      <p className="flex justify-between"><span>EVENTO:</span> <span className="text-right">{vendaRealizada.eventoNome}</span></p>
                      <p className="flex justify-between"><span>DATA:</span> <span className="text-right">{new Date(vendaRealizada.data).toLocaleString()}</span></p>
                   </div>

                   <div className="my-4 border-y-2 border-dashed border-black/20 py-4 space-y-3 relative z-10">
                      {vendaRealizada.tickets.map((t: any, i: number) => (
                        <div key={i} className="bg-black/5 p-3 rounded-xl">
                          <p className="font-black flex justify-between text-[8px] mb-2">
                            <span>BILHETE #{i+1}</span>
                            <span className="text-primary">{t.id}</span>
                          </p>
                          <p className="text-[10px] font-black leading-relaxed break-all">
                             {t.numeros ? `NÚMEROS: ${t.numeros.join(' - ')}` : `PALPITES: ${t.palpite}`}
                          </p>
                        </div>
                      ))}
                   </div>

                   <div className="text-center space-y-3 relative z-10">
                      <p className="text-3xl font-black">R$ {vendaRealizada.valorTotal.toFixed(2)}</p>
                      <Badge variant={vendaRealizada.status === 'pago' ? 'default' : 'destructive'} className="uppercase font-black px-8 py-1 text-[10px] rounded-full">
                         {vendaRealizada.status === 'pago' ? '✓ APOSTA VALIDADA' : '⚠ AGUARDANDO PAGAMENTO'}
                      </Badge>
                   </div>

                   <div className="mt-8 flex flex-col gap-2 print:hidden relative z-10">
                      <Button onClick={handleWhatsApp} className="w-full h-12 bg-green-600 hover:bg-green-700 font-black uppercase text-xs text-white rounded-xl shadow-lg">
                        <Send className="w-4 h-4 mr-2" /> Enviar WhatsApp
                      </Button>
                      <Button onClick={printBluetooth} variant="outline" className="w-full h-12 font-black uppercase text-xs rounded-xl border-2 gap-2">
                        <Smartphone className="w-4 h-4" /> Impressão Bluetooth
                      </Button>
                   </div>
                </div>
              ) : (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-4 border-dashed rounded-[3.5rem] opacity-20 bg-white">
                   <div className="bg-muted p-8 rounded-full mb-6">
                      <TicketIcon className="w-24 h-24 text-primary" />
                   </div>
                   <h3 className="text-xl font-black uppercase text-primary tracking-widest text-center px-12 leading-none mb-2">Aguardando Venda</h3>
                   <p className="font-bold text-[10px] uppercase opacity-60 text-center px-12">Selecione um concurso para começar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E3A8A; border-radius: 10px; }
      `}</style>
    </div>
  );
}
