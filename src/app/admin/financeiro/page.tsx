
"use client"

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, ArrowUpCircle, ArrowDownCircle, Wallet, Search, Filter, Check, X, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function FinanceiroPage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const handleApprove = (type: string) => {
    toast({ title: `${type} Aprovado`, description: "O saldo foi atualizado com sucesso." });
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-black font-headline uppercase text-primary">Gestão Financeira Master</h1>
            <p className="text-muted-foreground">Controle de entradas, prêmios e comissões (20/10/5)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-primary text-white">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase opacity-60">Líquido Organizador (20%)</p>
                <p className="text-2xl font-black">R$ 0,00</p>
              </CardContent>
            </Card>
            <Card className="bg-accent text-white">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase opacity-60">A Pagar (Cambistas)</p>
                <p className="text-2xl font-black">R$ 0,00</p>
              </CardContent>
            </Card>
            <Card className="bg-green-600 text-white">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase opacity-60">Prêmio Acumulado (65%)</p>
                <p className="text-2xl font-black">R$ 0,00</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-600 text-white">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase opacity-60">Comissões Gerentes (5%)</p>
                <p className="text-2xl font-black">R$ 0,00</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm font-black uppercase">Fluxo de Caixa</CardTitle>
                <p className="text-[10px] text-muted-foreground">Filtre por período para relatórios de cambistas</p>
              </div>
              <div className="flex items-center gap-2">
                <Input type="date" className="w-40 font-bold" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                <Input type="date" className="w-40 font-bold" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                <Button variant="secondary" size="icon"><Filter className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pendentes">
                <TabsList className="mb-6 bg-muted p-1">
                  <TabsTrigger value="pendentes" className="font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Aprovações (Saldo)</TabsTrigger>
                  <TabsTrigger value="extrato" className="font-bold">Vendas Detalhadas</TabsTrigger>
                  <TabsTrigger value="premios" className="font-bold">Baixar Prêmios</TabsTrigger>
                  <TabsTrigger value="cambistas" className="font-bold">Relatório Cambistas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pendentes">
                   <div className="border rounded-xl overflow-hidden bg-white">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 font-black uppercase text-[10px] tracking-widest text-muted-foreground border-b">
                          <tr>
                            <th className="p-4 text-left">Solicitante</th>
                            <th className="p-4 text-left">Tipo</th>
                            <th className="p-4 text-left">Data</th>
                            <th className="p-4 text-right">Valor</th>
                            <th className="p-4 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                           <tr>
                             <td className="p-4 text-center font-bold text-muted-foreground italic py-10" colSpan={5}>
                               Nenhuma solicitação pendente no momento.
                             </td>
                           </tr>
                        </tbody>
                      </table>
                   </div>
                </TabsContent>

                <TabsContent value="premios">
                  <div className="max-w-md mx-auto py-10 space-y-4">
                    <div className="text-center space-y-2">
                       <UserCheck className="w-12 h-12 text-primary mx-auto opacity-20" />
                       <h3 className="font-black uppercase">Validar Bilhete Premiado</h3>
                       <p className="text-xs text-muted-foreground">Insira os 11 dígitos do bilhete para baixar o prêmio.</p>
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="Código do Bilhete (11 dígitos)" className="h-12 font-black text-center text-lg" />
                      <Button className="h-12 font-black uppercase px-8">Validar</Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="extrato">
                  <div className="text-center py-20 opacity-20">
                     <BarChart3 className="w-16 h-16 mx-auto mb-4" />
                     <p className="font-black uppercase tracking-widest">Nenhum registro encontrado no período selecionado.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
