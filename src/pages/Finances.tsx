import React, { useState } from 'react';
import {
  Plus, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Receipt, Wallet, Download,
  FileText, Trash2, AlertTriangle, Calendar, Tag, FileSignature, Banknote, CreditCard,
  Layers, LayoutList, CheckCircle2, Search, ChevronLeft, ChevronRight, Loader2,
  Scissors, Package, Smartphone, RefreshCw, Check, User
} from 'lucide-react';
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
import { ClientSearchInput } from '@/components/clients/ClientSearchInput';

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
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 sm:space-y-6">
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
        </div>
        <div className="shrink-0 bg-background/95 dark:bg-slate-900/95 backdrop-blur-md p-4 sm:p-6 border-t border-border/60 dark:border-slate-800 z-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button type="button" variant="outline" disabled={isSaving} onClick={onCancel} className="flex-1 h-12 rounded-xl font-bold text-foreground dark:text-slate-100 bg-muted/60 dark:bg-slate-800 hover:bg-muted dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-all order-2 sm:order-1">{t('common.cancel')}</Button>
          <Button type="submit" disabled={isSaving || form.formState.isSubmitting} className="flex-1 h-12 rounded-xl font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/30 transition-all order-1 sm:order-2 disabled:opacity-50">
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
  const [itemType, setItemType] = useState<'produit' | 'prestation'>('prestation');
  const [selectedRef, setSelectedRef] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [prixUnitaire, setPrixUnitaire] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
    setSelectedRef('');
    setItemQty(1);
    setPrixUnitaire(0);
  };

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const total = items.reduce((s, i) => s + i.montant, 0);

  const handleSubmit = async () => {
    if (isSaving) return;
    if (items.length === 0) { toast.error(t('finances.addAtLeastOne') || 'Ajoutez au moins un article'); return; }
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

  const paymentMethods = [
    { id: 'especes', label: t('finances.paymentModes.especes') || 'Espèces', icon: Banknote, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/40' },
    { id: 'mobile_money', label: t('finances.paymentModes.mobile_money') || 'Mobile Money', icon: Smartphone, color: 'text-amber-600 bg-amber-500/10 border-amber-200 dark:border-amber-900/40' },
    { id: 'carte', label: t('finances.paymentModes.carte') || 'Carte Bancaire', icon: CreditCard, color: 'text-blue-600 bg-blue-500/10 border-blue-200 dark:border-blue-900/40' },
    { id: 'mixte', label: t('finances.paymentModes.mixte') || 'Paiement Mixte', icon: RefreshCw, color: 'text-purple-600 bg-purple-500/10 border-purple-200 dark:border-purple-900/40' },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-background">
      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 -webkit-overflow-scrolling-touch">
        
        {/* 1. Client Picker */}
        <div className="bg-card border border-border/70 rounded-2xl p-3.5 sm:p-4 shadow-xs">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              {t('finances.clientOptional') || 'Client du salon'}
            </span>
            <span className="text-[10px] font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {t('common.optional') || 'Optionnel'}
            </span>
          </label>
          <ClientSearchInput
            clients={clients}
            defaultValue={clientId}
            isStaff={useAuth().session?.userRole === 'staff'}
            onSelect={(client) => {
              if (client === 'anonymous') {
                setClientId('none');
              } else {
                setClientId(client.id);
              }
            }}
          />
        </div>

        {/* 2. Add Item Card */}
        <div className="bg-muted/20 border border-border/80 rounded-2xl p-3.5 sm:p-4 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> {t('finances.addArticle') || 'Ajouter une prestation ou produit'}
            </p>
            {selectedRef && (
              <Badge variant="outline" className="text-[10px] font-bold text-primary bg-primary/5 border-primary/20">
                Sélectionné
              </Badge>
            )}
          </div>

          {/* Segmented Type Toggle */}
          <div className="grid grid-cols-2 p-1 bg-muted/60 dark:bg-muted/30 rounded-xl gap-1 border border-border/50">
            <button
              type="button"
              onClick={() => { setItemType('prestation'); setSelectedRef(''); setPrixUnitaire(0); }}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200",
                itemType === 'prestation' 
                  ? "bg-card text-primary shadow-xs font-bold" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Scissors className="h-4 w-4 shrink-0" />
              <span>{t('finances.services') || 'Prestations'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setItemType('produit'); setSelectedRef(''); setPrixUnitaire(0); }}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200",
                itemType === 'produit' 
                  ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-xs font-bold" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Package className="h-4 w-4 shrink-0" />
              <span>{t('finances.products') || 'Produits'}</span>
            </button>
          </div>

          {/* Item Selector Dropdown */}
          <div className="space-y-1">
            <Select value={selectedRef} onValueChange={(val) => {
              setSelectedRef(val);
              const item = itemType === 'produit'
                ? produits.find(p => String(p.id) === val || String((p as any)._id) === val)
                : typesPrestations.find(tp => String(tp.id) === val || String((tp as any)._id) === val);
              if (item) setPrixUnitaire(item.prix);
            }}>
              <SelectTrigger className="w-full h-12 rounded-xl bg-card border border-border/80 text-base sm:text-sm font-medium shadow-xs focus:ring-primary/20">
                <SelectValue placeholder={itemType === 'prestation' ? 'Sélectionnez une prestation...' : 'Sélectionnez un produit...'} />
              </SelectTrigger>
              <SelectContent className="max-h-60 rounded-xl z-50">
                {itemType === 'produit'
                  ? produits.map(p => (
                    <SelectItem key={(p as any)._id || p.id} value={(p as any)._id || p.id} className="py-2.5">
                      <span className="font-semibold">{p.nom}</span>
                      <span className="ml-2 text-xs text-muted-foreground">({formatCurrency(p.prix)})</span>
                    </SelectItem>
                  ))
                  : typesPrestations.map(tp => (
                    <SelectItem key={(tp as any)._id || tp.id} value={(tp as any)._id || tp.id} className="py-2.5">
                      <span className="font-semibold">{tp.nom}</span>
                      <span className="ml-2 text-xs text-muted-foreground">({formatCurrency(tp.prix)})</span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price, Quantity Stepper & Add Button */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end pt-1">
            {/* Price Field */}
            <div className="sm:col-span-6 space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">{t('finances.amount') || 'Prix unitaire'}</label>
              <div className="relative">
                <Input
                  type="number"
                  value={prixUnitaire || ''}
                  onChange={e => setPrixUnitaire(Number(e.target.value))}
                  placeholder="0"
                  className="h-11 rounded-xl bg-card border border-border/80 text-base font-bold text-foreground pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold pointer-events-none">
                  FCFA
                </span>
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="sm:col-span-3 space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Quantité</label>
              <div className="flex items-center justify-between bg-card border border-border/80 rounded-xl p-1 h-11">
                <button
                  type="button"
                  onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                  className="h-9 w-9 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 text-foreground font-bold text-lg active:scale-95 transition-transform"
                >
                  −
                </button>
                <span className="font-bold text-base px-2">{itemQty}</span>
                <button
                  type="button"
                  onClick={() => setItemQty(itemQty + 1)}
                  className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-lg active:scale-95 transition-transform"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add Button */}
            <div className="sm:col-span-3">
              <Button
                type="button"
                onClick={addItem}
                disabled={!selectedRef}
                className="w-full h-11 rounded-xl gradient-primary font-bold shadow-sm gap-1.5 active:scale-98 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 3. Items Cart List */}
        {items.length > 0 && (
          <div className="space-y-2.5 bg-card border border-border/70 rounded-2xl p-3.5 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Articles dans la vente ({items.length})
              </span>
              <span className="text-xs font-bold text-primary">
                {formatCurrency(total)}
              </span>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-muted/30 border border-border/50 rounded-xl p-3 text-sm transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      item.type === 'prestation' ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-600"
                    )}>
                      {item.type === 'prestation' ? <Scissors className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{item.nom}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.prixUnitaire)} × {item.quantite}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-extrabold text-foreground text-sm">{formatCurrency(item.montant)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                      onClick={() => removeItem(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Row */}
            <div className="flex justify-between items-center p-3 bg-primary/5 rounded-xl border border-primary/20 mt-2">
              <span className="font-bold text-sm uppercase tracking-wide text-foreground">Total à encaisser</span>
              <span className="text-xl font-black text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
        )}

        {/* 4. Payment Mode Grid */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-primary" />
            {t('finances.paymentMethod') || 'Mode de règlement'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {paymentMethods.map(pm => {
              const isSelected = modePaiement === pm.id;
              const Icon = pm.icon;
              return (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setModePaiement(pm.id as any)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all gap-1.5 text-center active:scale-95",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-xs font-bold text-foreground"
                      : "border-border/60 bg-card hover:bg-muted/30 text-muted-foreground font-medium"
                  )}
                >
                  <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center", pm.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs leading-tight">{pm.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Notes & Conseils post-prestation
            </span>
            <span className="text-[10px] font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {t('common.optional') || 'Optionnel'}
            </span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Soin hydratant recommandé, prochaine visite..."
            className="w-full min-h-[72px] max-h-[120px] rounded-xl border border-input bg-card px-3 py-2.5 text-base sm:text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div 
        className="shrink-0 bg-card/95 backdrop-blur-md p-4 sm:p-5 border-t border-border/60 z-10 flex gap-3 shadow-lg"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <Button variant="outline" disabled={isSaving} onClick={onCancel} className="flex-1 rounded-xl h-12 text-sm font-semibold">
          {t('common.cancel') || 'Annuler'}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSaving || items.length === 0}
          className="flex-[2] gradient-primary text-white font-bold rounded-xl h-12 shadow-md gap-2 active:scale-98 transition-transform text-sm sm:text-base"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Enregistrement...</span>
            </span>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>{t('finances.saveSale') || 'Enregistrer'} {items.length > 0 ? `(${formatCurrency(total)})` : ''}</span>
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
  const isOwner = session?.userRole === 'owner' || session?.userRole === 'co_owner' || session?.type === 'admin';
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
        <FormContent className={isMobile ? "p-0 bg-background border-none rounded-t-[30px] overflow-hidden max-h-[92vh] outline-none flex flex-col" : "sm:max-w-xl w-[95vw] sm:w-full rounded-[24px] p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[90vh]"}>
          <div className="bg-primary/5 p-6 border-b border-border/50 shrink-0">
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
          <VenteForm onSubmit={handleAddVente} onCancel={() => setShowVenteForm(false)} />
        </FormContent>
      </FormWrapper>

      <FormWrapper open={showDepenseForm} onOpenChange={setShowDepenseForm}>
        <FormContent className={isMobile ? "p-0 bg-background border-none rounded-t-[30px] overflow-hidden max-h-[92vh] outline-none flex flex-col" : "sm:max-w-md w-[95vw] sm:w-full rounded-[24px] p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[90vh]"}>
          <div className="bg-primary/5 p-6 border-b border-border/50 shrink-0">
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
          <DepenseForm onSubmit={handleAddDepense} onCancel={() => setShowDepenseForm(false)} />
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
