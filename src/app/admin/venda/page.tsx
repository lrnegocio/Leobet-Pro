
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Ticket, Printer, Send, Search, CheckCircle2, AlertCircle } from 'lucide-react';
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
    valor: 10,
    palpite: '', 
  });
  const [vendaRealizada, setVendaRealizada] = useState<any>(null);

  useEffect(() => {
    const bingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]').filter((b: any) => b.status === 'aberto');
    const boloes = JSON.parse(localStorage.getItem('leobet_boloes') || '[]').filter((b: any) => b.status === 'aberto');
    setEventosAtivos([...bingos, ...boloes]);
  }, []);

  const handleVenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventoId) {
        toast({ variant: "destructive", title: "Erro", description: "Selecione um concurso." });
        return;
    }
    setLoading(true);
    
    setTimeout(() => {
      const ticketId = Math.random().toString().substring(2, 13);
      const isPending = (user?.balance || 0) < formData.valor;
      
      const receipt = {
        id: ticketId,
        data: new Date().toLocaleString('pt-BR'),
        status: isPending ? 'pendente' : 'pago',
        ...formData
      };
      
      setVendaRealizada(receipt);
      setLoading(false);
      
      if (isPending) {
        toast({ variant: "destructive", title: "Pendente", description: "Aguardando aprovação de saldo." });
      } else {
        toast({ title: "Sucesso!", description: "Bilhete emitido com sucesso." });
      }
    }, 800);
  };

  const shareWhatsApp = () => {
    if (!vendaRealizada) return;
    const text = `*LEOBET PRO - RECIBO*\n\n` +
      `🎟️ *BILHETE:* ${vendaRealizada.id}\n` +
      `👤 *CLIENTE:* ${vendaRealizada.cliente}\n` +
      `🎯 *CONCURSO:* ${vendaRealizada.eventoNome}\n` +
      `💰 *VALOR:* R$ ${vendaRealizada.valor.toFixed(2)}\n` +
      `📌 *STATUS:* ${vendaRealizada.status.toUpperCase()}\n` +
      (vendaRealizada.tipo === 'bolao' ? `⚽ *PALPITE:* ${vendaRealizada.palpite}\n` : '') +
      `\n📲 *Dúvidas/Suporte:* (82) 99334-3941\n` +
      `🍀 *Boa sorte!*`;
    
    window.open(`https://wa.me/55${vendaRealizada.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase tracking-tight text-primary">Balcão de Vendas</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Emissão de bilhetes 11 dígitos</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border flex items-center gap-3">
              <div className="text-right">
                <p className="text-[9px] font-black uppercase text-muted-foreground">Meu Saldo</p>
                <p className="text-sm font-black text-primary">R$ {(user?.balance || 0).toFixed(2)}</p>
              </div>
              <ShoppingCart className="w-5 h-5 text-accent" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-primary" /> Novo Bilhete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVenda} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-muted-foreground">Nome do Cliente</Label>
                      <Input 
                        placeholder="Nome" 
                        value={formData.cliente}
                        onChange={e => setFormData({...formData, cliente: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-muted-foreground">WhatsApp</Label>
                      <Input 
                        placeholder="DDD + Número" 
                        value={formData.whatsapp}
                        onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      type="button" 
                      variant={formData.tipo === 'bingo' ? 'default' : 'outline'}
                      onClick={() => {
                        setFormData({...formData, tipo: 'bingo', eventoId: '', eventoNome: ''});
                      }}
                      className="font-black uppercase text-xs h-12"
                    >
                      Bingo
                    </Button>
                    <Button 
                      type="button" 
                      variant={formData.tipo === 'bolao' ? 'default' : 'outline'}
                      onClick={() => {
                        setFormData({...formData, tipo: 'bolao', eventoId: '', eventoNome: ''});
                      }}
                      className="font-black uppercase text-xs h-12"
                    >
                      Bolão
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">Selecionar Concurso Ativo</Label>
                    <select 
                      className="w-full h-10 px-3 border-2 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                      value={formData.eventoId}
                      onChange={e => {
                        const opt = e.target.selectedOptions[0];
                        setFormData({
                          ...formData, 
                          eventoId: e.target.value,
                          eventoNome: opt.text,
                          valor: eventosAtivos.find(ev => ev.id === e.target.value)?.preco || 10
                        });
                      }}
                      required
                    >
                      <option value="">-- Escolha --</option>
                      {eventosAtivos.filter(ev => ev.tipo === formData.tipo).map((e: any) => (
                        <option key={e.id} value={e.id}>{e.nome}</option>
                      ))}
                    </select>
                  </div>

                  {formData.tipo === 'bolao' && (
                    <div className="p-4 bg-muted/50 rounded-xl space-y-3 border-2 border-accent/20">
                       <p className="text-[10px] font-black uppercase text-accent">Seu Palpite (Ex: 1-X-2-1...)</p>
                       <Input 
                        placeholder="Ex: 1-X-2-2-X-1-1-2-X-1" 
                        value={formData.palpite}
                        onChange={e => setFormData({...formData, palpite: e.target.value})}
                        required 
                        className="font-mono tracking-widest text-center"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">Valor da Aposta (R$)</Label>
                    <Input 
                      type="number" 
                      value={formData.valor}
                      onChange={e => setFormData({...formData, valor: Number(e.target.value)})}
                      className="font-black text-xl text-primary h-14 border-2"
                      required 
                    />
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-black uppercase h-14 text-lg shadow-lg" disabled={loading}>
                    {loading ? "Processando..." : "Emitir Bilhete"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className={vendaRealizada ? "border-accent border-2 shadow-2xl animate-in zoom-in-95" : "opacity-40"}>
              <CardHeader className="bg-muted/50 border-b">
                <CardTitle className="text-xs font-black uppercase flex items-center justify-between">
                  <span className="flex items-center gap-2"><Printer className="w-4 h-4 text-accent" /> Comprovante Digital</span>
                  {vendaRealizada && (
                    <Badge className={vendaRealizada.status === 'pago' ? 'bg-green-600' : 'bg-orange-500'}>
                      {vendaRealizada.status.toUpperCase()}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {vendaRealizada ? (
                  <div className="p-6 space-y-6">
                    <div id="printable-ticket" className="bg-white p-6 border-4 border-double border-primary/20 font-code text-[11px] leading-relaxed relative overflow-hidden shadow-inner">
                       <div className="absolute top-2 right-2 opacity-5"><CheckCircle2 className="w-16 h-16" /></div>
                       <div className="text-center border-b pb-4 mb-4">
                          <p className="font-black text-2xl tracking-tighter text-primary">LEOBET PRO</p>
                       </div>
                       <div className="space-y-2">
                          <div className="flex justify-between items-center border-b border-dashed pb-1">
                            <span>ID BILHETE:</span> 
                            <span className="font-black text-lg">{vendaRealizada.id}</span>
                          </div>
                          <p className="flex justify-between"><span>DATA/HORA:</span> <span>{vendaRealizada.data}</span></p>
                          <p className="flex justify-between"><span>CLIENTE:</span> <span className="font-black">{vendaRealizada.cliente}</span></p>
                          <p className="flex justify-between"><span>EVENTO:</span> <span className="font-black uppercase">{vendaRealizada.eventoNome}</span></p>
                          {vendaRealizada.tipo === 'bolao' && (
                            <div className="bg-muted p-2 rounded mt-2">
                               <p className="font-black tracking-widest break-all text-center">{vendaRealizada.palpite}</p>
                            </div>
                          )}
                          <div className="flex justify-between border-t-2 border-primary pt-2 mt-2">
                             <span className="text-sm font-black uppercase">TOTAL:</span> 
                             <span className="text-sm font-black text-primary">R$ {vendaRealizada.valor.toFixed(2)}</span>
                          </div>
                       </div>
                       <div className="text-center mt-6 pt-4 border-t border-dashed opacity-60 space-y-1">
                          <p className="font-bold">Suporte: (82) 99334-3941</p>
                       </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <Button onClick={shareWhatsApp} className="w-full bg-green-600 hover:bg-green-700 font-black uppercase gap-2 h-12 shadow-md">
                        <Send className="w-4 h-4" /> Enviar WhatsApp
                      </Button>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="font-black uppercase gap-2 h-11" onClick={() => window.print()}>
                          <Printer className="w-4 h-4" /> Imprimir
                        </Button>
                        <Button variant="secondary" className="font-black uppercase h-11" onClick={() => setVendaRealizada(null)}>
                          Nova Venda
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-32 text-center px-12 space-y-4">
                    <p className="text-muted-foreground text-sm font-medium italic">
                      Aguardando processamento de bilhete...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
