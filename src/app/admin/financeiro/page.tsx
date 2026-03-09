"use client"

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, ArrowUpCircle, ArrowDownCircle, Wallet, Search, Filter } from 'lucide-react';

export default function FinanceiroPage() {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-black font-headline uppercase">Financeiro</h1>
            <p className="text-muted-foreground">Controle de entradas, saídas e comissões</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-primary text-white">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-xl"><Wallet className="w-8 h-8" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase opacity-60">Caixa Total</p>
                  <p className="text-2xl font-black">R$ 15.420,00</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-600 text-white">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-xl"><ArrowUpCircle className="w-8 h-8" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase opacity-60">Entradas (Mês)</p>
                  <p className="text-2xl font-black">R$ 8.900,00</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-orange-600 text-white">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-xl"><ArrowDownCircle className="w-8 h-8" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase opacity-60">Saídas (Prêmios)</p>
                  <p className="text-2xl font-black">R$ 3.200,00</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase">Filtros de Período</CardTitle>
              <div className="flex items-center gap-2">
                <Input 
                  type="date" 
                  className="w-40" 
                  value={dateRange.start}
                  onChange={e => setDateRange({...dateRange, start: e.target.value})}
                />
                <span className="text-muted-foreground font-bold">até</span>
                <Input 
                  type="date" 
                  className="w-40" 
                  value={dateRange.end}
                  onChange={e => setDateRange({...dateRange, end: e.target.value})}
                />
                <Button variant="secondary" size="icon"><Filter className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="extrato">
                <TabsList className="mb-4">
                  <TabsTrigger value="extrato" className="font-bold">Extrato Geral</TabsTrigger>
                  <TabsTrigger value="depositos" className="font-bold">Depósitos</TabsTrigger>
                  <TabsTrigger value="saques" className="font-bold">Saques / Prêmios</TabsTrigger>
                </TabsList>
                
                <TabsContent value="extrato">
                  <div className="space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted font-black uppercase text-[10px] tracking-widest">
                          <tr>
                            <th className="p-3 text-left">Data</th>
                            <th className="p-3 text-left">Tipo</th>
                            <th className="p-3 text-left">Cliente/Cambista</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <tr className="hover:bg-muted/50">
                            <td className="p-3">25/02/2026</td>
                            <td className="p-3"><Badge variant="outline">Aposta Bingo</Badge></td>
                            <td className="p-3">João Silva</td>
                            <td className="p-3 text-green-600 font-bold">Confirmado</td>
                            <td className="p-3 text-right font-black">R$ 10,00</td>
                          </tr>
                          <tr className="hover:bg-muted/50">
                            <td className="p-3">25/02/2026</td>
                            <td className="p-3"><Badge variant="destructive">Resgate Prêmio</Badge></td>
                            <td className="p-3">Maria Oliveira</td>
                            <td className="p-3 text-blue-600 font-bold">Processando</td>
                            <td className="p-3 text-right font-black text-destructive">- R$ 500,00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="depositos">
                  <p className="text-center py-10 text-muted-foreground">Filtre um período para ver os depósitos.</p>
                </TabsContent>
                
                <TabsContent value="saques">
                  <p className="text-center py-10 text-muted-foreground">Nenhuma solicitação de saque pendente.</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
