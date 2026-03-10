
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Printer, Send, Ticket as TicketIcon } from 'lucide-react';
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
    const nums: number[] = [];
    while (nums.length < count) {
      const n = Math.floor(Math.random() * max) + 1;
      if (!nums.includes(n)) nums.push(n);
    }
    return nums.sort((a, b) => a - b);
  };

  const handleVenda = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanPhone = formData.whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast({ 
        variant: "destructive", 
        title: "DDD OBRIGATÓRIO", 
        description: "Informe o telefone completo com DDD (ex: 82993343941)" 
      });
      return;
    }

    const ev = eventosAtivos.find(evItem => evItem.id === formData.eventoId);
    if (!ev) {
      toast({ variant: "destructive", title: "CONCURSO INDISPONÍVEL" });
      return;
    }

    const totalCents = Math.round(formData.valorTotal * 100);
    const unitCents = Math.round(formData.unitario * 100);

    if (totalCents % unitCents !== 0) {
      toast({ variant: "destructive", title: "VALOR INVÁLIDO", description: `Múltiplos de R$ ${formData.unitario.toFixed(2)}` });
      return;
    }

    const qtd = Math.floor(totalCents / unitCents);
    const hasEnoughBalance = user?.role === 'admin' || (user?.balance || 0) >= formData.valorTotal;
    const statusVenda = hasEnoughBalance ? 'pago' : 'pendente';

    setLoading(true);
    setTimeout(() => {
      const tickets: any[] = [];
      for(let i=0; i<qtd; i++) {
        tickets.push({
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
        tickets,
        qtd
      };

      const all = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
      localStorage.setItem('leobet_tickets', JSON.stringify([...all, receipt]));

      if (hasEnoughBalance && user?.role !== 'admin') {
        const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
        localStorage.setItem('leobet_users', JSON.stringify(allUsers.map((u: any) => 
          u.id === user?.id ? { ...u, balance: u.balance - formData.valorTotal } : u
        )));
      }

      setVendaRealizada(receipt);
      setLoading(false);
      toast({ title: statusVenda === 'pago' ? "VENDA REALIZADA!" : "AGUARDANDO APROVAÇÃO" });
    }, 800);
  };

  const handleWhatsApp = () => {
    if (!vendaRealizada) return;
    
    const host = window.location.origin;
    const link = `${host}/resultados?c=${vendaRealizada.tickets[0].id}`;
    
    let message = `*LEOBET PRO - RECIBO OFICIAL*%0A%0A`;
    message += `👤 *CLIENTE:* ${vendaRealizada.cliente.toUpperCase()}%0A`;
    message += `🎟️ *CONCURSO:* ${vendaRealizada.eventoNome}%0A`;
    message += `💰 *VALOR:* R$ ${vendaRealizada.valorTotal.toFixed(2)}%0A`;
    message += `✅ *STATUS:* ${vendaRealizada.status.toUpperCase()}%0A`;
    message += `--------------------------%0A`;
    message += `📊 *ACOMPANHAR EM TEMPO REAL:*%0A${link}%0A`;
    message += `--------------------------%0A`;
    
    vendaRealizada.tickets.forEach((t: any, idx: number) => {
      message += `%0A🎫 *BILHETE ${idx + 1}:* ${t.id}%0A`;
      if (t.numeros) message += `🔢 *NÚMEROS:* ${t.numeros.join('-')}%0A`;
    });

    message += `%0A🍀 *Boa sorte!*`;
    window.open(`https://api.whatsapp.com/send?phone=55${vendaRealizada.whatsapp}&text=${message}`, '_blank');
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-end print:hidden">
            <h1 className="text-3xl font-black uppercase text-primary">Terminal de Vendas</h1>
            <Badge className="bg-primary text-white font-black px-4 py-2">
               SALDO: {user?.role === 'admin' ? 'ILIMITADO' : `R$ ${user?.balance.toFixed(2)}`}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="rounded-2xl border-none shadow-xl print:hidden">
              <CardContent className="p-8">
                <form onSubmit={handleVenda} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black">Nome Completo</Label>
                    <Input placeholder="NOME DO CLIENTE" value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} required />
                    <Label className="uppercase text-[10px] font-black mt-2">WhatsApp (DDD + NÚMERO)</Label>
                    <Input placeholder="82993343941" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} required />
                  </div>

                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black">Selecione o Concurso</Label>
                    <select 
                      className="w-full h-12 border-2 rounded-xl px-3 font-bold bg-white"
                      value={formData.eventoId}
                      onChange={e => {
                        const ev = eventosAtivos.find(evItem => evItem.id === e.target.value);
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
                      <option value="">-- SELECIONE O EVENTO --</option>
                      {eventosAtivos.map(e => <option key={e.id} value={e.id}>{e.nome} (R$ {e.preco.toFixed(2)})</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black">Valor Total (R$)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={formData.valorTotal} 
                      onChange={e => setFormData({...formData, valorTotal: Number(e.target.value)})} 
                      className="h-16 text-3xl font-black text-center border-primary/20 bg-primary/5" 
                    />
                  </div>

                  <Button type="submit" className="w-full h-16 font-black uppercase text-lg shadow-xl" disabled={loading}>
                    {loading ? "PROCESSANDO..." : "EMITIR APOSTA"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {vendaRealizada ? (
                <div className="bg-[#FFFFF0] p-8 shadow-2xl border border-black/10 font-mono text-[10px] receipt-thermal">
                   <div className="text-center border-b-2 border-dashed border-black/20 pb-4 mb-4">
                      <p className="text-xl font-black">LEOBET PRO</p>
                      <p className="font-bold uppercase">Recibo de Aposta</p>
                   </div>
                   
                   <div className="space-y-1 mb-4">
                      <p>DATA: {new Date(vendaRealizada.data).toLocaleString()}</p>
                      <p>CLIENTE: {vendaRealizada.cliente.toUpperCase()}</p>
                      <p>EVENTO: {vendaRealizada.eventoNome.toUpperCase()}</p>
                   </div>

                   <div className="my-4 border-y-2 border-dashed border-black/20 py-4 space-y-4">
                      {vendaRealizada.tickets.map((t: any, i: number) => (
                        <div key={i} className="bg-black/5 p-2 rounded">
                          <p className="font-bold flex justify-between">
                            <span>BILHETE #{i+1}</span>
                            <span>ID: {t.id}</span>
                          </p>
                          <p className="text-[9px] break-all">
                             {t.numeros ? `NÚMEROS: ${t.numeros.join('-')}` : `PALPITES: ${t.palpite}`}
                          </p>
                        </div>
                      ))}
                   </div>

                   <div className="text-center space-y-2 mb-4">
                      <p className="text-lg font-black">TOTAL: R$ {vendaRealizada.valorTotal.toFixed(2)}</p>
                      <Badge variant={vendaRealizada.status === 'pago' ? 'default' : 'destructive'} className="uppercase font-black">
                         {vendaRealizada.status === 'pago' ? 'APOSTA CONFIRMADA' : 'PENDENTE'}
                      </Badge>
                   </div>

                   <div className="mt-8 flex gap-2 print:hidden">
                      <Button onClick={() => window.print()} variant="outline" className="flex-1 h-12 font-black uppercase text-[10px]">PDF / IMPRIMIR</Button>
                      <Button onClick={handleWhatsApp} className="flex-1 h-12 bg-green-600 hover:bg-green-700 font-black uppercase text-[10px] text-white">ENVIAR WHATSAPP</Button>
                   </div>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-4 border-dashed rounded-3xl opacity-20">
                   <TicketIcon className="w-20 h-20 mb-4" />
                   <p className="font-black uppercase text-xs">Aguardando Venda...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
