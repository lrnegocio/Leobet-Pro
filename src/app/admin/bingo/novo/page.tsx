"use client"

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NovoBingoPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [prize, setPrize] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Simulação - aqui você conectaria com a API
      console.log({ title, prize, quantity });
      
      // Após salvar, redireciona
      setTimeout(() => {
        router.push('/admin/bingo');
      }, 500);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <Link href="/admin/bingo" className="flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>

          <div>
            <h1 className="text-3xl font-black font-headline uppercase">Novo Bingo</h1>
            <p className="text-muted-foreground">Crie um novo sorteio de bingo</p>
          </div>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Detalhes do Bingo</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Título do Bingo</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Bingo da Sexta-feira"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Prêmio</label>
                  <input
                    type="text"
                    value={prize}
                    onChange={(e) => setPrize(e.target.value)}
                    placeholder="Ex: R$ 500"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Quantidade de Cartelas</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min="1"
                    max="1000"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : 'Criar Bingo'}
                  </Button>
                  <Link href="/admin/bingo">
                    <Button type="button" variant="outline">Cancelar</Button>
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
