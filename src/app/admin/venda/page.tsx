"use client"

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, User, Ticket, Smartphone, Printer, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VendaPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    cliente: '',
    whatsapp: '',
    evento: '',
    tipo: 'bingo',
    valor: 10,
  });
  const [vendaRealizada, setVendaRealizada] = useState<any>(null);

  const handleVenda = (e: React.FormEvent) => {
    e.preventDefault();
    const receipt = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      data: new Date().toLocaleString(),
      ...formData
    };
    setVendaRealizada(receipt);
    toast({ title: "Venda registrada com sucesso!" });
  };

  const shareWhatsApp = () => {
    const text = `*LEOBET PRO - RECIBO DE APOSTA*\n\n` +
      `Bilhete: ${vendaRealizada.id}\n` +
      `Cliente: ${vendaRealizada.cliente}\n` +
      `Evento: ${vendaRealizada.evento}\n` +
      `Valor: R$ ${vendaRealizada.valor}\n` +
      `Data: ${vendaRealizada.data}\n\n` +
      `Boa sorte! Acompanhe em leobet.pro`;
    
    window.open(`https://wa.me/55${vendaRealizada.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-black font-headline uppercase">Balcão de Vendas</h1>
            <p className="text-muted-foreground">Registre apostas para clientes físicos ou remotos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                  <Ticket className="w-4 h-4" /> Dados do Bilhete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVenda} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Cliente</Label>
                    <Input 
                      placeholder="Ex: João Silva" 
                      value={formData.cliente}
                      onChange={e => setFormData({...formData, cliente: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input 
                      placeholder="DDD + Número" 
                      value={formData.whatsapp}
                      onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Evento / Concurso</Label>
                    <Input 
                      placeholder="Selecione o bingo ou bolão" 
                      value={formData.evento}
                      onChange={e => setFormData({...formData, evento: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <select 
                        className="w-full h-10 px-3 border rounded-md"
                        value={formData.tipo}
                        onChange={e => setFormData({...formData, tipo: e.target.value})}
                      >
                        <option value="bingo">Bingo</option>
                        <option value="bolao">Bolão</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor (R$)</Label>
                      <Input 
                        type="number" 
                        value={formData.valor}
                        onChange={e => setFormData({...formData, valor: Number(e.target.value)})}
                        required 
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-primary font-black uppercase">Emitir Bilhete</Button>
                </form>
              </CardContent>
            </Card>

            <Card className={vendaRealizada ? "border-accent border-2 shadow-xl" : "opacity-50"}>
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                  <Printer className="w-4 h-4 text-accent" /> Recibo Gerado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {vendaRealizada ? (
                  <>
                    <div className="bg-muted p-6 rounded-lg font-code text-xs space-y-2 border-dashed border-2">
                      <p className="text-center font-black text-sm">LEOBET PRO</p>
                      <hr />
                      <p>BILHETE: {vendaRealizada.id}</p>
                      <p>DATA: {vendaRealizada.data}</p>
                      <p>CLIENTE: {vendaRealizada.cliente}</p>
                      <p>EVENTO: {vendaRealizada.evento}</p>
                      <p>VALOR: R$ {vendaRealizada.valor.toFixed(2)}</p>
                      <hr />
                      <p className="text-center">Boa Sorte!</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={shareWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700 gap-2">
                        <Send className="w-4 h-4" /> WhatsApp
                      </Button>
                      <Button variant="outline" className="flex-1 gap-2" onClick={() => window.print()}>
                        <Printer className="w-4 h-4" /> Imprimir
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="py-20 text-center text-muted-foreground italic">
                    Preencha os dados ao lado para gerar o comprovante.
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
