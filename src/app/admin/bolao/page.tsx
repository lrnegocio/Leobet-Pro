
"use client"

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Trash2, Edit, Loader2, Save, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';

export default function AdminBolao() {
  const { toast } = useToast();
  const db = useFirestore();
  
  const boloesRef = useMemoFirebase(() => db ? collection(db, 'boloes') : null, [db]);
  const { data: boloes, loading } = useCollection(boloesRef);

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newBolao, setNewBolao] = useState({
    nome: '',
    valor: '',
    regras: '',
    whatsapp: '',
  });

  const [matches, setMatches] = useState(Array.from({ length: 10 }, () => ({
    time1: '', time2: '', data: '', placar1: 0, placar2: 0, status: 'pendente', resultadoOficial: '' 
  })));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    const data = {
      nome: newBolao.nome,
      valor: Number(newBolao.valor),
      regras: newBolao.regras,
      whatsapp: newBolao.whatsapp,
      partidas: matches,
      updatedAt: serverTimestamp(),
    };

    if (isEditing) {
      await updateDoc(doc(db, 'boloes', isEditing), data);
      toast({ title: "Bolão Atualizado" });
      setIsEditing(null);
    } else {
      const createData = {
        ...data,
        status: 'aberto',
        vendidas: 0,
        vendidasCambista: 0,
        createdAt: serverTimestamp(),
      }
      await addDoc(collection(db, 'boloes'), createData);
      toast({ title: "Bolão Criado" });
    }

    setNewBolao({ nome: '', valor: '', regras: '', whatsapp: '' });
    setMatches(Array.from({ length: 10 }, () => ({ time1: '', time2: '', data: '', placar1: 0, placar2: 0, status: 'pendente', resultadoOficial: '' })));
  };

  const handleEdit = (bolao: any) => {
    setIsEditing(bolao.id);
    setNewBolao({
      nome: bolao.nome,
      valor: bolao.valor.toString(),
      regras: bolao.regras || '',
      whatsapp: bolao.whatsapp || '',
    });
    setMatches(bolao.partidas);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateMatchResult = async (bolaoId: string, bolaoPartidas: any[], matchIndex: number, p1: number, p2: number) => {
    if (!db) return;
    
    // Lógica 1, X, 2
    const officialResult = p1 > p2 ? '1' : (p1 < p2 ? '2' : 'X');
    
    const newPartidas = [...bolaoPartidas];
    newPartidas[matchIndex] = { 
      ...newPartidas[matchIndex], 
      placar1: Number(p1), 
      placar2: Number(p2), 
      status: 'finalizado',
      resultadoOficial: officialResult
    };
    
    await updateDoc(doc(db, 'boloes', bolaoId), { partidas: newPartidas });
    toast({ title: "Placar Atualizado", description: `Resultado Oficial: ${officialResult}` });
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'boloes', id));
    toast({ title: "Bolão Removido" });
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold font-headline uppercase">Gerenciar Bolões (10 Jogos)</h1>
            <Trophy className="w-8 h-8 text-primary opacity-20" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <Card className="xl:col-span-1 h-fit bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-black">{isEditing ? 'EDITAR BOLÃO' : 'NOVO BOLÃO'}</CardTitle>
                <CardDescription>Defina os jogos e o valor da aposta.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome da Rodada</Label>
                    <Input placeholder="Ex: Rodada 20 Brasileirão" value={newBolao.nome} onChange={(e) => setNewBolao({...newBolao, nome: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor do Bilhete (R$)</Label>
                    <Input type="number" step="0.01" placeholder="10.00" value={newBolao.valor} onChange={(e) => setNewBolao({...newBolao, valor: e.target.value})} required />
                  </div>
                  
                  <div className="pt-4 border-t space-y-4">
                    <p className="font-black text-[10px] uppercase text-primary tracking-widest">CONFIGURAR 10 JOGOS</p>
                    <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                      {matches.map((m, i) => (
                        <div key={i} className="p-4 border rounded-xl space-y-3 bg-muted/20">
                          <p className="text-[10px] font-black uppercase text-accent">JOGO {i + 1}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <Input className="bg-white" placeholder="Time Casa" value={m.time1} onChange={(e) => {
                              const newM = [...matches];
                              newM[i].time1 = e.target.value;
                              setMatches(newM);
                            }} />
                            <Input className="bg-white" placeholder="Time Fora" value={m.time2} onChange={(e) => {
                              const newM = [...matches];
                              newM[i].time2 = e.target.value;
                              setMatches(newM);
                            }} />
                          </div>
                          <Input type="datetime-local" className="text-xs bg-white" value={m.data} onChange={(e) => {
                            const newM = [...matches];
                            newM[i].data = e.target.value;
                            setMatches(newM);
                          }} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-6">
                    <Button type="submit" className="flex-1 bg-primary font-black h-12 uppercase tracking-tight">
                      {isEditing ? 'SALVAR ALTERAÇÕES' : 'CRIAR BOLÃO'}
                    </Button>
                    {isEditing && (
                      <Button variant="outline" className="font-bold" onClick={() => {
                        setIsEditing(null);
                        setNewBolao({ nome: '', valor: '', regras: '', whatsapp: '' });
                        setMatches(Array.from({ length: 10 }, () => ({ time1: '', time2: '', data: '', placar1: 0, placar2: 0, status: 'pendente', resultadoOficial: '' })));
                      }}>CANCELAR</Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="xl:col-span-2 bg-white">
              <CardHeader><CardTitle className="text-xl font-black uppercase">BOLÕES ATIVOS E RESULTADOS</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div> : boloes?.map(bolao => (
                  <div key={bolao.id} className="p-6 border rounded-2xl bg-white shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b pb-4">
                      <div>
                        <h4 className="text-2xl font-black uppercase text-primary">{bolao.nome}</h4>
                        <div className="flex gap-4 mt-1 font-bold">
                          <p className="text-xs text-muted-foreground uppercase">R$ {bolao.valor?.toFixed(2)}</p>
                          <p className="text-xs text-accent uppercase">{bolao.vendidas || 0} VENDIDAS</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="hover:text-primary" title="Editar" onClick={() => handleEdit(bolao)}><Edit size={16} /></Button>
                        <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" title="Excluir" onClick={() => handleDelete(bolao.id)}><Trash2 size={16} /></Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {bolao.partidas?.map((partida: any, idx: number) => (
                        <div key={idx} className="p-4 border rounded-xl bg-muted/5 relative">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black text-muted-foreground tracking-widest">JOGO {idx + 1}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${partida.status === 'finalizado' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                              {partida.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm font-black mb-4 px-2 uppercase tracking-tighter">
                            <span className="truncate flex-1">{partida.time1}</span>
                            <span className="text-muted-foreground mx-3 text-[10px]">VS</span>
                            <span className="truncate flex-1 text-right">{partida.time2}</span>
                          </div>
                          <div className="flex gap-3 items-end">
                            <div className="flex-1">
                              <Label className="text-[9px] uppercase font-black opacity-50">CASA</Label>
                              <Input className="h-10 text-center font-black text-lg bg-white" type="number" defaultValue={partida.placar1} id={`p1-${bolao.id}-${idx}`} />
                            </div>
                            <div className="flex-1">
                              <Label className="text-[9px] uppercase font-black opacity-50">FORA</Label>
                              <Input className="h-10 text-center font-black text-lg bg-white" type="number" defaultValue={partida.placar2} id={`p2-${bolao.id}-${idx}`} />
                            </div>
                            <Button size="icon" className="bg-primary hover:bg-primary/90 h-10 w-10 p-0 shadow-sm" onClick={() => {
                              const p1 = (document.getElementById(`p1-${bolao.id}-${idx}`) as HTMLInputElement).value;
                              const p2 = (document.getElementById(`p2-${bolao.id}-${idx}`) as HTMLInputElement).value;
                              updateMatchResult(bolao.id, bolao.partidas, idx, Number(p1), Number(p2));
                            }}>
                              <Save size={18} />
                            </Button>
                          </div>
                          {partida.resultadoOficial && (
                            <div className="mt-3 text-center">
                              <span className="text-[11px] font-black bg-primary text-white px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                                RESULTADO: {partida.resultadoOficial}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {!loading && boloes?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">Nenhum bolão ativo.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
