"use client"

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Filter, UserCheck, Search, Users, Trophy, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FinanceiroPage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const handleApprove = (id: string) => {
    toast({ title: `Aposta Aprovada`, description: "A comissão e o prêmio acumulado foram atualizados." });
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-black font-headline uppercase text-primary">Gestão Financeira Master</h1>
            <p className="text-muted-foreground">Monitoramento em tempo real (20/10/5)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-primary text-white">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase opacity-60">Meu Lucro (20%)</p>
                <p className="text-2xl font-black">R$ 0,00</p>
              </CardContent>
            </Card>
            <Card className="bg-accent text-white">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase opacity-60">Pagar Cambistas (10%)</p>
                <p className="text-2xl font-black">R$ 0,00</p>
              </CardContent>
            </Card>
            <Card className="bg-green-600 text-white">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase opacity-60">Prêmios Acumulados (65%)</p>
                <p className="text-2xl font-black">R$ 0,00</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-600 text-white">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase opacity-60">Gerentes (5%)</p>
                <p className="text-2xl font-black">R$ 0,00</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm font-black uppercase">Painel Administrativo</CardTitle>
                <p className="text-[10px] text-muted-foreground">Filtre por data para relatórios completos</p>
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
                  <TabsTrigger value="pendentes" className="font-bold">Vendas Pendentes</TabsTrigger>
                  <TabsTrigger value="vendas" className="font-bold">Relatório Cambistas</TabsTrigger>
                  <TabsTrigger value="resgate" className="font-bold">Validar Prêmios</TabsTrigger>
                  <TabsTrigger value="gerentes" className="font-bold">Relatório Gerentes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pendentes">
                   <div className="border rounded-xl overflow-hidden bg-white text-center py-20">
                      <DollarSign className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                      <p className="font-black uppercase tracking-widest text-xs text-muted-foreground">Sem vendas aguardando aprovação</p>
                   </div>
                </TabsContent>

                <TabsContent value="resgate">
                  <div className="max-w-md mx-auto py-10 space-y-4">
                    <div className="text-center space-y-2">
                       <UserCheck className="w-12 h-12 text-primary mx-auto opacity-20" />
                       <h3 className="font-black uppercase">Validar Bilhete Premiado</h3>
                       <p className="text-xs text-muted-foreground">Insira o código de 11 dígitos para baixar o prêmio.</p>
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="Código: 00000000000" className="h-12 font-black text-center text-lg" maxLength={11} />
                      <Button className="h-12 font-black uppercase px-8">Validar e Baixar</Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="vendas">
                  <div className="text-center py-20 opacity-20">
                     <Users className="w-16 h-16 mx-auto mb-4" />
                     <p className="font-black uppercase tracking-widest">Selecione uma data para ver o desempenho dos cambistas.</p>
                  </div>
                </TabsContent>

                <TabsContent value="gerentes">
                  <div className="text-center py-20 opacity-20">
                     <BarChart3 className="w-16 h-16 mx-auto mb-4" />
                     <p className="font-black uppercase tracking-widest">Relatório de produção por gerência (5%)</p>
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