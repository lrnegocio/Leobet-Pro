"use client"

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, User, Store, Trophy, Grid3X3, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary/90 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-2 text-white">
          <h1 className="text-6xl font-black tracking-tighter font-headline">LEOBET PRO</h1>
          <p className="text-xl opacity-80 uppercase font-bold tracking-widest">Plataforma Oficial de Sorteios</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card className="hover:shadow-2xl transition-all border-none bg-white/10 backdrop-blur-md text-white group cursor-pointer overflow-hidden">
            <Link href="/auth/login?role=cliente" className="block p-6">
              <CardHeader className="items-center p-0 mb-4">
                <div className="p-4 rounded-2xl bg-accent group-hover:scale-110 transition-transform">
                  <User className="w-8 h-8" />
                </div>
                <CardTitle className="mt-4 font-black uppercase">Área do Cliente</CardTitle>
                <CardDescription className="text-white/60 font-bold">Aposte e acompanhe</CardDescription>
              </CardHeader>
              <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white font-black uppercase text-xs">
                Entrar / Cadastrar
              </Button>
            </Link>
          </Card>

          <Card className="hover:shadow-2xl transition-all border-none bg-white/10 backdrop-blur-md text-white group cursor-pointer overflow-hidden">
            <Link href="/auth/login?role=cambista" className="block p-6">
              <CardHeader className="items-center p-0 mb-4">
                <div className="p-4 rounded-2xl bg-white/20 group-hover:scale-110 transition-transform">
                  <Store className="w-8 h-8" />
                </div>
                <CardTitle className="mt-4 font-black uppercase">Cambista</CardTitle>
                <CardDescription className="text-white/60 font-bold">Vendas e Comissões</CardDescription>
              </CardHeader>
              <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white font-black uppercase text-xs">
                Acessar Painel
              </Button>
            </Link>
          </Card>

          <Card className="hover:shadow-2xl transition-all border-none bg-white/10 backdrop-blur-md text-white group cursor-pointer overflow-hidden border-2 border-accent/50">
            <Link href="/resultados" className="block p-6">
              <CardHeader className="items-center p-0 mb-4">
                <div className="p-4 rounded-2xl bg-green-600 group-hover:scale-110 transition-transform">
                  <Search className="w-8 h-8" />
                </div>
                <CardTitle className="mt-4 font-black uppercase text-green-400">Conferir Bilhete</CardTitle>
                <CardDescription className="text-white/60 font-bold">Resultados em tempo real</CardDescription>
              </CardHeader>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs">
                Ver Resultados
              </Button>
            </Link>
          </Card>
        </div>

        <div className="pt-8">
           <Link href="/auth/login?role=admin">
             <Button variant="ghost" className="text-white/40 hover:text-white font-black uppercase text-[10px] tracking-widest gap-2">
               <ShieldCheck className="w-3 h-3" /> Acesso Administrativo
             </Button>
           </Link>
        </div>

        <div className="flex justify-center gap-8 pt-12 text-white/40 font-bold uppercase text-[10px] tracking-widest">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span>Bolão Esportivo</span>
          </div>
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            <span>Bingo 1-90</span>
          </div>
        </div>
      </div>
    </div>
  );
}