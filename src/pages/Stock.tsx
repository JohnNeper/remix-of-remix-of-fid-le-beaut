import React, { useState, useMemo } from 'react';
import { Plus, Search, Package, AlertTriangle, Edit, Trash2, TrendingDown, TrendingUp, BarChart3, Download, Tag, Scale, Banknote, List, FileText, Layers, Archive, Box, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
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
import { useTranslations } from '@/hooks/useTranslations';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFinances } from '@/hooks/useFinances';
import { RestockModal } from '@/components/stock/RestockModal';

const PRODUCT_CATEGORIES = [
  { value: 'Cheveux', label: 'Cheveux' },
  { value: 'Ongles', label: 'Ongles' },
  { value: 'Maquillage', label: 'Maquillage' },
  { value: 'Corps', label: 'Corps' },
  { value: 'Homme', label: 'Homme' },
  { value: 'Autre', label: 'Autre' }
];

const PRODUCT_UNITS = [
  { value: 'pièce', label: 'Pièce' },
  { value: 'bouteille', label: 'Bouteille' },
  { value: 'flacon', label: 'Flacon' },
  { value: 'tube', label: 'Tube' },
  { value: 'pot', label: 'Pot' },
  { value: 'ml', label: 'ml' },
  { value: 'l', label: 'Litre' },
  { value: 'g', label: 'Gramme' },
  { value: 'kg', label: 'Kg' },
];

const categoriesLabels: Record<string, string> = PRODUCT_CATEGORIES.reduce((acc, curr) => ({ ...acc, [curr.value]: curr.label }), {} as Record<string, string>);
const unitsLabels: Record<string, string> = PRODUCT_UNITS.reduce((acc, curr) => ({ ...acc, [curr.value]: curr.label }), {} as Record<string, string>);

