"use client"

import React from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SorteioPage() {
  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Link href="/admin/bingo" className="flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>

          <h1 className="text-3xl font-black font-headline uppercase">Sorteio</h1>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Sorteio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Carregando sorteio...
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
