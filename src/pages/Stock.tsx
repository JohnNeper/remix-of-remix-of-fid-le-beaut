import React, { useState, useMemo } from 'react';
import { Plus, Search, Package, AlertTriangle, Edit, Trash2, TrendingDown, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStock } from '@/hooks/useStock';
import { Produit } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';

const produitSchema = z.object({
  nom: z.string().min(2, 'Nom requis'),
  categorie: z.string().min(1, 'Catégorie requise'),
  prix: z.coerce.number().min(0),
  prixAchat: z.coerce.number().min(0),
  quantite: z.coerce.number().min(0),
  seuilAlerte: z.coerce.number().min(0),
  unite: z.string().min(1),
  description: z.string().optional(),
});

type ProduitFormData = z.infer<typeof produitSchema>;

function ProduitForm({ produit, onSubmit, onCancel }: { produit?: Produit; onSubmit: (d: ProduitFormData) => void; onCancel: () => void }) {
  const form = useForm<ProduitFormData>({
    resolver: zodResolver(produitSchema),
    defaultValues: {
      nom: produit?.nom || '',
      categorie: produit?.categorie || '',
      prix: produit?.prix || 0,
      prixAchat: produit?.prixAchat || 0,
      quantite: produit?.quantite || 0,
      seuilAlerte: produit?.seuilAlerte || 5,
      unite: produit?.unite || 'pièce',
      description: produit?.description || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="nom" render={({ field }) => (
          <FormItem><FormLabel>Nom du produit</FormLabel><FormControl><Input placeholder="Ex: Shampoing kératine" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="categorie" render={({ field }) => (
            <FormItem><FormLabel>Catégorie</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger></FormControl>
                <SelectContent>
                  {['Cheveux', 'Ongles', 'Maquillage', 'Corps', 'Homme', 'Autre'].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="unite" render={({ field }) => (
            <FormItem><FormLabel>Unité</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {['pièce', 'bouteille', 'flacon', 'pot', 'tube', 'sachet', 'boîte'].map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="prixAchat" render={({ field }) => (
            <FormItem><FormLabel>Prix d'achat (FCFA)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="prix" render={({ field }) => (
            <FormItem><FormLabel>Prix de vente (FCFA)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="quantite" render={({ field }) => (
            <FormItem><FormLabel>Quantité en stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="seuilAlerte" render={({ field }) => (
            <FormItem><FormLabel>Seuil d'alerte</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description (optionnel)</FormLabel><FormControl><Input placeholder="Description..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Annuler</Button>
          <Button type="submit" className="flex-1 gradient-primary">{produit ? 'Modifier' : 'Ajouter'}</Button>
        </div>
      </form>
    </Form>
  );
}

export default function Stock() {
  const { produits, addProduit, updateProduit, deleteProduit, adjustStock, produitsEnAlerte, categories, valeurStock } = useStock();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null);

  const filtered = useMemo(() => {
    return produits.filter(p => {
      const matchSearch = p.nom.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = catFilter === 'all' || p.categorie === catFilter;
      return matchSearch && matchCat;
    });
  }, [produits, searchQuery, catFilter]);

  const handleSubmit = (data: ProduitFormData) => {
    if (editingProduit) {
      updateProduit(editingProduit.id, data);
      toast.success('Produit modifié');
      setEditingProduit(null);
    } else {
      addProduit(data as Omit<Produit, 'id'>);
      toast.success('Produit ajouté');
      setShowForm(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce produit ?')) {
      deleteProduit(id);
      toast.success('Produit supprimé');
    }
  };

  const formatFCFA = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t('stock.title')}</h1>
          <p className="text-muted-foreground">{produits.length} {t('stock.products')} • {t('stock.value')}: {formatFCFA(valeurStock)}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />{t('stock.newProduct')}
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="h-5 w-5 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Total produits</p><p className="text-xl font-bold">{produits.length}</p></div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center"><BarChart3 className="h-5 w-5 text-accent" /></div>
            <div><p className="text-sm text-muted-foreground">Valeur stock</p><p className="text-xl font-bold">{formatFCFA(valeurStock)}</p></div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
            <div><p className="text-sm text-muted-foreground">En alerte</p><p className="text-xl font-bold text-destructive">{produitsEnAlerte.length}</p></div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><TrendingUp className="h-5 w-5" style={{ color: 'hsl(var(--success))' }} /></div>
            <div><p className="text-sm text-muted-foreground">Catégories</p><p className="text-xl font-bold">{categories.length}</p></div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Tous les produits</TabsTrigger>
          <TabsTrigger value="alertes" className="relative">
            Alertes stock
            {produitsEnAlerte.length > 0 && (
              <Badge className="ml-2 bg-destructive text-destructive-foreground text-xs px-1.5 py-0">{produitsEnAlerte.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un produit..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card className="card-shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="hidden sm:table-cell">Catégorie</TableHead>
                  <TableHead className="text-right">Prix vente</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Marge</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => {
                  const marge = p.prix - p.prixAchat;
                  const enAlerte = p.quantite <= p.seuilAlerte;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{p.nom}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">{p.categorie}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell"><Badge variant="secondary">{p.categorie}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{formatFCFA(p.prix)}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn('font-semibold', enAlerte ? 'text-destructive' : '')}>
                          {p.quantite} {p.unite}s
                        </span>
                        {enAlerte && <AlertTriangle className="h-3 w-3 text-destructive inline ml-1" />}
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell font-medium" style={{ color: 'hsl(var(--success))' }}>
                        +{formatFCFA(marge)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { adjustStock(p.id, 1); toast.success('+1 ' + p.nom); }}>
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { adjustStock(p.id, -1); toast.success('-1 ' + p.nom); }}>
                            <TrendingDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingProduit(p)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="alertes" className="space-y-4">
          {produitsEnAlerte.length === 0 ? (
            <Card className="p-8 text-center"><p className="text-muted-foreground">Aucun produit en rupture de stock 🎉</p></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {produitsEnAlerte.map(p => (
                <Card key={p.id} className="card-shadow border-destructive/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
                      <div>
                        <p className="font-semibold">{p.nom}</p>
                        <p className="text-sm text-muted-foreground">{p.quantite} restant(s) • Seuil: {p.seuilAlerte}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { adjustStock(p.id, 10); toast.success(`+10 ${p.nom}`); }}>+10</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm || !!editingProduit} onOpenChange={() => { setShowForm(false); setEditingProduit(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingProduit ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle></DialogHeader>
          <ProduitForm produit={editingProduit || undefined} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingProduit(null); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
