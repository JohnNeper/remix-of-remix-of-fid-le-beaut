import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Receipt, Wallet, Download, FileText, Trash2, AlertTriangle, Calendar, Tag, FileSignature, Banknote, CreditCard, Layers, LayoutList, CheckCircle2, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useFinances } from '@/hooks/useFinances';
import { useClients } from '@/hooks/useClients';
import { useStock } from '@/hooks/useStock';
import { usePrestations } from '@/hooks/usePrestations';
import { Vente, VenteItem, Depense } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';
import { GlobalCashReport } from '@/components/finances/GlobalCashReport';
import { InvoiceGenerator } from '@/components/finances/InvoiceGenerator';
import { useTranslations } from '@/hooks/useTranslations';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

const depenseSchema = z.object({
  date: z.string().min(1),
  categorie: z.string().min(1),
  description: z.string().min(2, 'Description requise'),
  montant: z.coerce.number().min(1, 'Montant requis'),
});

const modePaiementLabels: Record<string, string> = {
  especes: 'Espèces',
  mobile_money: 'Mobile Money',
  carte: 'Carte',
  mixte: 'Mixte',
};

function DepenseForm({ onSubmit, onCancel }: { onSubmit: (d: z.infer<typeof depenseSchema>) => Promise<void> | void; onCancel: () => void }) {
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<z.infer<typeof depenseSchema>>({
    resolver: zodResolver(depenseSchema),
    defaultValues: { date: new Date().toISOString().split('T')[0], categorie: '', description: '', montant: 0 },
  });

  const handleFormSubmit = async (data: z.infer<typeof depenseSchema>) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSubmit(data);
    } catch (err) {
      console.error('Erreur soumission dépense:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 sm:space-y-6">
        <FormField control={form.control} name="date" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground"><Calendar className="h-3.5 w-3.5 text-primary" />{t('finances.date')}</FormLabel><FormControl><Input className="h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20 text-base" type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="categorie" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground"><Tag className="h-3.5 w-3.5 text-primary" />{t('finances.category')}</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20 text-base font-medium"><SelectValue placeholder={t('finances.category')} /></SelectTrigger></FormControl>
              <SelectContent className="rounded-xl border-none shadow-2xl">
                {['fournitures', 'loyer', 'salaires', 'eau_elec', 'transport', 'marketing', 'equipement', 'autre'].map(c => (
                  <SelectItem key={c} value={c} className="rounded-lg m-1 font-medium">{t(`finances.categories.${c}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground"><FileSignature className="h-3.5 w-3.5 text-primary" />{t('finances.description')}</FormLabel><FormControl><Textarea placeholder={t('finances.description') + '...'} className="resize-none min-h-[80px] rounded-2xl bg-muted/30 border-none shadow-inner p-4 focus:ring-primary/20 text-base" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="montant" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground"><Banknote className="h-3.5 w-3.5 text-primary" />{t('finances.amount')} (FCFA)</FormLabel><FormControl><Input className="h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20 text-base font-semibold" type="number" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-md pt-3 pb-3 border-t border-border/40 z-10 flex flex-col sm:flex-row gap-3 sm:gap-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <Button type="button" variant="ghost" disabled={isSaving} onClick={onCancel} className="flex-1 h-12 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-all order-2 sm:order-1">{t('common.cancel')}</Button>
          <Button type="submit" disabled={isSaving || form.formState.isSubmitting} className="flex-1 h-12 rounded-xl font-bold bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all order-1 sm:order-2 disabled:opacity-50">
            {isSaving || form.formState.isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('common.saving') || 'Enregistrement...'}
              </span>
            ) : (
              t('finances.saveExpense')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function VenteForm({ onSubmit, onCancel }: { onSubmit: (v: Omit<Vente, 'id'>) => Promise<void> | void; onCancel: () => void }) {
  const { t } = useLanguage();
  const { formatCurrency } = useTranslations();
  const { clients } = useClients();
  const { produits, adjustStock } = useStock();
  const { typesPrestations } = usePrestations();
  const [items, setItems] = useState<VenteItem[]>([]);
  const [clientId, setClientId] = useState('');
  const [modePaiement, setModePaiement] = useState<'especes' | 'mobile_money' | 'carte' | 'mixte'>('especes');
  const [itemType, setItemType] = useState<'produit' | 'prestation'>('produit');
  const [selectedRef, setSelectedRef] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [prixUnitaire, setPrixUnitaire] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);


  const modePaiementLabels: Record<string, string> = {
    especes: 'finances.paymentModes.especes',
    mobile_money: 'finances.paymentModes.mobile_money',
    carte: 'finances.paymentModes.carte',
    mixte: 'finances.paymentModes.mixte',
  };

  const addItem = () => {
    if (!selectedRef) return;
    let nom = '';
    const refId = String(selectedRef);

    if (itemType === 'produit') {
      const p = produits.find(p => String(p.id) === refId || String((p as any)._id) === refId);
      if (!p) { toast.error(t('finances.notFound') || 'Produit non trouvé'); return; }
      nom = p.nom;
    } else {
      const tp = typesPrestations.find(tp => String(tp.id) === refId || String((tp as any)._id) === refId);
      if (!tp) { toast.error(t('finances.notFound') || 'Prestation non trouvée'); return; }
      nom = tp.nom;
    }
    setItems(prev => [...prev, { type: itemType, referenceId: selectedRef, nom, quantite: itemQty, prixUnitaire, montant: prixUnitaire * itemQty }]);
    setSelectedRef(''); setItemQty(1);
  };

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const total = items.reduce((s, i) => s + i.montant, 0);

  const handleSubmit = async () => {
    if (isSaving) return;
    if (items.length === 0) { toast.error(t('finances.addAtLeastOne')); return; }
    setIsSaving(true);
    try {
      const resolvedClientId = (clientId && clientId !== 'none') ? clientId : undefined;
      items.filter(i => i.type === 'produit').forEach(i => adjustStock(i.referenceId, -i.quantite));
      await onSubmit({ date: new Date().toISOString().split('T')[0], clientId: resolvedClientId, items, totalMontant: total, modePaiement, notes });
    } catch (err) {
      console.error('Erreur enregistrement vente:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatFCFA = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <label className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">
          <FileSignature className="h-3.5 w-3.5 text-primary" />
          {t('finances.clientOptional')}
          <span className="text-[10px] font-normal opacity-60 ml-1 lowercase">({t('common.optional') || 'optionnel'})</span>
        </label>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20 font-medium text-base">
            <SelectValue placeholder={t('finances.selectClient')} />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-none shadow-2xl">
            <SelectItem value="none" className="rounded-lg m-1 font-medium italic text-muted-foreground">
              👤 {t('finances.anonymousClient') || 'Client anonyme (sans enregistrement)'}
            </SelectItem>
            {clients.map(c => <SelectItem key={c.id} value={c.id} className="rounded-lg m-1 font-medium">{c.nom} - {c.telephone}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground mt-1 ml-1 opacity-70">{t('finances.anonymousHint') || 'La vente sera enregistrée dans les finances'}</p>
      </div>

      <Card className="p-4 sm:p-5 space-y-4 bg-muted/20 border-border/50 rounded-2xl shadow-sm">
        <p className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-2">
          <LayoutList className="h-4 w-4" />
          {t('finances.addArticle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={itemType} onValueChange={(v) => { setItemType(v as 'produit' | 'prestation'); setSelectedRef(''); setPrixUnitaire(0); }}>
            <SelectTrigger className="w-full sm:w-[150px] h-12 rounded-xl bg-background border-none shadow-inner focus:ring-primary/20 font-medium"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              <SelectItem value="produit" className="rounded-lg m-1 font-medium">{t('finances.products')}</SelectItem>
              <SelectItem value="prestation" className="rounded-lg m-1 font-medium">{t('finances.services')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedRef} onValueChange={(val) => {
            setSelectedRef(val);
            const item = itemType === 'produit'
              ? produits.find(p => String(p.id) === val || String((p as any)._id) === val)
              : typesPrestations.find(tp => String(tp.id) === val || String((tp as any)._id) === val);
            if (item) setPrixUnitaire(item.prix);
          }}>
            <SelectTrigger className="flex-1 h-12 rounded-xl bg-background border-none shadow-inner focus:ring-primary/20 font-medium"><SelectValue placeholder={t('finances.choose')} /></SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              {itemType === 'produit'
                ? produits.map(p => <SelectItem key={p.id} value={p.id} className="rounded-lg m-1 font-medium">{p.nom} ({formatCurrency(p.prix)})</SelectItem>)
                : typesPrestations.map(tp => <SelectItem key={tp.id} value={tp.id} className="rounded-lg m-1 font-medium">{tp.nom} ({formatCurrency(tp.prix)})</SelectItem>)
              }
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
          <div className="flex-1 min-w-[120px]">
            <Input type="number" value={prixUnitaire} onChange={e => setPrixUnitaire(Number(e.target.value))} className="w-full h-12 rounded-xl bg-background border-none shadow-inner focus:ring-primary/20 font-semibold" placeholder={t('finances.amount')} />
          </div>
          <Input type="number" value={itemQty} onChange={e => setItemQty(Number(e.target.value))} min={1} className="w-20 h-12 rounded-xl bg-background border-none shadow-inner focus:ring-primary/20 text-center font-bold" placeholder="Qté" />
          <Button type="button" onClick={addItem} variant="secondary" className="h-12 px-5 gap-2 rounded-xl font-bold bg-primary/10 text-primary hover:bg-primary/20 w-full sm:w-auto">
            <Plus className="h-5 w-5" />
            <span className="sm:hidden">{t('common.add')}</span>
          </Button>
        </div>
      </Card>

      {items.length > 0 && (
        <div className="space-y-3 bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between bg-muted/40 rounded-xl p-3 text-sm">
              <div>
                <span className="font-bold text-base">{item.nom}</span>
                <span className="text-muted-foreground ml-2 font-medium bg-white dark:bg-background px-2 py-0.5 rounded-md">x{item.quantite}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-primary">{formatCurrency(item.montant)}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10" onClick={() => removeItem(idx)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
          <div className="text-right pt-3 border-t border-border/50 font-black text-xl text-foreground">
            {t('finances.total')}: <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">
          <CreditCard className="h-3.5 w-3.5 text-primary" />
          {t('finances.paymentMethod')}
        </label>
        <Select value={modePaiement} onValueChange={(v) => setModePaiement(v as any)}>
          <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20 font-medium text-base"><SelectValue /></SelectTrigger>
          <SelectContent className="rounded-xl border-none shadow-2xl">
            {Object.entries(modePaiementLabels).map(([k, v]) => <SelectItem key={k} value={k} className="rounded-lg m-1 font-medium">{t(v)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">
          <FileText className="h-3.5 w-3.5 text-primary" />
          Notes & Recommandations
          <span className="text-[10px] font-normal opacity-60 ml-1 lowercase">({t('common.optional')})</span>
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: Peau sensible, boutons sur les joues..."
          className="w-full min-h-[100px] rounded-2xl bg-muted/30 border-none shadow-inner p-4 focus:ring-primary/20 text-base"
        />
      </div>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur-md pt-3 pb-3 border-t border-border/40 z-10 flex flex-col sm:flex-row gap-3 sm:gap-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <Button type="button" variant="ghost" disabled={isSaving} onClick={onCancel} className="flex-1 h-12 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-all order-2 sm:order-1">{t('common.cancel')}</Button>
        <Button type="button" disabled={isSaving} onClick={handleSubmit} className="flex-1 h-12 rounded-xl font-bold bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all order-1 sm:order-2 disabled:opacity-50">
          {isSaving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.saving') || 'Enregistrement...'}
            </span>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              {t('finances.saveSale')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ... the rest of the Finances page

function TransactionCard({ item, type, getClientName, formatDate, formatCurrency, setInvoiceVente, setDeleteVenteTarget, setDeleteDepenseTarget, isOwner, modePaiementLabels, t }: any) {
  const isVente = type === 'vente';
  const Icon = isVente ? TrendingUp : TrendingDown;

  return (
    <div className={cn("p-4 rounded-2xl border shadow-sm flex flex-col gap-3 relative overflow-hidden", isVente ? "bg-card border-border/50" : "bg-destructive/5 border-destructive/20")}>
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", isVente ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">
              {isVente ? getClientName(item.clientId) : t(`finances.categories.${item.categorie}`)}
            </h3>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              {formatDate(item.date)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("font-bold text-lg", isVente ? "text-primary" : "text-destructive")}>
            {isVente ? "+" : "-"}{formatCurrency(isVente ? item.totalMontant : item.montant)}
          </div>
          {isVente && (
            <Badge variant="secondary" className="text-[10px] bg-muted/50 mt-1">{t(modePaiementLabels[item.modePaiement])}</Badge>
          )}
        </div>
      </div>

      <div className="text-sm text-muted-foreground bg-white/50 dark:bg-background/50 p-2 rounded-lg mt-1 line-clamp-2">
        {isVente ? item.items.map((i: any) => i.nom).join(', ') : item.description}
      </div>

      <div className="flex justify-end gap-1 mt-1 border-t border-border/50 pt-3">
        {isVente && (
          <Button variant="ghost" size="sm" className="rounded-full text-primary hover:bg-primary/10 font-bold" onClick={() => setInvoiceVente(item)}>
            <FileText className="h-4 w-4 mr-2" /> Reçu
          </Button>
        )}
        {(isVente || isOwner) && (
          <Button variant="ghost" size="icon" className="rounded-full text-destructive hover:bg-destructive/10" onClick={() => isVente ? setDeleteVenteTarget(item) : setDeleteDepenseTarget(item)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Finances() {
  const { ventes, depenses, addVenteAsync, addDepenseAsync, deleteVente, deleteDepense, stats } = useFinances();
  const { clients } = useClients();
  const { t, language } = useLanguage();
  const { formatCurrency, formatDate } = useTranslations();
  const { hasExport, hasProfitEstimation, getUpgradePlan, plan } = useSubscriptionPlan();
  const { session } = useAuth();
  const isOwner = session?.userRole === 'owner' || session?.type === 'admin';
  const [showVenteForm, setShowVenteForm] = useState(false);
  const [showDepenseForm, setShowDepenseForm] = useState(false);
  const [invoiceVente, setInvoiceVente] = useState<Vente | null>(null);
  const [deleteVenteTarget, setDeleteVenteTarget] = useState<Vente | null>(null);
  const [deleteDepenseTarget, setDeleteDepenseTarget] = useState<Depense | null>(null);
  const isMobile = useIsMobile();
  const [searchVentes, setSearchVentes] = useState('');
  const [pageVentes, setPageVentes] = useState(1);
  const [searchDepenses, setSearchDepenses] = useState('');
  const [pageDepenses, setPageDepenses] = useState(1);
  const itemsPerPage = 10;

  const FormWrapper = isMobile ? Drawer : Dialog;
  const FormContent = isMobile ? DrawerContent : DialogContent;
  const FormHeader = isMobile ? DrawerHeader : DialogHeader;
  const FormTitle = isMobile ? DrawerTitle : DialogTitle;
  const FormDescription = isMobile ? DrawerDescription : DialogDescription;

  const getClientName = (clientId?: any) => {
    if (!clientId) return <span className="text-muted-foreground italic text-xs">{t('finances.anonymousClient') || 'Client anonyme'}</span>;
    const targetId = typeof clientId === 'object' ? (clientId._id || clientId.id) : clientId;
    const client = clients.find(c => (c as any)._id === targetId || c.id === targetId);
    return client?.nom || (typeof clientId === 'object' ? (clientId.nom || clientId.name) : <span className="text-muted-foreground italic text-xs">{t('finances.anonymousClient') || 'Client anonyme'}</span>);
  };

  const getClientText = (clientId?: any) => {
    if (!clientId) return t('finances.anonymousClient') || 'Client anonyme';
    const targetId = typeof clientId === 'object' ? (clientId._id || clientId.id) : clientId;
    const client = clients.find(c => (c as any)._id === targetId || c.id === targetId);
    return client?.nom || (typeof clientId === 'object' ? (clientId.nom || clientId.name) : (t('finances.anonymousClient') || 'Client anonyme'));
  };

  const processedVentes = ventes
    .filter(v => {
      const cName = getClientText(v.clientId);
      const term = searchVentes.toLowerCase();
      return (
        v.items.some(i => i.nom.toLowerCase().includes(term)) ||
        cName.toLowerCase().includes(term) ||
        formatDate(v.date).toLowerCase().includes(term)
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  const paginatedVentes = processedVentes.slice((pageVentes - 1) * itemsPerPage, pageVentes * itemsPerPage);
  const totalPagesVentes = Math.ceil(processedVentes.length / itemsPerPage);

  const processedDepenses = depenses
    .filter(d => {
      const term = searchDepenses.toLowerCase();
      return (
        d.description.toLowerCase().includes(term) ||
        (t(`finances.categories.${d.categorie}`) || '').toLowerCase().includes(term) ||
        formatDate(d.date).toLowerCase().includes(term)
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  const paginatedDepenses = processedDepenses.slice((pageDepenses - 1) * itemsPerPage, pageDepenses * itemsPerPage);
  const totalPagesDepenses = Math.ceil(processedDepenses.length / itemsPerPage);

  const modePaiementLabels: Record<string, string> = {
    especes: 'finances.paymentModes.especes',
    mobile_money: 'finances.paymentModes.mobile_money',
    carte: 'finances.paymentModes.carte',
    mixte: 'finances.paymentModes.mixte',
  };

  const handleAddVente = async (vente: Omit<Vente, 'id'>) => {
    try {
      const newVente = await addVenteAsync(vente);
      toast.success(t('finances.saleSuccess'));
      setShowVenteForm(false);
      if (newVente) setInvoiceVente(newVente);
    } catch (err) {
      console.error('Erreur enregistrement vente:', err);
      toast.error('Erreur lors de l\'enregistrement de la vente');
    }
  };

  const handleAddDepense = async (data: any) => {
    try {
      await addDepenseAsync({ date: data.date, categorie: data.categorie, description: data.description, montant: data.montant });
      toast.success(t('finances.expenseSuccess'));
      setShowDepenseForm(false);
    } catch (err) {
      console.error('Erreur enregistrement dépense:', err);
      toast.error('Erreur lors de l\'enregistrement de la dépense');
    }
  };

  const exportFinancesCSV = (ventesItems: Vente[], depensesItems: Depense[], label: string) => {
    let csv = `${t('finances.invoice.type')},${t('finances.date')},${t('finances.description')},${t('finances.amount')}\n`;
    ventesItems.forEach(v => { csv += `${t('finances.revenue')},${v.date},"${v.items.map(i => i.nom).join(', ')}",${v.totalMontant}\n`; });
    depensesItems.forEach(d => { csv += `${t('finances.expenses')},${d.date},"${d.description}",-${d.montant}\n`; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `rapport-caisse-${label.replace(/\s/g, '-')}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success(t('finances.exportCSV'));
  };

  const exportFinancesPDF = (ventesItems: Vente[], depensesItems: Depense[], label: string) => {
    const totalV = ventesItems.reduce((s, v) => s + v.totalMontant, 0);
    const totalD = depensesItems.reduce((s, d) => s + d.montant, 0);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${label}</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;max-width:800px;margin:auto}
    h1{font-size:18px;border-bottom:2px solid #d6336c;padding-bottom:8px}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
    th{background:#f5f5f5}
    .total{font-weight:bold;font-size:15px;margin:8px 0}
    .positive{color:#16a34a}.negative{color:#dc2626}
    </style></head><body>
    <h1>📊 ${label}</h1>
    <h2>${t('finances.revenue')}</h2>
    <table><tr><th>${t('finances.date')}</th><th>${t('finances.description')}</th><th>${t('finances.amount')}</th></tr>
    ${ventesItems.map(v => `<tr><td>${v.date}</td><td>${v.items.map(i => i.nom).join(', ')}</td><td class="positive">${formatCurrency(v.totalMontant)}</td></tr>`).join('')}
    </table><p class="total positive">${t('finances.totalSales')}: ${formatCurrency(totalV)}</p>
    <h2>${t('finances.expenses')}</h2>
    <table><tr><th>${t('finances.date')}</th><th>${t('finances.description')}</th><th>${t('finances.amount')}</th></tr>
    ${depensesItems.map(d => `<tr><td>${d.date}</td><td>${d.description}</td><td class="negative">${formatCurrency(d.montant)}</td></tr>`).join('')}
    </table><p class="total negative">${t('finances.totalExpenses')}: ${formatCurrency(totalD)}</p>
    <hr><p class="total">${t('finances.balance')}: <span class="${totalV - totalD >= 0 ? 'positive' : 'negative'}">${formatCurrency(totalV - totalD)}</span></p>
    </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 lg:space-y-8 max-w-[1400px] mx-auto">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-1">{t('finances.title')}</h1>
          <p className="text-muted-foreground font-medium">{t('finances.subtitle')}</p>
        </div>
        <div className="flex gap-2 flex-wrap md:flex-nowrap">
          {hasExport && (
            <Button onClick={() => exportFinancesCSV(ventes, depenses, 'complet')} variant="outline" size="icon" className="h-12 w-12 rounded-xl shadow-sm hidden sm:flex shrink-0 border-border/50">
              <Download className="h-5 w-5" />
            </Button>
          )}
          <Button onClick={() => setShowVenteForm(true)} className="gradient-primary flex-1 sm:flex-none h-12 rounded-xl shadow-xl shadow-primary/20 px-5 font-bold hover:scale-[1.02] transition-transform">
            <ShoppingCart className="h-5 w-5 mr-2" />{t('finances.newSale')}
          </Button>
          <Button onClick={() => setShowDepenseForm(true)} variant="outline" className="flex-1 sm:flex-none h-12 rounded-xl font-bold border-border/50 hover:bg-muted">
            <Receipt className="h-5 w-5 mr-2" />{t('finances.expense')}
          </Button>
        </div>
      </div>

      {/* ── STATS CARDS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-white to-muted/30 dark:from-card dark:to-muted/10">
          <CardContent className="p-4 lg:p-5 flex flex-col gap-3">
            <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-primary/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-primary" /></div>
            <div><p className="text-sm font-medium text-muted-foreground">{t('finances.monthRevenue')}</p><p className="text-2xl lg:text-3xl font-bold">{formatCurrency(stats.totalRevenus)}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-white to-muted/30 dark:from-card dark:to-muted/10">
          <CardContent className="p-4 lg:p-5 flex flex-col gap-3">
            <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-destructive/10 flex items-center justify-center"><TrendingDown className="h-5 w-5 lg:h-6 lg:w-6 text-destructive" /></div>
            <div><p className="text-sm font-medium text-muted-foreground">{t('finances.monthExpenses')}</p><p className="text-2xl lg:text-3xl font-bold">{formatCurrency(stats.totalDepenses)}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-white to-muted/30 dark:from-card dark:to-muted/10">
          <CardContent className="p-4 lg:p-5 flex flex-col gap-3">
            <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl flex items-center justify-center" style={{ background: stats.benefice >= 0 ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--destructive) / 0.1)' }}>
              <DollarSign className="h-5 w-5 lg:h-6 lg:w-6" style={{ color: stats.benefice >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }} />
            </div>
            <div><p className="text-sm font-medium text-muted-foreground">{t('finances.profit')}</p><p className={cn('text-2xl lg:text-3xl font-bold', stats.benefice < 0 && 'text-destructive', stats.benefice >= 0 && 'text-success')}>{formatCurrency(stats.benefice)}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-white to-muted/30 dark:from-card dark:to-muted/10">
          <CardContent className="p-4 lg:p-5 flex flex-col gap-3">
            <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-accent/10 flex items-center justify-center"><Wallet className="h-5 w-5 lg:h-6 lg:w-6 text-accent" /></div>
            <div><p className="text-sm font-medium text-muted-foreground">{t('finances.salesCount')}</p><p className="text-2xl lg:text-3xl font-bold">{stats.nombreVentes}</p></div>
          </CardContent>
        </Card>
      </div>

      {!hasExport && (
        <UpgradePrompt feature={language === 'fr' ? 'Export des données (Excel / CSV)' : 'Data export (Excel / CSV)'} currentPlan={plan.name} requiredPlan={getUpgradePlan()} type="banner" />
      )}
      {!hasProfitEstimation && (
        <UpgradePrompt feature={language === 'fr' ? 'Estimation détaillée des bénéfices' : 'Detailed profit estimation'} currentPlan={plan.name} requiredPlan={getUpgradePlan()} type="banner" />
      )}

      {/* ── CHARTS SUMMARY ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t('finances.revenueByService')}</CardTitle></CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between items-center mb-1.5"><span className="text-sm font-medium flex items-center gap-2"><LayoutList className="h-4 w-4 text-primary" /> {t('finances.services')}</span><span className="font-bold">{formatCurrency(stats.revenusPrestations)}</span></div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${stats.totalRevenus ? (stats.revenusPrestations / stats.totalRevenus * 100) : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5"><span className="text-sm font-medium flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-accent" /> {t('finances.products')}</span><span className="font-bold">{formatCurrency(stats.revenusProduits)}</span></div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${stats.totalRevenus ? (stats.revenusProduits / stats.totalRevenus * 100) : 0}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t('finances.byPaymentMethod')}</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-2">
            {Object.entries(stats.parModePaiement).map(([mode, montant]) => (
              <div key={mode} className="flex justify-between items-center bg-muted/30 p-2 px-3 rounded-lg">
                <Badge variant="outline" className="bg-background border-border/50">{t(modePaiementLabels[mode]) || mode}</Badge>
                <span className="font-bold text-primary">{formatCurrency(montant)}</span>
              </div>
            ))}
            {Object.keys(stats.parModePaiement).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{t('finances.noSalesThisMonth')}</p>}
          </CardContent>
        </Card>
      </div>

      {/* ── TABS ─────────────────────────────────────────────────── */}
      <Tabs defaultValue="ventes" className="w-full">
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar pb-1">
          <TabsList className="inline-flex w-max sm:w-full sm:grid sm:grid-cols-3 p-1.5 bg-muted/50 rounded-2xl h-auto">
            <TabsTrigger value="ventes" className="rounded-xl py-3 px-6 font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">{t('finances.salesTab')}</TabsTrigger>
            <TabsTrigger value="depenses" className="rounded-xl py-3 px-6 font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">{t('finances.expensesTab')}</TabsTrigger>
            <TabsTrigger value="caisse" className="rounded-xl py-3 px-6 font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">📊 {t('finances.cashReportTab')}</TabsTrigger>
          </TabsList>
        </div>

        {/* ── TAB: VENTES ── */}
        <TabsContent value="ventes" className="mt-6 outline-none">
          <div className="mb-4 relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('finances.searchSale') || 'Rechercher une vente...'} className="pl-9 h-10 bg-card border-none shadow-sm rounded-xl" value={searchVentes} onChange={e => { setSearchVentes(e.target.value); setPageVentes(1); }} />
          </div>
          <div className="hidden sm:block">
            <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-card">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-semibold min-w-[100px]">{t('finances.date')}</TableHead>
                    <TableHead className="font-semibold min-w-[120px]">{t('finances.client')}</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">{t('finances.articles')}</TableHead>
                    <TableHead className="font-semibold min-w-[100px]">{t('finances.payment')}</TableHead>
                    <TableHead className="text-right font-semibold min-w-[100px]">{t('finances.amount')}</TableHead>
                    <TableHead className="text-right font-semibold w-[80px]">{t('finances.invoice')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedVentes.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('finances.noSales') || 'Aucune vente enregistrée.'}</TableCell></TableRow>}
                  {paginatedVentes.map(v => (
                    <TableRow key={v.id} className="border-border/50">
                      <TableCell className="whitespace-nowrap font-medium text-muted-foreground">{formatDate(v.date)}</TableCell>
                      <TableCell className="font-bold whitespace-nowrap">{getClientName(v.clientId)}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm font-medium">{v.items.map(item => item.nom).join(', ')}</TableCell>
                      <TableCell><Badge variant="secondary" className="whitespace-nowrap rounded-lg bg-muted/50">{t(modePaiementLabels[v.modePaiement])}</Badge></TableCell>
                      <TableCell className="text-right font-bold text-primary whitespace-nowrap">{formatCurrency(v.totalMontant)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary hover:bg-primary/10" onClick={() => setInvoiceVente(v)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteVenteTarget(v)} title={t('common.delete') || 'Supprimer'}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPagesVentes > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">{t('common.page') || 'Page'} {pageVentes} {t('common.of') || 'sur'} {totalPagesVentes}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPageVentes(p => Math.max(1, p - 1))} disabled={pageVentes === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setPageVentes(p => Math.min(totalPagesVentes, p + 1))} disabled={pageVentes === totalPagesVentes}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="sm:hidden flex flex-col gap-3">
            {processedVentes.length === 0 && <div className="text-center py-8 text-muted-foreground">{t('finances.noSales') || 'Aucune vente enregistrée.'}</div>}
            {paginatedVentes.map(v => (
              <TransactionCard key={v.id} item={v} type="vente" getClientName={getClientName} formatDate={formatDate} formatCurrency={formatCurrency} setInvoiceVente={setInvoiceVente} setDeleteVenteTarget={setDeleteVenteTarget} isOwner={isOwner} modePaiementLabels={modePaiementLabels} t={t} />
            ))}
            {totalPagesVentes > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">{t('common.page') || 'Page'} {pageVentes} {t('common.of') || 'sur'} {totalPagesVentes}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPageVentes(p => Math.max(1, p - 1))} disabled={pageVentes === 1}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setPageVentes(p => Math.min(totalPagesVentes, p + 1))} disabled={pageVentes === totalPagesVentes}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── TAB: DEPENSES ── */}
        <TabsContent value="depenses" className="mt-6 outline-none">
          <div className="mb-4 relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('finances.searchExpense') || 'Rechercher une dépense...'} className="pl-9 h-10 bg-card border-none shadow-sm rounded-xl" value={searchDepenses} onChange={e => { setSearchDepenses(e.target.value); setPageDepenses(1); }} />
          </div>
          <div className="hidden sm:block">
            <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-card">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-semibold min-w-[100px]">{t('finances.date')}</TableHead>
                    <TableHead className="font-semibold min-w-[120px]">{t('finances.category')}</TableHead>
                    <TableHead className="font-semibold min-w-[150px]">{t('finances.description')}</TableHead>
                    <TableHead className="text-right font-semibold min-w-[100px]">{t('finances.amount')}</TableHead>
                    {isOwner && <TableHead className="w-[50px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedDepenses.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('finances.noExpenses') || 'Aucune dépense enregistrée.'}</TableCell></TableRow>}
                  {paginatedDepenses.map(d => (
                    <TableRow key={d.id} className="border-border/50">
                      <TableCell className="whitespace-nowrap font-medium text-muted-foreground">{formatDate(d.date)}</TableCell>
                      <TableCell className="whitespace-nowrap"><Badge variant="outline" className="rounded-lg bg-background border-border/50">{t(`finances.categories.${d.categorie}`)}</Badge></TableCell>
                      <TableCell className="max-w-[300px] truncate font-medium">{d.description}</TableCell>
                      <TableCell className="text-right font-bold text-destructive whitespace-nowrap">-{formatCurrency(d.montant)}</TableCell>
                      {isOwner && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteDepenseTarget(d)} title={t('common.delete') || 'Supprimer'}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPagesDepenses > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">{t('common.page') || 'Page'} {pageDepenses} {t('common.of') || 'sur'} {totalPagesDepenses}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPageDepenses(p => Math.max(1, p - 1))} disabled={pageDepenses === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setPageDepenses(p => Math.min(totalPagesDepenses, p + 1))} disabled={pageDepenses === totalPagesDepenses}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="sm:hidden flex flex-col gap-3">
            {processedDepenses.length === 0 && <div className="text-center py-8 text-muted-foreground">{t('finances.noExpenses') || 'Aucune dépense enregistrée.'}</div>}
            {paginatedDepenses.map(d => (
              <TransactionCard key={d.id} item={d} type="depense" getClientName={getClientName} formatDate={formatDate} formatCurrency={formatCurrency} setDeleteDepenseTarget={setDeleteDepenseTarget} isOwner={isOwner} t={t} />
            ))}
            {totalPagesDepenses > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">{t('common.page') || 'Page'} {pageDepenses} {t('common.of') || 'sur'} {totalPagesDepenses}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPageDepenses(p => Math.max(1, p - 1))} disabled={pageDepenses === 1}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setPageDepenses(p => Math.min(totalPagesDepenses, p + 1))} disabled={pageDepenses === totalPagesDepenses}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="caisse" className="mt-6 outline-none">
          <GlobalCashReport
            ventes={ventes}
            depenses={depenses}
            hasExport={hasExport}
            onExportCSV={({ ventes, depenses, label }) => exportFinancesCSV(ventes, depenses, label)}
            onExportPDF={({ ventes, depenses, label }) => exportFinancesPDF(ventes, depenses, label)}
          />
        </TabsContent>
      </Tabs>

      {/* ── FORMS DRAWER/DIALOG ─────────────────────────────────────────────────── */}
      <FormWrapper open={showVenteForm} onOpenChange={setShowVenteForm}>
        <FormContent className={isMobile ? "p-0 bg-background border-none rounded-t-[30px] overflow-hidden max-h-[92vh] outline-none" : "sm:max-w-xl w-[95vw] sm:w-full rounded-[24px] p-0 overflow-hidden border-none shadow-2xl"}>
          <div className="bg-primary/5 p-6 border-b border-border/50">
            <FormHeader className="p-0 text-left">
              <FormTitle className="text-2xl font-bold flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-primary" />
                {t('finances.newSaleTitle')}
              </FormTitle>
              <FormDescription className="text-sm font-medium text-muted-foreground mt-1">
                {t('finances.newSaleDesc', 'Enregistrez une nouvelle vente et choisissez un profil client si nécessaire.')}
              </FormDescription>
            </FormHeader>
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(92vh-100px)]">
            <VenteForm onSubmit={handleAddVente} onCancel={() => setShowVenteForm(false)} />
          </div>
        </FormContent>
      </FormWrapper>

      <FormWrapper open={showDepenseForm} onOpenChange={setShowDepenseForm}>
        <FormContent className={isMobile ? "p-0 bg-background border-none rounded-t-[30px] overflow-hidden max-h-[92vh] outline-none" : "sm:max-w-md w-[95vw] sm:w-full rounded-[24px] p-0 overflow-hidden border-none shadow-2xl"}>
          <div className="bg-primary/5 p-6 border-b border-border/50">
            <FormHeader className="p-0 text-left">
              <FormTitle className="text-2xl font-bold flex items-center gap-2">
                <Receipt className="h-6 w-6 text-primary" />
                {t('finances.newExpenseTitle')}
              </FormTitle>
              <FormDescription className="text-sm font-medium text-muted-foreground mt-1">
                {t('finances.newExpenseDesc', 'Tracez vos sorties d\'argent (loyer, matériel, eau/électricité).')}
              </FormDescription>
            </FormHeader>
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(92vh-100px)]">
            <DepenseForm onSubmit={handleAddDepense} onCancel={() => setShowDepenseForm(false)} />
          </div>
        </FormContent>
      </FormWrapper>

      {/* Confirmation suppression vente */}
      <Dialog open={!!deleteVenteTarget} onOpenChange={() => setDeleteVenteTarget(null)}>
        <DialogContent className="sm:max-w-sm w-[90vw] rounded-3xl p-6 border-none shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <DialogTitle className="text-xl font-bold">{t('finances.deleteSaleTitle', 'Supprimer la vente ?')}</DialogTitle>
            </div>
            <DialogDescription className="text-sm font-medium text-muted-foreground pl-[60px]">
              {t('finances.deleteSaleDesc', 'Cette action est irréversible. La vente du {date} ({amount}) sera définitivement supprimée.', { date: deleteVenteTarget ? formatDate(deleteVenteTarget.date) : '', amount: deleteVenteTarget ? formatCurrency(deleteVenteTarget.totalMontant) : '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold bg-muted/50" onClick={() => setDeleteVenteTarget(null)}>{t('common.cancel', 'Annuler')}</Button>
            <Button variant="destructive" className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-destructive/20" onClick={() => { if (deleteVenteTarget) { deleteVente(deleteVenteTarget.id || (deleteVenteTarget as any)._id); toast.success(t('finances.saleDeleted', 'Vente supprimée')); setDeleteVenteTarget(null); } }}>
              <Trash2 className="h-5 w-5 mr-2" /> {t('common.delete', 'Supprimer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation suppression dépense */}
      <Dialog open={!!deleteDepenseTarget} onOpenChange={() => setDeleteDepenseTarget(null)}>
        <DialogContent className="sm:max-w-sm w-[90vw] rounded-3xl p-6 border-none shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <DialogTitle className="text-xl font-bold">Supprimer la dépense ?</DialogTitle>
            </div>
            <DialogDescription className="text-sm font-medium text-muted-foreground pl-[60px]">
              Cette action est irréversible. La dépense{' '}
              <strong className="text-foreground">{deleteDepenseTarget?.description}</strong>{' '}
              ({deleteDepenseTarget ? formatCurrency(deleteDepenseTarget.montant) : ''}) sera définitivement supprimée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold bg-muted/50" onClick={() => setDeleteDepenseTarget(null)}>Annuler</Button>
            <Button variant="destructive" className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-destructive/20" onClick={() => { if (deleteDepenseTarget) { deleteDepense(deleteDepenseTarget.id || (deleteDepenseTarget as any)._id); toast.success('Dépense supprimée'); setDeleteDepenseTarget(null); } }}>
              <Trash2 className="h-5 w-5 mr-2" /> Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Facture */}
      {invoiceVente && (
        <InvoiceGenerator
          vente={invoiceVente}
          isOpen={!!invoiceVente}
          onClose={() => setInvoiceVente(null)}
          onDeleteRequest={() => {
            setDeleteVenteTarget(invoiceVente);
            setInvoiceVente(null);
          }}
        />
      )}
    </div>
  );
}
