"use client"

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NovoBingoPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(10);
  const [quantity, setQuantity] = useState(0); // 0 = Ilimitado
  const [drawDate, setDrawDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Simulação de salvamento no Firebase
    setTimeout(() => {
      router.push('/admin/bingo');
    }, 800);
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <Link href="/admin/bingo" className="flex items-center gap-2 text-primary hover:underline font-bold">
            <ArrowLeft className="w-4 h-4" /> Voltar para Painel
          </Link>

          <div>
            <h1 className="text-3xl font-black font-headline uppercase tracking-tight">Novo Concurso Bingo</h1>
            <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Premiação automática baseada em vendas (65% líquido)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card className="bg-primary text-white p-4 border-none shadow-sm">
                <p className="text-[9px] font-black uppercase opacity-60 mb-2">Quadra (20%)</p>
                <p className="text-lg font-black italic">Rateio Líquido</p>
             </Card>
             <Card className="bg-primary text-white p-4 border-none shadow-sm">
                <p className="text-[9px] font-black uppercase opacity-60 mb-2">Quina (30%)</p>
                <p className="text-lg font-black italic">Rateio Líquido</p>
             </Card>
             <Card className="bg-accent text-white p-4 border-none shadow-sm">
                <p className="text-[9px] font-black uppercase opacity-60 mb-2">Bingo Cheio (50%)</p>
                <p className="text-lg font-black italic">Rateio Líquido</p>
             </Card>
          </div>

          <Card className="border-t-4 border-t-accent shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase">Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground">Título do Concurso</label>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Bingo Especial da Sorte"
                    className="h-12 border-2 rounded-xl font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground">Valor por Cartela (R$)</label>
                    <Input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="h-12 border-2 rounded-xl font-black text-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground">Meta de Cartelas (0 = Ilimitado)</label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      placeholder="Sem limite"
                      className="h-12 border-2 rounded-xl font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground">Data e Hora do Sorteio</label>
                  <Input
                    type="datetime-local"
                    value={drawDate}
                    onChange={(e) => setDrawDate(e.target.value)}
                    className="h-12 border-2 rounded-xl font-bold"
                    required
                  />
                  <p className="text-[10px] text-orange-600 font-bold flex items-center gap-1">
                    <Info className="w-3 h-3" /> Vendas encerram 1 minuto antes do horário marcado.
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-xl">
                   <h4 className="text-[10px] font-black uppercase text-primary mb-2">Resumo Financeiro (Padrão 20/10/5)</h4>
                   <ul className="text-xs space-y-1 font-bold text-muted-foreground">
                      <li className="flex justify-between"><span>Prêmio Líquido aos Ganhadores:</span> <span className="text-green-600 font-black">65%</span></li>
                      <li className="flex justify-between"><span>Sua Taxa Administrativa:</span> <span>20%</span></li>
                      <li className="flex justify-between"><span>Comissão Cambista:</span> <span>10%</span></li>
                      <li className="flex justify-between"><span>Comissão Gerente:</span> <span>5%</span></li>
                   </ul>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 h-14 font-black uppercase" disabled={saving}>
                    {saving ? 'Publicando...' : 'Publicar Bingo'}
                  </Button>
                  <Link href="/admin/bingo" className="flex-1">
                    <Button type="button" variant="outline" className="w-full h-14 font-black uppercase">Cancelar</Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}