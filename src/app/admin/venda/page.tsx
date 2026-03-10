
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Printer, Send, Ticket as TicketIcon, AlertTriangle } from 'lucide-react';
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
  }, []);

  const handleVenda = (e: React.FormEvent) => {
    e.preventDefault();
    const ev = eventosAtivos.find(e => e.id === formData.eventoId);
    if (!ev) {
      toast({ variant: "destructive", title: "CONCURSO ENCERRADO" });
      return;
    }

    const totalCents = Math.round(formData.valorTotal * 100);
    const unitCents = Math.round(formData.unitario * 100);

    if (totalCents % unitCents !== 0) {
      toast({ variant: "destructive", title: "VALOR INVÁLIDO", description: "O valor deve ser múltiplo exato do preço." });
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
          numeros: formData.tipo === 'bingo' ? Array.from({length: 15}, () => Math.floor(Math.random() * 90) + 1).sort((a,b) => a-b) : null,
          palpite: formData.tipo === 'bolao' ? formData.palpite : null,
          status: 'aberto'
        });
      }

      const receipt = {
        id: Math.random().toString(36).substring(7).toUpperCase(),
        data: new Date().toISOString(),
        status: statusVenda,
        vendedorId: user?.id,
        vendedorRole: user?.role,
        vendedorNome: user?.nome,
        gerenteId: user?.gerenteId,
        ...formData,
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

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <h1 className="text-3xl font-black uppercase text-primary">Terminal de Vendas</h1>
            <Badge className="bg-primary text-white font-black px-4 py-2">SALDO: {user?.role === 'admin' ? 'ILIMITADO' : `R$ ${user?.balance.toFixed(2)}`}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="rounded-2xl border-none shadow-xl">
              <CardContent className="p-8">
                <form onSubmit={handleVenda} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black">Apostador</Label>
                    <Input placeholder="NOME DO CLIENTE" value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} required />
                    <Input placeholder="WHATSAPP" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} required />
                  </div>

                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black">Concurso</Label>
                    <select 
                      className="w-full h-10 border rounded-md px-3 font-bold bg-white"
                      value={formData.eventoId}
                      onChange={e => {
                        const ev = eventosAtivos.find(evItem => evItem.id === e.target.value);
                        setFormData({...formData, eventoId: e.target.value, eventoNome: ev?.nome || '', unitario: ev?.preco || 0, valorTotal: ev?.preco || 0});
                      }}
                    >
                      <option value="">-- SELECIONE --</option>
                      {eventosAtivos.map(e => <option key={e.id} value={e.id}>{e.nome} (R$ {e.preco.toFixed(2)})</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black">Valor Total (Múltiplos de R$ {formData.unitario.toFixed(2)})</Label>
                    <Input type="number" step="0.01" value={formData.valorTotal} onChange={e => setFormData({...formData, valorTotal: Number(e.target.value)})} className="h-16 text-2xl font-black text-center" />
                  </div>

                  <Button type="submit" className="w-full h-14 font-black uppercase text-lg" disabled={loading}>
                    {loading ? "PROCESSANDO..." : "EMITIR RECIBO"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {vendaRealizada ? (
                <div className="bg-[#FFFFF0] p-6 shadow-xl border rounded-sm font-mono text-[10px]">
                   <div className="text-center border-b border-dashed pb-4 mb-4">
                      <p className="text-lg font-black">LEOBET PRO</p>
                      <p>RECIBO ÚNICO DE APOSTA</p>
                   </div>
                   <p>DATA: {new Date(vendaRealizada.data).toLocaleString()}</p>
                   <p>CLIENTE: {vendaRealizada.cliente.toUpperCase()}</p>
                   <p>EVENTO: {vendaRealizada.eventoNome.toUpperCase()}</p>
                   <div className="my-4 border-y border-dashed py-4">
                      {vendaRealizada.tickets.map((t: any, i: number) => (
                        <div key={i} className="mb-2">
                          <p className="font-bold">BILHETE {i+1}: {t.id}</p>
                          <p>{t.numeros ? t.numeros.join('-') : t.palpite}</p>
                        </div>
                      ))}
                   </div>
                   <p className="font-black text-center">VALOR TOTAL: R$ {vendaRealizada.valorTotal.toFixed(2)}</p>
                   <p className="text-center mt-4">ACOMPANHE: {window.location.host}/resultados?c={vendaRealizada.tickets[0].id}</p>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed rounded-2xl opacity-20 italic">Aguardando Aposta...</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
