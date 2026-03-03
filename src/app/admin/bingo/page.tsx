"use client"

import React from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Grid3X3 } from 'lucide-react';

export default function BingoPage() {
  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase">Bingos</h1>
              <p className="text-muted-foreground">Gerencie todos os sorteios de bingo</p>
            </div>
            <Link href="/admin/bingo/novo">
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Novo Bingo
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="w-5 h-5" /> Bingos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Nenhum bingo criado ainda. Clique em "Novo Bingo" para começar!
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
