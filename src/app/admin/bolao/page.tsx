"use client"

import React from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Trophy } from 'lucide-react';

export default function BolaoPage() {
  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase">Bolões</h1>
              <p className="text-muted-foreground">Gerencie todos os bolões de apostas</p>
            </div>
            <Link href="/admin/bolao/novo">
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Novo Bolão
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" /> Bolões Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Nenhum bolão criado ainda. Clique em "Novo Bolão" para começar!
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
