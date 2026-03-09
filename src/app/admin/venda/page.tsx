
"use client"

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, User, Ticket, Smartphone, Printer, Send, Search, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function VendaPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cliente: '',
    whatsapp: '',
    evento: '',
    tipo: 'bingo',
    valor: 10,
    palpite: '', // Usado para Bolão
  });
  const [vendaRealizada, setVendaRealizada] = useState<any>(null);

  const handleVenda = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulação de registro de venda
    setTimeout(() => {
      const receipt = {
        id: "LB-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
        data: new Date().toLocaleString('pt-BR'),
        ...formData
      };
      setVendaRealizada(receipt);
      setLoading(false);
      toast({ title: "Venda efetuada!", description: "Bilhete gerado com sucesso." });
    }, 800);
  };

  const shareWhatsApp = () => {
    const text = `*LEOBET PRO - COMPROVANTE DE APOSTA*\n\n` +
      `🎟️ *BILHETE:* ${vendaRealizada.id}\n` +
      `👤 *CLIENTE:* ${vendaRealizada.cliente}\n` +
      `📅 *DATA:* ${vendaRealizada.data}\n` +
      `🎯 *EVENTO:* ${vendaRealizada.evento}\n` +
      `💰 *VALOR:* R$ ${vendaRealizada.valor.toFixed(2)}\n` +
      (vendaRealizada.tipo === 'bolao' ? `⚽ *PALPITE:* ${vendaRealizada.palpite}\n` : '') +
      `\n🍀 *Boa sorte! Acompanhe os resultados em leobet.pro*`;
    
    window.open(`https://wa.me/55${vendaRealizada.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase tracking-tight text-primary">Terminal de Vendas</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Emissão instantânea de bilhetes</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border flex items-center gap-3">
              <div className="text-right">
                <p className="text-[9px] font-black uppercase text-muted-foreground">Caixa Aberto</p>
                <p className="text-sm font-black text-green-600">R$ 1.250,00</p>
              </div>
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-primary" /> Formulário de Venda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVenda} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase">Cliente</Label>
                      <Input 
                        placeholder="Nome completo" 
                        value={formData.cliente}
                        onChange={e => setFormData({...formData, cliente: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase">WhatsApp</Label>
                      <Input 
                        placeholder="Ex: 81999999999" 
                        value={formData.whatsapp}
                        onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase">Tipo de Aposta</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        type="button" 
                        variant={formData.tipo === 'bingo' ? 'default' : 'outline'}
                        onClick={() => setFormData({...formData, tipo: 'bingo'})}
                        className="font-black uppercase text-xs"
                      >
                        Bingo Virtual
                      </Button>
                      <Button 
                        type="button" 
                        variant={formData.tipo === 'bolao' ? 'default' : 'outline'}
                        onClick={() => setFormData({...formData, tipo: 'bolao'})}
                        className="font-black uppercase text-xs"
                      >
                        Bolão Esportivo
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase">Evento Disponível</Label>
                    <select 
                      className="w-full h-10 px-3 border rounded-md text-sm font-medium"
                      value={formData.evento}
                      onChange={e => setFormData({...formData, evento: e.target.value})}
                      required
                    >
                      <option value="">Selecione um concurso...</option>
                      <option value="Bingo Especial 01">Bingo Especial 01 (R$ 10,00)</option>
                      <option value="Rodada Brasileirão">Rodada Brasileirão (R$ 5,00)</option>
                    </select>
                  </div>

                  {formData.tipo === 'bolao' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <Label className="text-xs font-black uppercase text-accent">Palpite (1, X ou 2)</Label>
                      <Input 
                        placeholder="Ex: 1 - X - 2 - 1..." 
                        value={formData.palpite}
                        onChange={e => setFormData({...formData, palpite: e.target.value})}
                        required 
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase">Valor (R$)</Label>
                    <Input 
                      type="number" 
                      value={formData.valor}
                      onChange={e => setFormData({...formData, valor: Number(e.target.value)})}
                      className="font-black text-lg text-primary"
                      required 
                    />
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-black uppercase h-12" disabled={loading}>
                    {loading ? "Processando..." : "Emitir Bilhete Agora"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className={vendaRealizada ? "border-accent border-2 shadow-2xl animate-in zoom-in-95" : "opacity-40"}>
              <CardHeader className="bg-muted/50 border-b">
                <CardTitle className="text-xs font-black uppercase flex items-center justify-between">
                  <span className="flex items-center gap-2"><Printer className="w-4 h-4 text-accent" /> Comprovante Digital</span>
                  {vendaRealizada && <Badge className="bg-green-600">VALIDADO</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {vendaRealizada ? (
                  <div className="p-8 space-y-8">
                    <div className="bg-white p-6 border-2 border-dashed border-muted-foreground/30 font-code text-[11px] leading-relaxed relative overflow-hidden">
                       <div className="absolute top-2 right-2 opacity-10"><CheckCircle2 className="w-12 h-12" /></div>
                       <div className="text-center border-b pb-4 mb-4">
                          <p className="font-black text-lg tracking-tighter">LEOBET PRO</p>
                          <p className="uppercase text-[8px] tracking-[3px] opacity-60">Sorte e Diversão</p>
                       </div>
                       <div className="space-y-1">
                          <p className="flex justify-between"><span>BILHETE:</span> <span className="font-black">{vendaRealizada.id}</span></p>
                          <p className="flex justify-between"><span>DATA:</span> <span>{vendaRealizada.data}</span></p>
                          <p className="flex justify-between"><span>CLIENTE:</span> <span className="font-black">{vendaRealizada.cliente}</span></p>
                          <p className="flex justify-between"><span>EVENTO:</span> <span className="font-black uppercase">{vendaRealizada.evento}</span></p>
                          <p className="flex justify-between border-t pt-2 mt-2">
                             <span className="text-xs font-black">VALOR TOTAL:</span> 
                             <span className="text-xs font-black">R$ {vendaRealizada.valor.toFixed(2)}</span>
                          </p>
                          {vendaRealizada.tipo === 'bolao' && (
                            <div className="mt-4 pt-4 border-t border-dotted">
                              <p className="font-black uppercase mb-1">Palpites:</p>
                              <p className="bg-muted p-2 rounded text-center font-black tracking-widest">{vendaRealizada.palpite}</p>
                            </div>
                          )}
                       </div>
                       <div className="text-center mt-6 pt-4 border-t opacity-40">
                          <p>Verifique seus bilhetes em leobet.pro</p>
                          <p>Obrigado e boa sorte!</p>
                       </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <Button onClick={shareWhatsApp} className="w-full bg-green-600 hover:bg-green-700 font-black uppercase gap-2 h-11">
                        <Send className="w-4 h-4" /> Enviar para WhatsApp
                      </Button>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="font-black uppercase gap-2" onClick={() => window.print()}>
                          <Printer className="w-4 h-4" /> Imprimir
                        </Button>
                        <Button variant="secondary" className="font-black uppercase" onClick={() => setVendaRealizada(null)}>
                          Nova Venda
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-32 text-center px-12 space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                      <Search className="w-8 h-8" />
                    </div>
                    <p className="text-muted-foreground text-sm font-medium italic">
                      Aguardando preenchimento dos dados ao lado para gerar o comprovante oficial.
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
