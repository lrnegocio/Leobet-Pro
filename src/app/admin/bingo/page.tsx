
"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Grid3X3, Trash2, Edit, Play, Loader2, Calendar, Clock, Lock, Unlock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';

export default function AdminBingo() {
  const { toast } = useToast();
  const db = useFirestore();
  
  const bingosRef = useMemoFirebase(() => db ? collection(db, 'bingos') : null, [db]);
  const { data: bingos, loading } = useCollection(bingosRef);

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newBingo, setNewBingo] = useState({
    nome: '',
    preco: '',
    totalCartelas: '',
    dataSorteio: '',
    horaSorteio: '',
    whatsapp: '',
    regras: '',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    const dataSorteioCompleta = new Date(`${newBingo.dataSorteio}T${newBingo.horaSorteio}`);

    const data = {
      nome: newBingo.nome,
      preco: Number(newBingo.preco),
      totalCartelas: Number(newBingo.totalCartelas),
      dataSorteio: dataSorteioCompleta.toISOString(),
      whatsapp: newBingo.whatsapp,
      regras: newBingo.regras,
      updatedAt: serverTimestamp(),
    };

    if (isEditing) {
      updateDoc(doc(db, 'bingos', isEditing), data)
        .then(() => {
          setIsEditing(null);
          setNewBingo({ nome: '', preco: '', totalCartelas: '', dataSorteio: '', horaSorteio: '', whatsapp: '', regras: '' });
          toast({ title: "Bingo Atualizado" });
        });
    } else {
      const createData = {
        ...data,
        vendidas: 0,
        vendidasCambista: 0,
        status: 'aberto',
        bolasSorteadas: [],
        createdAt: serverTimestamp(),
      };
      addDoc(collection(db, 'bingos'), createData)
        .then(() => {
          setNewBingo({ nome: '', preco: '', totalCartelas: '', dataSorteio: '', horaSorteio: '', whatsapp: '', regras: '' });
          toast({ title: "Bingo Criado" });
        });
    }
  };

  const handleEdit = (bingo: any) => {
    setIsEditing(bingo.id);
    const date = new Date(bingo.dataSorteio);
    setNewBingo({
      nome: bingo.nome,
      preco: bingo.preco.toString(),
      totalCartelas: bingo.totalCartelas.toString(),
      dataSorteio: date.toISOString().split('T')[0],
      horaSorteio: date.toTimeString().split(' ')[0].substring(0, 5),
      whatsapp: bingo.whatsapp || '',
      regras: bingo.regras || '',
    });
  };

  const toggleStatus = (id: string, currentStatus: string) => {
    if (!db) return;
    const newStatus = currentStatus === 'aberto' ? 'encerrado' : 'aberto';
    updateDoc(doc(db, 'bingos', id), { status: newStatus });
    toast({ 
      title: "Status Atualizado", 
      description: newStatus === 'encerrado' ? "Vendas encerradas. Sorteio liberado!" : "Vendas abertas novamente." 
    });
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'bingos', id));
    toast({ title: "Bingo Removido" });
  };

  const isSorteioLiberado = (bingo: any) => {
    // Sorteio liberado se status for diferente de 'aberto' OU se já passou do horário
    if (bingo.status !== 'aberto') return true;
    const dataSorteio = new Date(bingo.dataSorteio);
    return new Date() >= dataSorteio;
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold font-headline uppercase">Gerenciar Bingos</h1>
            <Grid3X3 className="w-8 h-8 text-primary opacity-20" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 h-fit bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-black">{isEditing ? 'EDITAR BINGO' : 'NOVO CONCURSO'}</CardTitle>
                <CardDescription>Configure os detalhes do sorteio.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Concurso</Label>
                    <Input id="nome" placeholder="Ex: Show de Prêmios Natal" value={newBingo.nome} onChange={(e) => setNewBingo({...newBingo, nome: e.target.value})} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data">Data</Label>
                      <Input id="data" type="date" value={newBingo.dataSorteio} onChange={(e) => setNewBingo({...newBingo, dataSorteio: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hora">Hora</Label>
                      <Input id="hora" type="time" value={newBingo.horaSorteio} onChange={(e) => setNewBingo({...newBingo, horaSorteio: e.target.value})} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="preco">Valor (R$)</Label>
                      <Input id="preco" type="number" step="0.01" value={newBingo.preco} onChange={(e) => setNewBingo({...newBingo, preco: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total">Total Cartelas</Label>
                      <Input id="total" type="number" value={newBingo.totalCartelas} onChange={(e) => setNewBingo({...newBingo, totalCartelas: e.target.value})} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp Admin</Label>
                    <Input id="whatsapp" placeholder="(00) 00000-0000" value={newBingo.whatsapp} onChange={(e) => setNewBingo({...newBingo, whatsapp: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regras">Regras e Premiações</Label>
                    <Textarea id="regras" className="h-32" value={newBingo.regras} onChange={(e) => setNewBingo({...newBingo, regras: e.target.value})} />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 bg-primary text-white font-bold h-12">
                      {isEditing ? 'SALVAR ALTERAÇÕES' : 'CRIAR BINGO'}
                    </Button>
                    {isEditing && (
                      <Button variant="outline" onClick={() => {
                        setIsEditing(null);
                        setNewBingo({ nome: '', preco: '', totalCartelas: '', dataSorteio: '', horaSorteio: '', whatsapp: '', regras: '' });
                      }}>CANCELAR</Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-white">
              <CardHeader><CardTitle className="text-xl font-black">BINGOS CADASTRADOS</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : bingos && bingos.length > 0 ? (
                  <div className="space-y-4">
                    {bingos.map((bingo) => {
                      const liberado = isSorteioLiberado(bingo);
                      return (
                        <div key={bingo.id} className="p-5 border rounded-xl bg-white shadow-sm hover:shadow-md transition-all">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="bg-primary/10 p-4 rounded-xl"><Grid3X3 className="w-6 h-6 text-primary" /></div>
                              <div>
                                <h4 className="font-black text-xl text-primary">{bingo.nome.toUpperCase()}</h4>
                                <div className="flex gap-4 text-xs font-bold text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1 uppercase"><Calendar className="w-3 h-3" /> {new Date(bingo.dataSorteio).toLocaleDateString()}</span>
                                  <span className="flex items-center gap-1 uppercase"><Clock className="w-3 h-3" /> {new Date(bingo.dataSorteio).toTimeString().substring(0, 5)}</span>
                                  <span className="text-accent">R$ {bingo.preco?.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="text-right hidden md:block">
                                <p className="text-[9px] text-muted-foreground uppercase font-black">Vendas</p>
                                <p className={`font-black text-[11px] uppercase ${bingo.status === 'aberto' ? 'text-green-600' : 'text-destructive'}`}>
                                  {bingo.status === 'aberto' ? 'ABERTAS' : 'ENCERRADAS'}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {liberado ? (
                                  <Link href={`/admin/bingo/sorteio/${bingo.id}`}>
                                    <Button variant="default" className="bg-green-600 hover:bg-green-700 shadow-lg" size="icon" title="Iniciar Sorteio">
                                      <Play className="w-4 h-4" />
                                    </Button>
                                  </Link>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="opacity-40 cursor-not-allowed bg-muted" 
                                    onClick={() => toast({ title: "Sorteio Bloqueado", description: "Encerre as vendas ou aguarde o horário agendado.", variant: "destructive" })}
                                  >
                                    <Lock className="w-4 h-4 text-orange-500" />
                                  </Button>
                                )}
                                <Button variant="outline" size="icon" onClick={() => handleEdit(bingo)}><Edit className="w-4 h-4" /></Button>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  onClick={() => toggleStatus(bingo.id, bingo.status)}
                                  title={bingo.status === 'aberto' ? 'Encerrar Vendas' : 'Abrir Vendas'}
                                >
                                  {bingo.status === 'aberto' ? <Unlock className="w-4 h-4 text-green-600" /> : <Lock className="w-4 h-4 text-destructive" />}
                                </Button>
                                <Button variant="outline" size="icon" className="text-destructive" onClick={() => handleDelete(bingo.id)}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">Nenhum concurso agendado.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
