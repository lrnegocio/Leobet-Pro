
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Printer, Send, Ticket as TicketIcon, AlertCircle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/use-auth-store';

export default function VendaPage() {
  const { toast } = useToast();
  const { user, setUser } = useAuthStore();
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
      const startDate = new Date(b.dataFim); 
      const limit = new Date(startDate.getTime() - 60000);
      return b.status === 'aberto' && now < limit;
    });
    setEventosAtivos([...bingos.map(b => ({...b, tipo: 'bingo'})), ...boloes.map(b => ({...b, tipo: 'bolao'}))]);
  };

  useEffect(() => {
    loadEventos();
    const interval = setInterval(loadEventos, 10000);
    return () => clearInterval(interval);
  }, []);

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

    const ev = eventosAtivos.find(evItem => String(evItem.id) === String(formData.eventoId));
    if (!ev) {
      toast({ variant: "destructive", title: "CONCURSO INDISPONÍVEL" });
      return;
    }

    const totalCents = Math.round(formData.valorTotal * 100);
    const unitCents = Math.round(formData.unitario * 100);

    if (totalCents < unitCents || (unitCents > 0 && totalCents % unitCents !== 0)) {
      toast({ variant: "destructive", title: "VALOR INVÁLIDO", description: `Múltiplos de R$ ${formData.unitario.toFixed(2)}` });
      return;
    }

    const qtd = unitCents > 0 ? Math.floor(totalCents / unitCents) : 1;
    const totalBalance = (user?.balance || 0) + (user?.commissionBalance || 0);
    
    const hasEnoughBalance = user?.role === 'admin' || totalBalance >= formData.valorTotal;
    const statusVenda = hasEnoughBalance ? 'pago' : 'pendente';

    setLoading(true);
    setTimeout(() => {
      const ticketsGenerated: any[] = [];
      for(let i=0; i<qtd; i++) {
        ticketsGenerated.push({
          id: Math.random().toString().substring(2, 13),
          numeros: formData.tipo === 'bingo' ? generateUniqueNumbers(15, 90) : null,
          palpite: formData.tipo === 'bolao' ? formData.palpite : null,
          status: 'aberto'
        });
      }

      const receipt = {
        id: Math.random().toString(36).substring(7).toUpperCase(),
        data: new Date().toISOString(),
        status: statusVenda,
        vendedorId: user?.id,
        vendedorNome: user?.nome,
        vendedorRole: user?.role,
        gerenteId: user?.gerenteId || (user?.role === 'cambista' ? 'admin-master' : undefined),
        ...formData,
        whatsapp: cleanPhone,
        tickets: ticketsGenerated,
        qtd
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

            if (newComm >= remaining) {
              newComm -= remaining;
              remaining = 0;
            } else {
              remaining -= newComm;
              newComm = 0;
              newBal -= remaining;
            }

            // Precisão Decimal: Admin 20%, Cambista 10%, Gerente 5%.
            // Se gerente vende: 10% (seller) + 5% (manager) = 15%.
            const myCommRate = user?.role === 'cambista' ? 0.10 : user?.role === 'gerente' ? 0.15 : 0;
            const myComm = formData.valorTotal * myCommRate;
            newComm += myComm;

            return { ...u, balance: newBal, commissionBalance: newComm };
          }
          // Se cambista vende, o gerente dele ganha 5%
          if (user?.role === 'cambista' && user?.gerenteId && u.id === user.gerenteId) {
             const mgrComm = formData.valorTotal * 0.05;
             return { ...u, commissionBalance: (u.commissionBalance || 0) + mgrComm };
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
        toast({ variant: "destructive", title: "AGUARDANDO APROVAÇÃO MASTER", description: "Venda sem saldo. O bilhete só será válido após validação do Admin." });
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
    let message = `*LEOBET PRO - RECIBO*%0A%0A👤 *CLIENTE:* ${vendaRealizada.cliente}%0A🎟️ *CONCURSO:* ${vendaRealizada.eventoNome}%0A💰 *VALOR:* R$ ${vendaRealizada.valorTotal.toFixed(2)}%0A✅ *STATUS:* ${vendaRealizada.status === 'pago' ? 'VALIDADO' : 'PENDENTE'}%0A%0A*CONFERIR:* ${link}`;
    window.open(`https://api.whatsapp.com/send?phone=55${vendaRealizada.whatsapp}&text=${message}`, '_blank');
  };

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-end print:hidden">
            <div>
              <h1 className="text-3xl font-black uppercase text-primary leading-none">Venda Rápida</h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Terminal Profissional 365 Dias</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className="bg-primary text-white font-black px-4 py-2 text-sm rounded-xl shadow-lg">
                 SALDO TOTAL: R$ {user?.role === 'admin' ? 'ILIMITADO' : ((user?.balance || 0) + (user?.commissionBalance || 0)).toFixed(2)}
              </Badge>
              {user?.role !== 'admin' && (
                 <p className="text-[9px] font-black uppercase text-orange-600">Vendas sem saldo ficam bloqueadas até aprovação master.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="rounded-[2rem] border-none shadow-2xl overflow-hidden bg-white print:hidden">
              <CardContent className="p-8">
                <form onSubmit={handleVenda} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="uppercase text-[10px] font-black opacity-60">Nome do Apostador</Label>
                      <Input placeholder="NOME DO CLIENTE" value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value.toUpperCase()})} required className="font-bold h-12 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <Label className="uppercase text-[10px] font-black opacity-60">WhatsApp</Label>
                      <Input placeholder="DDD + NÚMERO" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} required className="font-bold h-12 rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="uppercase text-[10px] font-black opacity-60">Selecione o Concurso</Label>
                    <select 
                      className="w-full h-12 border-2 rounded-xl px-3 font-bold bg-white focus:border-primary"
                      value={formData.eventoId}
                      onChange={e => {
                        const ev = eventosAtivos.find(evItem => String(evItem.id) === String(e.target.value));
                        setFormData({
                          ...formData, 
                          eventoId: e.target.value, 
                          eventoNome: ev?.nome || '', 
                          unitario: ev?.preco || 0, 
                          valorTotal: ev?.preco || 0,
                          tipo: ev?.tipo || 'bingo'
                        });
                      }}
                      required
                    >
                      <option value="">-- CONCURSOS ABERTOS --</option>
                      {eventosAtivos.map(e => <option key={e.id} value={e.id}>{e.nome} (R$ {e.preco.toFixed(2)})</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="uppercase text-[10px] font-black opacity-60 text-center block">Valor do Jogo (R$)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={formData.valorTotal} 
                      onChange={e => setFormData({...formData, valorTotal: Number(e.target.value)})} 
                      className="h-20 text-4xl font-black text-center border-primary/20 bg-primary/5 rounded-2xl" 
                    />
                  </div>

                  <Button type="submit" className="w-full h-16 font-black uppercase text-lg shadow-xl rounded-2xl bg-primary" disabled={loading}>
                    {loading ? "VALIDANDO..." : "CONCLUIR VENDA"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {vendaRealizada ? (
                <div className="bg-[#FFFFF0] p-8 shadow-2xl border border-black/10 font-mono text-[10px] rounded-[2rem]">
                   <div className="text-center border-b-2 border-dashed border-black/20 pb-4 mb-4">
                      <p className="text-2xl font-black text-primary">LEOBET PRO</p>
                      <p className="font-bold uppercase tracking-widest text-[8px]">Bilhete de Aposta Oficial</p>
                   </div>
                   
                   <div className="space-y-1 mb-4 text-[9px] uppercase font-bold">
                      <p className="flex justify-between"><span>CLIENTE:</span> <span>{vendaRealizada.cliente}</span></p>
                      <p className="flex justify-between"><span>EVENTO:</span> <span>{vendaRealizada.eventoNome}</span></p>
                      <p className="flex justify-between"><span>DATA:</span> <span>{new Date(vendaRealizada.data).toLocaleString()}</span></p>
                   </div>

                   <div className="my-4 border-y-2 border-dashed border-black/20 py-4 space-y-3">
                      {vendaRealizada.tickets.map((t: any, i: number) => (
                        <div key={i} className="bg-black/5 p-3 rounded-xl">
                          <p className="font-black flex justify-between text-[8px] mb-1">
                            <span>ID BILHETE</span>
                            <span className="text-primary">{t.id}</span>
                          </p>
                          <p className="text-[9px] opacity-70">
                             {t.numeros ? `NÚMEROS: ${t.numeros.join('-')}` : `PALPITE: ${t.palpite}`}
                          </p>
                        </div>
                      ))}
                   </div>

                   <div className="text-center space-y-2">
                      <p className="text-2xl font-black">R$ {vendaRealizada.valorTotal.toFixed(2)}</p>
                      <Badge variant={vendaRealizada.status === 'pago' ? 'default' : 'destructive'} className="uppercase font-black px-6">
                         {vendaRealizada.status === 'pago' ? '✓ VALIDADO' : '⚠ AGUARDANDO APROVAÇÃO'}
                      </Badge>
                   </div>

                   <div className="mt-8 flex flex-col gap-2 print:hidden">
                      <Button onClick={handleWhatsApp} className="w-full h-12 bg-green-600 hover:bg-green-700 font-black uppercase text-xs text-white rounded-xl">
                        <Send className="w-4 h-4 mr-2" /> Enviar p/ Cliente
                      </Button>
                      <Button onClick={() => window.print()} variant="outline" className="w-full h-12 font-black uppercase text-xs rounded-xl border-2">
                        <Printer className="w-4 h-4 mr-2" /> Imprimir / PDF
                      </Button>
                   </div>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-4 border-dashed rounded-[3rem] opacity-20 bg-white">
                   <TicketIcon className="w-20 h-20 mb-4 text-primary" />
                   <p className="font-black uppercase text-xs tracking-widest text-center px-8">Aguardando Nova Venda...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
