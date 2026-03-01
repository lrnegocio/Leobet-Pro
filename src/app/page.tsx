
"use client"

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, User, Store, Trophy, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary/90 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-2 text-white">
          <h1 className="text-5xl font-black tracking-tight font-headline">LEOBET PRO</h1>
          <p className="text-xl opacity-80">Sua plataforma definitiva de apostas e diversão.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card className="hover:shadow-xl transition-all border-none bg-white/10 backdrop-blur-md text-white group cursor-pointer overflow-hidden">
            <Link href="/login?role=cliente" className="block h-full">
              <CardHeader className="items-center">
                <div className="p-4 rounded-full bg-accent group-hover:scale-110 transition-transform">
                  <User className="w-8 h-8" />
                </div>
                <CardTitle className="mt-4 font-black">CLIENTE</CardTitle>
                <CardDescription className="text-white/60">Aposte e ganhe prêmios instantâneos.</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white font-bold">
                  Entrar como Cliente
                </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-xl transition-all border-none bg-white/10 backdrop-blur-md text-white group cursor-pointer overflow-hidden">
            <Link href="/login?role=cambista" className="block h-full">
              <CardHeader className="items-center">
                <div className="p-4 rounded-full bg-primary-foreground/20 group-hover:scale-110 transition-transform">
                  <Store className="w-8 h-8" />
                </div>
                <CardTitle className="mt-4 font-black">CAMBISTA</CardTitle>
                <CardDescription className="text-white/60">Gerencie vendas e receba comissões.</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white font-bold">
                  Painel Cambista
                </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-xl transition-all border-none bg-white/10 backdrop-blur-md text-white group cursor-pointer overflow-hidden">
            <Link href="/login?role=admin" className="block h-full">
              <CardHeader className="items-center">
                <div className="p-4 rounded-full bg-white/20 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <CardTitle className="mt-4 font-black">ADMIN</CardTitle>
                <CardDescription className="text-white/60">Gestão completa da plataforma.</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white font-bold">
                  Acesso Restrito
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>

        <div className="flex justify-center gap-8 pt-12 text-white/40 font-bold uppercase text-[10px] tracking-widest">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span>Bolão Esportivo</span>
          </div>
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            <span>Bingo Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
