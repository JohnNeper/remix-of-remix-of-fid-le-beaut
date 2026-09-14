import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Plus, RefreshCw, FileText, Trash2,
  Scissors, Package, CreditCard, TrendingUp, Clock, User,
  Banknote, Smartphone, Check, Sparkles, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStock } from '@/hooks/useStock';
import { usePrestations } from '@/hooks/usePrestations';
import { useClients } from '@/hooks/useClients';
import { useTranslations } from '@/hooks/useTranslations';
import { api } from '@/lib/api';
import { Vente, VenteItem } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { InvoiceGenerator } from '@/components/finances/InvoiceGenerator';
import { ClientSearchInput } from '@/components/clients/ClientSearchInput';

// ─── Helpers ────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatTime(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateFR(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
}

// ─── VenteForm inline (Mobile-first & Touch-friendly) ───────────────────────

interface CaisseFormProps {
  onSubmit: (v: Omit<Vente, 'id'>) => Promise<void>;
  onCancel: () => void;
}

function CaisseForm({ onSubmit, onCancel }: CaisseFormProps) {
  const { produits } = useStock();
  const { typesPrestations } = usePrestations();
  const { clients } = useClients();
  const { t } = useLanguage();
  const { formatCurrency } = useTranslations();

  const [items, setItems] = useState<VenteItem[]>([]);
  const [clientId, setClientId] = useState('');
  const [modePaiement, setModePaiement] = useState<'especes' | 'mobile_money' | 'carte' | 'mixte'>('especes');
  const [itemType, setItemType] = useState<'produit' | 'prestation'>('prestation');
  const [selectedRef, setSelectedRef] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    if (!selectedRef) return;
    const refId = String(selectedRef);
    let nom = '';

    if (itemType === 'produit') {
      const p = produits.find(p => String(p.id) === refId || String((p as any)._id) === refId);
      if (!p) { toast.error('Produit non trouvé'); return; }
      nom = p.nom;
    } else {
      const tp = typesPrestations.find(tp => String(tp.id) === refId || String((tp as any)._id) === refId);
      if (!tp) { toast.error('Prestation non trouvée'); return; }
      nom = tp.nom;
    }

    setItems(prev => [...prev, {
      type: itemType,
      referenceId: refId,
      nom,
      quantite: itemQty,
      prixUnitaire: itemPrice,
      montant: itemPrice * itemQty,
    }]);
    setSelectedRef('');
    setItemQty(1);
    setItemPrice(0);
  };

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const total = items.reduce((s, i) => s + i.montant, 0);

  const handleSubmit = async () => {
    if (items.length === 0) { toast.error(t('finances.addAtLeastOne') || 'Ajoutez au moins un article'); return; }
    setLoading(true);
    const resolvedClientId = (clientId && clientId !== 'none') ? clientId : undefined;
    try {
      await onSubmit({
        date: todayStr(),
        clientId: resolvedClientId,
        items,
        totalMontant: total,
        modePaiement,
        notes,
      } as any);
    } finally {
      setLoading(false);
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

          {/* Segmented Type Toggle (Prestation vs Produit) */}
          <div className="grid grid-cols-2 p-1 bg-muted/60 dark:bg-muted/30 rounded-xl gap-1 border border-border/50">
            <button
              type="button"
              onClick={() => { setItemType('prestation'); setSelectedRef(''); setItemPrice(0); }}
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
              onClick={() => { setItemType('produit'); setSelectedRef(''); setItemPrice(0); }}
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
              if (item) setItemPrice(item.prix);
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
                  value={itemPrice || ''}
                  onChange={e => setItemPrice(Number(e.target.value))}
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

        {/* 5. Notes & Advice */}
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
            placeholder="Ex: Soin hydratant recommandé, prochaine visite suggérée dans 3 semaines..."
            className="w-full min-h-[72px] max-h-[120px] rounded-xl border border-input bg-card px-3 py-2.5 text-base sm:text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      {/* Sticky Bottom Actions with Safe Area Inset */}
      <div 
        className="shrink-0 bg-card/95 backdrop-blur-md p-4 sm:p-5 border-t border-border/60 z-10 flex gap-3 shadow-lg"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <Button variant="outline" onClick={onCancel} className="flex-1 rounded-xl h-12 text-sm font-semibold">
          {t('common.cancel') || 'Annuler'}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || items.length === 0}
          className="flex-[2] gradient-primary text-white font-bold rounded-xl h-12 shadow-md gap-2 active:scale-98 transition-transform text-sm sm:text-base"
        >
          {loading ? (
            <span>Enregistrement...</span>
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

// ─── Page principale Caisse ──────────────────────────────────────────────────

export default function Caisse() {
  const { session, currentSalon } = useAuth();
  const { t } = useLanguage();
  const { formatCurrency } = useTranslations();

  const salonId = session?.salonId || '';
  const today = todayStr();

  const [ventes, setVentes] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [invoiceVente, setInvoiceVente] = useState<Vente | null>(null);

  const fetchVentes = useCallback(async () => {
    if (!salonId) return;
    setLoading(true);
    try {
      const data = await api.getVentes(salonId);
      setVentes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  useEffect(() => {
    fetchVentes();
  }, [fetchVentes]);

  // Statistiques du jour
  const totalJour = ventes.reduce((s, v) => s + v.totalMontant, 0);
  const nbArticles = ventes.reduce((s, v) => s + (v.items?.length || 0), 0);
  const nbPrestations = ventes.reduce(
    (s, v) => s + (v.items?.filter(i => i.type === 'prestation').length || 0), 0
  );
  const nbProduits = ventes.reduce(
    (s, v) => s + (v.items?.filter(i => i.type === 'produit').length || 0), 0
  );

  const handleAddVente = async (vente: Omit<Vente, 'id'>) => {
    const newVente = await api.createVente(salonId, vente);
    toast.success(t('finances.saleSuccess'));
    setShowForm(false);
    await fetchVentes();
    if (newVente) setInvoiceVente(newVente as Vente);
  };

  const handleDeleteVente = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette vente ? Cette action est irréversible.')) return;
    try {
      await api.deleteVente(salonId, id);
      toast.success('Vente supprimée avec succès');
      fetchVentes();
    } catch (e) {
      toast.error('Erreur lors de la suppression de la vente');
    }
  };

  const modePaiementLabels: Record<string, string> = {
    especes: t('finances.paymentModes.especes'),
    mobile_money: t('finances.paymentModes.mobile_money'),
    carte: t('finances.paymentModes.carte'),
    mixte: t('finances.paymentModes.mixte'),
  };

  const getClientName = (clientId?: any) => {
    if (!clientId) return <span className="italic text-muted-foreground text-xs">Anonyme</span>;
    if (typeof clientId === 'object') return clientId.nom || 'Client';
    return <span className="italic text-muted-foreground text-xs">Anonyme</span>;
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            Caisse du jour
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {formatDateFR(today)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchVentes} className="gap-1.5">
            <RefreshCw className="h-4 w-4" /> Actualiser
          </Button>
          <Button onClick={() => setShowForm(true)} className="gradient-primary text-white gap-2 font-bold">
            <Plus className="h-4 w-4" /> Nouvelle vente
          </Button>
        </div>
      </div>

      {/* Stats du jour */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="card-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recettes</p>
                <p className="text-lg font-black text-primary">{formatCurrency(totalJour)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ventes</p>
                <p className="text-lg font-black">{ventes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Scissors className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Prestations</p>
                <p className="text-lg font-black">{nbPrestations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Produits vendus</p>
                <p className="text-lg font-black">{nbProduits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des ventes du jour */}
      <Card className="card-shadow overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Ventes enregistrées aujourd'hui
            <Badge variant="secondary" className="ml-1">{ventes.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : ventes.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto">
                <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="font-semibold text-foreground">Aucune vente aujourd'hui</p>
              <p className="text-sm text-muted-foreground">Commencez par enregistrer votre première vente du jour</p>
              <Button onClick={() => setShowForm(true)} className="gradient-primary text-white mt-2">
                <Plus className="h-4 w-4 mr-2" /> Nouvelle vente
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="min-w-[80px]">Heure</TableHead>
                    <TableHead className="min-w-[120px]">Client(e)</TableHead>
                    <TableHead className="hidden md:table-cell">Articles</TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventes
                    .slice()
                    .sort((a, b) => {
                      const ta = (a as any).createdAt || '';
                      const tb = (b as any).createdAt || '';
                      return tb.localeCompare(ta);
                    })
                    .map(v => {
                      const id = (v as any)._id || v.id;
                      return (
                        <TableRow key={id} className="hover:bg-muted/20">
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {(v as any).createdAt ? formatTime((v as any).createdAt) : '—'}
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">
                            {getClientName(v.clientId)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[260px]">
                            <div className="flex flex-wrap gap-1">
                              {(v.items || []).map((item, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className={cn(
                                    'text-[10px] px-1.5',
                                    item.type === 'prestation'
                                      ? 'bg-primary/10 text-primary'
                                      : 'bg-emerald-500/10 text-emerald-700'
                                  )}
                                >
                                  {item.type === 'prestation'
                                    ? <Scissors className="h-2.5 w-2.5 inline mr-0.5" />
                                    : <Package className="h-2.5 w-2.5 inline mr-0.5" />}
                                  {item.nom}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {modePaiementLabels[v.modePaiement] || v.modePaiement}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary whitespace-nowrap">
                            {formatCurrency(v.totalMontant)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() => setInvoiceVente(v)}
                                title="Voir la facture"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteVente(id)}
                                title="Supprimer la vente"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog nouvelle vente */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-full sm:max-w-xl max-h-[92dvh] h-[92dvh] sm:h-[85vh] flex flex-col p-0 overflow-hidden rounded-t-3xl rounded-b-none sm:rounded-3xl border-border/60">
          <DialogHeader className="shrink-0 p-4 sm:p-5 border-b border-border/40 bg-card/50 backdrop-blur-md">
            <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-foreground">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Nouvelle vente
            </DialogTitle>
          </DialogHeader>
          <CaisseForm onSubmit={handleAddVente} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Facture */}
      {invoiceVente && (
        <InvoiceGenerator
          vente={invoiceVente}
          isOpen={!!invoiceVente}
          onClose={() => setInvoiceVente(null)}
          onDeleteRequest={() => {
            setInvoiceVente(null);
            setTimeout(() => handleDeleteVente(invoiceVente.id || (invoiceVente as any)._id), 100);
          }}
        />
      )}
    </div>
  );
}