function ProductCard({ p, categoriesLabels, unitsLabels, isOwner, adjustStock, setEditingProduit, handleDelete }: any) {
  const { formatCurrency } = useTranslations();
  const marge = p.prix - p.prixAchat;
  const enAlerte = p.quantite <= p.seuilAlerte;

  return (
    <div className={cn("p-4 rounded-2xl border bg-card text-card-foreground shadow-sm flex flex-col gap-3 relative overflow-hidden", enAlerte ? "border-destructive/40 bg-destructive/5" : "border-border/50")}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg leading-tight">{p.nom}</h3>
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mt-1">
            <Layers className="h-3 w-3" />
            {categoriesLabels[p.categorie] || p.categorie}
          </p>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg text-primary">{formatCurrency(p.prix)}</div>
          {isOwner && <div className="text-[10px] text-success font-medium mt-0.5">Marge: +{formatCurrency(marge)}</div>}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/50">
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setEditingProduit(p)}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
        <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1 border border-border/50">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white dark:bg-background hover:bg-white shadow-sm text-muted-foreground hover:text-destructive" onClick={() => { adjustStock(p.id, -1); toast.success('-1 ' + p.nom); }}><TrendingDown className="h-4 w-4" /></Button>
          <Badge variant={enAlerte ? "destructive" : "secondary"} className="rounded-xl px-3 py-1 bg-transparent border-none shadow-none font-bold text-sm">
            {p.quantite} {unitsLabels[p.unite] || p.unite}
          </Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white dark:bg-background hover:bg-white shadow-sm text-muted-foreground hover:text-success" onClick={() => { adjustStock(p.id, 1); toast.success('+1 ' + p.nom); }}><TrendingUp className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}

function ProduitForm({ isOwner, produit, onSubmit, onCancel }: { isOwner: boolean; produit?: Produit; onSubmit: (d: any) => void; onCancel: () => void }) {
  const { t } = useLanguage();

  const produitSchema = z.object({
    nom: z.string().min(2, t('stock.nameRequired')),
    categorie: z.string().min(1, t('stock.categoryRequired')),
    prix: z.coerce.number().min(0),
    prixAchat: z.coerce.number().min(0),
    quantite: z.coerce.number().min(0),
    seuilAlerte: z.coerce.number().min(0),
    unite: z.string().min(1),
    description: z.string().optional(),
  });

  type ProduitFormData = z.infer<typeof produitSchema>;


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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <FormField control={form.control} name="nom" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground"><Package className="h-3.5 w-3.5 text-primary" />{t('stock.product')}</FormLabel>
              <FormControl><Input className="h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20 text-base font-semibold" placeholder={t('stock.productNamePlaceholder')} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <FormField control={form.control} name="categorie" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground"><Layers className="h-3.5 w-3.5 text-primary" />{t('stock.category')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20"><SelectValue placeholder={t('stock.category')} /></SelectTrigger></FormControl>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    {PRODUCT_CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value} className="rounded-lg m-1 font-medium">{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="unite" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground"><Scale className="h-3.5 w-3.5 text-primary" />{t('stock.unit')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    {PRODUCT_UNITS.map(u => (
                      <SelectItem key={u.value} value={u.value} className="rounded-lg m-1 font-medium">{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {isOwner && (
              <FormField control={form.control} name="prixAchat" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground"><Banknote className="h-3.5 w-3.5 text-primary" />{t('stock.buyPrice')} (FCFA)</FormLabel>
                  <FormControl><Input className="h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20 text-base font-semibold" type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <FormField control={form.control} name="prix" render={({ field }) => (
              <FormItem className={!isOwner ? "col-span-2" : ""}>
                <FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground"><Tag className="h-3.5 w-3.5 text-primary" />{t('stock.salePrice')} (FCFA)</FormLabel>
                <FormControl><Input className="h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20 text-base font-bold text-primary" type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <FormField control={form.control} name="quantite" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground"><List className="h-3.5 w-3.5 text-primary" />{t('stock.quantity')}</FormLabel>
                <FormControl><Input className="h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20 text-base font-semibold" type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="seuilAlerte" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground"><AlertTriangle className="h-3.5 w-3.5 text-destructive" />{t('stock.alertThreshold')}</FormLabel>
                <FormControl><Input className="h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20 text-base font-semibold" type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                <FileText className="h-3.5 w-3.5 text-primary" />{t('finances.description')} <span className="text-[10px] font-normal opacity-60 ml-1 lowercase">({t('common.optional')})</span>
              </FormLabel>
              <FormControl><Input className="h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20 text-base" placeholder={t('finances.description') + '...'} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
            <Button type="button" variant="ghost" onClick={onCancel} className="flex-1 h-12 sm:h-14 rounded-2xl font-bold text-muted-foreground hover:bg-muted transition-all order-2 sm:order-1">{t('common.cancel')}</Button>
            <Button type="submit" className="flex-1 h-12 sm:h-14 rounded-2xl font-bold bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all order-1 sm:order-2">{produit ? t('common.save') : t('common.add')}</Button>
          </div>
        </form>
      </Form>
    );
  }

  function exportStockCSV(produits: Produit[]) {
    let csv = 'Nom,Catégorie,Prix Achat,Prix Vente,Quantité,Seuil Alerte,Unité\n';
    produits.forEach(p => {
      csv += `"${p.nom}","${p.categorie}",${p.prixAchat},${p.prix},${p.quantite},${p.seuilAlerte},"${p.unite}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export stock CSV téléchargé');
  }

    export default function Stock() {
      const { produits, addProduit, updateProduit, deleteProduit, adjustStock, produitsEnAlerte, categories, valeurStock } = useStock();
      const { t } = useLanguage();
      const { formatCurrency } = useTranslations();
      const { hasStockHistory, hasExport, getUpgradePlan, plan } = useSubscriptionPlan();
      const { language } = useLanguage();
      const { addDepense } = useFinances();
      const [searchQuery, setSearchQuery] = useState('');
      const [catFilter, setCatFilter] = useState('all');
      const [currentPage, setCurrentPage] = useState(1);
      const itemsPerPage = 10;
      const [showForm, setShowForm] = useState(false);
      const [editingProduit, setEditingProduit] = useState<Produit | null>(null);
      const [restockProduit, setRestockProduit] = useState<Produit | null>(null);
      const [isRestockOpen, setIsRestockOpen] = useState(false);
      const [restockLoading, setRestockLoading] = useState(false);
      const { session } = useAuth();
      const isMobile = useIsMobile();
      const isOwner = session?.userRole === 'owner' || session?.type === 'admin';

      const handleRestockModal = async (produitId: string, addedQty: number, createExpense?: boolean) => {
        if (!restockProduit) return;
        setRestockLoading(true);
        try {
          await adjustStock(produitId, addedQty);
          if (createExpense && restockProduit.prixAchat > 0) {
            const montantTotal = addedQty * restockProduit.prixAchat;
            addDepense({
              date: new Date().toISOString().split('T')[0],
              categorie: 'Stock',
              description: `Réapprovisionnement: ${restockProduit.nom} (+${addedQty} ${restockProduit.unite})`,
              montant: montantTotal,
            });
          }
          toast.success(`Stock réapprovisionné (+${addedQty} ${restockProduit.unite})`);
        } catch (err: any) {
          console.error('Erreur réapprovisionnement:', err);
          toast.error('Erreur lors du réapprovisionnement');
        } finally {
          setRestockLoading(false);
        }
      };

    const FormWrapper = isMobile ? Drawer : Dialog;
    const FormContent = isMobile ? DrawerContent : DialogContent;
    const FormHeader = isMobile ? DrawerHeader : DialogHeader;
    const FormTitle = isMobile ? DrawerTitle : DialogTitle;
    const FormDescription = isMobile ? DrawerDescription : DialogDescription;

    const exportStockCSV = (produitsToExport: Produit[]) => {
      let csv = `${t('stock.product')},${t('stock.category')},${t('stock.buyPrice')},${t('stock.salePrice')},${t('stock.quantity')},${t('stock.alertThreshold')},${t('stock.unit')}\n`;
      produitsToExport.forEach(p => {
        csv += `"${p.nom}","${p.categorie}",${p.prixAchat},${p.prix},${p.quantite},${p.seuilAlerte},"${p.unite}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('stock.exportSuccess'));
    };

    const filtered = useMemo(() => {
      return produits.filter(p => {
        const matchSearch = p.nom.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = catFilter === 'all' || p.categorie === catFilter;
        return matchSearch && matchCat;
      });
    }, [produits, searchQuery, catFilter]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedProducts = useMemo(() => {
      return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filtered, currentPage]);

    const handleSubmit = (data: Omit<Produit, 'id'>) => {
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
      <div className="p-4 lg:p-6 space-y-6 lg:space-y-8 max-w-[1400px] mx-auto">
        {/* ── HEADER & STATS ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-1">{t('stock.title')}</h1>
              <p className="text-muted-foreground font-medium">
                {produits.length} {t('stock.products')}
                {isOwner && ` • ${t('stock.value')}: ${formatCurrency(valeurStock)}`}
              </p>
            </div>
            <div className="flex gap-2">
              {hasExport && (
                <Button onClick={() => exportStockCSV(filtered)} variant="outline" size="icon" className="h-11 w-11 rounded-xl shadow-sm hidden sm:flex">
                  <Download className="h-5 w-5" />
                </Button>
              )}
              <Button onClick={() => setShowForm(true)} className="gradient-primary h-11 rounded-xl shadow-xl shadow-primary/20 px-6 font-bold hover:scale-[1.02] transition-transform">
                <Plus className="h-5 w-5 mr-2" />{t('stock.newProduct')}
              </Button>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-white to-muted/30 dark:from-card dark:to-muted/10">
              <CardContent className="p-4 lg:p-5 flex flex-col gap-3">
                <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-primary/10 flex items-center justify-center"><Package className="h-5 w-5 lg:h-6 lg:w-6 text-primary" /></div>
                <div><p className="text-sm font-medium text-muted-foreground">{t('stock.totalProducts')}</p><p className="text-2xl lg:text-3xl font-bold">{produits.length}</p></div>
              </CardContent>
            </Card>
            {isOwner && (
              <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-white to-muted/30 dark:from-card dark:to-muted/10">
                <CardContent className="p-4 lg:p-5 flex flex-col gap-3">
                  <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-accent/10 flex items-center justify-center"><BarChart3 className="h-5 w-5 lg:h-6 lg:w-6 text-accent" /></div>
                  <div><p className="text-sm font-medium text-muted-foreground">{t('stock.stockValue')}</p><p className="text-2xl lg:text-3xl font-bold">{formatCurrency(valeurStock)}</p></div>
                </CardContent>
              </Card>
            )}
            <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-white to-muted/30 dark:from-card dark:to-muted/10 relative overflow-hidden">
              {produitsEnAlerte.length > 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-destructive/10 rounded-bl-full" />}
              <CardContent className="p-4 lg:p-5 flex flex-col gap-3">
                <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 lg:h-6 lg:w-6 text-destructive" /></div>
                <div><p className="text-sm font-medium text-muted-foreground">{t('stock.onAlert')}</p><p className="text-2xl lg:text-3xl font-bold text-destructive">{produitsEnAlerte.length}</p></div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-white to-muted/30 dark:from-card dark:to-muted/10">
              <CardContent className="p-4 lg:p-5 flex flex-col gap-3">
                <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-success/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-success" style={{ color: 'hsl(var(--success))' }} /></div>
                <div><p className="text-sm font-medium text-muted-foreground">{t('stock.categories')}</p><p className="text-2xl lg:text-3xl font-bold">{categories.length}</p></div>
              </CardContent>
            </Card>
          </div>
        </div>

        {!hasStockHistory && (
          <UpgradePrompt feature={t('stock.movementHistory')} currentPlan={plan.name} requiredPlan={getUpgradePlan()} type="banner" />
        )}
        {!hasExport && (
          <UpgradePrompt feature={t('stock.exportData')} currentPlan={plan.name} requiredPlan={getUpgradePlan()} type="banner" />
        )}

        {/* ── TABS & LIST ─────────────────────────────────────────────────── */}
        <Tabs defaultValue="all" className="w-full">
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar pb-1">
            <TabsList className="inline-flex w-max sm:w-full sm:grid sm:grid-cols-3 p-1.5 bg-muted/50 rounded-2xl h-auto">
              <TabsTrigger value="all" className="rounded-xl py-3 px-6 font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">{t('stock.allProducts')}</TabsTrigger>
              <TabsTrigger value="categories" className="rounded-xl py-3 px-6 font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Par Catégorie</TabsTrigger>
              <TabsTrigger value="alertes" className="relative rounded-xl py-3 px-6 font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                {t('stock.stockAlerts')}
                {produitsEnAlerte.length > 0 && (
                  <Badge className="ml-2 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0 rounded-full">{produitsEnAlerte.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── TAB: ALL PRODUCTS ── */}
          <TabsContent value="all" className="space-y-4 sm:space-y-6 mt-6 outline-none">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder={t('stock.searchProduct')} value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="pl-12 h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20 text-base" />
              </div>
              <Select value={catFilter} onValueChange={v => { setCatFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[220px] h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20 font-medium">
                  <SelectValue placeholder={t('stock.category')} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="all" className="rounded-lg m-1 font-medium">{t('stock.all')}</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c} className="rounded-lg m-1 font-medium">{categoriesLabels[c] || c}</SelectItem>)}
                </SelectContent>
              </Select>
              {hasExport && (
                <Button onClick={() => exportStockCSV(filtered)} variant="outline" size="icon" className="h-12 w-12 rounded-xl shadow-sm sm:hidden shrink-0 bg-muted/30 border-none">
                  <Download className="h-5 w-5" />
                </Button>
              )}
            </div>

            <div className="hidden sm:block">
              <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-card">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="font-semibold">{t('stock.product')}</TableHead>
                      <TableHead className="hidden sm:table-cell font-semibold">{t('stock.category')}</TableHead>
                      <TableHead className="text-right font-semibold">{t('stock.salePrice')}</TableHead>
                      <TableHead className="text-right font-semibold">{t('stock.stockQty')}</TableHead>
                      {isOwner && <TableHead className="text-right hidden md:table-cell font-semibold">Marge</TableHead>}
                      <TableHead className="text-right font-semibold">{t('stock.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun produit trouvé.</TableCell></TableRow>
                    )}
                    {paginatedProducts.map(p => {
                      const marge = p.prix - p.prixAchat;
                      const enAlerte = p.quantite <= p.seuilAlerte;
                      return (
                        <TableRow key={p.id} className="border-border/50 transition-colors">
                          <TableCell>
                            <div className="font-bold">{p.nom}</div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="secondary" className="rounded-lg font-medium bg-muted/50">{categoriesLabels[p.categorie] || p.categorie}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary">{formatCurrency(p.prix)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                              <span className={cn('font-bold', enAlerte ? 'text-destructive' : '')}>
                                {p.quantite} {unitsLabels[p.unite] || p.unite}
                              </span>
                              {enAlerte && <AlertTriangle className="h-4 w-4 text-destructive" />}
                            </div>
                          </TableCell>
                          {isOwner && (
                            <TableCell className="text-right hidden md:table-cell font-bold text-success">
                              +{formatCurrency(marge)}
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end items-center">
                              <div className="flex items-center gap-1 bg-muted/30 rounded-full p-1 mr-2 border border-border/50">
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-background" onClick={() => { adjustStock(p.id, -1); toast.success('-1 ' + p.nom); }}><TrendingDown className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-background" onClick={() => { adjustStock(p.id, 1); toast.success('+1 ' + p.nom); }}><TrendingUp className="h-3.5 w-3.5" /></Button>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted" onClick={() => setEditingProduit(p)}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-border/50">
                    <span className="text-sm text-muted-foreground">{t('common.page') || 'Page'} {currentPage} {t('common.of') || 'sur'} {totalPages}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <div className="sm:hidden flex flex-col gap-4">
              {filtered.length === 0 && <div className="text-center py-8 text-muted-foreground">Aucun produit trouvé.</div>}
              {paginatedProducts.map(p => (
                <ProductCard key={p.id} p={p} categoriesLabels={categoriesLabels} unitsLabels={unitsLabels} isOwner={isOwner} adjustStock={adjustStock} setEditingProduit={setEditingProduit} handleDelete={handleDelete} />
              ))}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-muted-foreground">{t('common.page') || 'Page'} {currentPage} {t('common.of') || 'sur'} {totalPages}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── TAB: CATEGORIES ── */}
          <TabsContent value="categories" className="space-y-6 sm:space-y-8 mt-6 outline-none">
            {categories.map(cat => {
              const catProducts = produits.filter(p => p.categorie === cat);
              if (catProducts.length === 0) return null;
              return (
                <div key={cat} className="space-y-4">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <Badge variant="outline" className="text-base px-4 py-1.5 bg-card border-border/50 shadow-sm rounded-xl">{categoriesLabels[cat] || cat}</Badge>
                    <span className="text-sm font-medium text-muted-foreground ml-auto bg-muted/50 px-3 py-1 rounded-full">{catProducts.length} articles</span>
                  </h3>
                  <div className="hidden sm:block">
                    <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-card">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow className="border-border/50 hover:bg-transparent">
                            <TableHead className="font-semibold">{t('stock.product')}</TableHead>
                            <TableHead className="text-right font-semibold">{t('stock.salePrice')}</TableHead>
                            <TableHead className="text-right font-semibold">{t('stock.stockQty')}</TableHead>
                            {isOwner && <TableHead className="text-right hidden md:table-cell font-semibold">Marge</TableHead>}
                            <TableHead className="text-right font-semibold">{t('stock.actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {catProducts.map(p => {
                            const marge = p.prix - p.prixAchat;
                            const enAlerte = p.quantite <= p.seuilAlerte;
                            return (
                              <TableRow key={p.id} className="border-border/50 transition-colors">
                                <TableCell><div className="font-bold">{p.nom}</div></TableCell>
                                <TableCell className="text-right font-bold text-primary">{formatCurrency(p.prix)}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end items-center gap-2">
                                    <span className={cn('font-bold', enAlerte ? 'text-destructive' : '')}>
                                      {p.quantite} {unitsLabels[p.unite] || p.unite}
                                    </span>
                                    {enAlerte && <AlertTriangle className="h-4 w-4 text-destructive" />}
                                  </div>
                                </TableCell>
                                {isOwner && <TableCell className="text-right hidden md:table-cell font-bold text-success">+{formatCurrency(marge)}</TableCell>}
                                <TableCell className="text-right">
                                  <div className="flex gap-1 justify-end items-center">
                                    <div className="flex items-center gap-1 bg-muted/30 rounded-full p-1 mr-2 border border-border/50">
                                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-background" onClick={() => { adjustStock(p.id, -1); toast.success('-1 ' + p.nom); }}><TrendingDown className="h-3.5 w-3.5" /></Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-background" onClick={() => { adjustStock(p.id, 1); toast.success('+1 ' + p.nom); }}><TrendingUp className="h-3.5 w-3.5" /></Button>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted" onClick={() => setEditingProduit(p)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                  <div className="sm:hidden flex flex-col gap-4">
                    {catProducts.map(p => (
                      <ProductCard key={p.id} p={p} categoriesLabels={categoriesLabels} unitsLabels={unitsLabels} isOwner={isOwner} adjustStock={adjustStock} setEditingProduit={setEditingProduit} handleDelete={handleDelete} />
                    ))}
                  </div>
                </div>
              )
            })}
            {categories.length === 0 && <div className="text-center py-8 text-muted-foreground">Aucune catégorie disponible.</div>}
          </TabsContent>

          {/* ── TAB: ALERTES ── */}
          <TabsContent value="alertes" className="space-y-4 mt-6 outline-none">
            {produitsEnAlerte.length === 0 ? (
              <Card className="p-12 text-center rounded-3xl border-none shadow-inner bg-success/5"><p className="text-success font-bold text-lg">{t('stock.noAlert')}</p></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {produitsEnAlerte.map(p => (
                  <Card key={p.id} className="rounded-2xl border-destructive/20 shadow-sm bg-destructive/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-destructive" />
                    <CardContent className="p-5 flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-background shadow-sm flex items-center justify-center shrink-0"><AlertTriangle className="h-6 w-6 text-destructive" /></div>
                          <div>
                            <p className="font-bold text-lg leading-tight">{p.nom}</p>
                            <p className="text-sm font-medium text-destructive mt-0.5">{p.quantite} {unitsLabels[p.unite] || p.unite} restants</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-destructive/10">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('stock.threshold')}: {p.seuilAlerte}</p>
                        <Button size="sm" className="rounded-full bg-destructive hover:bg-destructive/90 text-white font-bold px-4 shadow-md shadow-destructive/20" onClick={() => { setRestockProduit(p); setIsRestockOpen(true); }}>
                          Réapprovisionner
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* ── ADD/EDIT DIALOG/DRAWER ─────────────────────────────────────────────────── */}
        <FormWrapper open={showForm || !!editingProduit} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingProduit(null); } }}>
          <FormContent className={isMobile ? "p-0 bg-background border-none rounded-t-[30px] overflow-hidden max-h-[92vh] outline-none" : "max-w-md rounded-[24px] p-0 overflow-hidden border-none shadow-2xl"}>
            <div className="bg-primary/5 p-6 border-b border-border/50">
              <FormHeader className="p-0 text-left">
                <FormTitle className="text-2xl font-bold flex items-center gap-2">
                  <Archive className="h-6 w-6 text-primary" />
                  {editingProduit ? t('stock.editTitle') : t('stock.addTitle')}
                </FormTitle>
                <FormDescription className="text-sm font-medium text-muted-foreground mt-1">
                  {editingProduit ? "Modifiez les informations de ce produit." : "Ajoutez un nouvel article au stock de votre salon."}
                </FormDescription>
              </FormHeader>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(92vh-100px)]">
              <ProduitForm isOwner={isOwner} produit={editingProduit || undefined} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingProduit(null); }} />
            </div>
          </FormContent>
        </FormWrapper>

        <RestockModal
          produit={restockProduit}
          isOpen={isRestockOpen}
          onClose={() => setIsRestockOpen(false)}
          onRestock={handleRestockModal}
          loading={restockLoading}
        />
      </div>
    );
  }
