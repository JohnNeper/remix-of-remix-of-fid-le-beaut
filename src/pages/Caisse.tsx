import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Plus, RefreshCw, FileText, Trash2,
  Scissors, Package, CreditCard, TrendingUp, Clock, User
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

// ─── VenteForm inline ────────────────────────────────────────────────────────

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

  const modePaiementOptions = [
    { value: 'especes', label: t('finances.paymentModes.especes') },
    { value: 'mobile_money', label: t('finances.paymentModes.mobile_money') },
    { value: 'carte', label: t('finances.paymentModes.carte') },
    { value: 'mixte', label: t('finances.paymentModes.mixte') },
  ];

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
    if (items.length === 0) { toast.error(t('finances.addAtLeastOne')); return; }
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

  return (
    <div className="space-y-5">
      {/* Client */}
      <div>
        <label className="text-sm font-semibold mb-1.5 flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          {t('finances.clientOptional')}
          <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {t('common.optional')}
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

      {/* Ajouter article */}
      <Card className="bg-muted/20 border-dashed">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> {t('finances.addArticle')}
          </p>

          {/* Type + Article — empilés sur mobile */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={itemType}
              onValueChange={(v) => { setItemType(v as any); setSelectedRef(''); setItemPrice(0); }}
            >
              <SelectTrigger className="w-full sm:w-[140px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prestation">
                  <span className="flex items-center gap-1.5"><Scissors className="h-3.5 w-3.5" />{t('finances.services')}</span>
                </SelectItem>
                <SelectItem value="produit">
                  <span className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5" />{t('finances.products')}</span>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedRef} onValueChange={(val) => {
              setSelectedRef(val);
              const item = itemType === 'produit'
                ? produits.find(p => String(p.id) === val || String((p as any)._id) === val)
                : typesPrestations.find(tp => String(tp.id) === val || String((tp as any)._id) === val);
              if (item) setItemPrice(item.prix);
            }}>
              <SelectTrigger className="flex-1 bg-background">
                <SelectValue placeholder={t('finances.choose')} />
              </SelectTrigger>
              <SelectContent>
                {itemType === 'produit'
                  ? produits.map(p => (
                    <SelectItem key={(p as any)._id || p.id} value={(p as any)._id || p.id}>
                      {p.nom} ({formatCurrency(p.prix)})
                    </SelectItem>
                  ))
                  : typesPrestations.map(tp => (
                    <SelectItem key={(tp as any)._id || tp.id} value={(tp as any)._id || tp.id}>
                      {tp.nom} ({formatCurrency(tp.prix)})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prix + Qté + Ajouter */}
          <div className="flex flex-wrap gap-2">
            <Input
              type="number"
              value={itemPrice || ''}
              onChange={e => setItemPrice(Number(e.target.value))}
              placeholder={t('finances.amount')}
              className="flex-1 min-w-[100px] bg-background"
            />
            <Input
              type="number"
              value={itemQty}
              onChange={e => setItemQty(Math.max(1, Number(e.target.value)))}
              min={1}
              className="w-16 bg-background text-center"
              placeholder="Qté"
            />
            <Button type="button" onClick={addItem} variant="secondary" className="px-4 gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden xs:inline">Ajouter</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des articles */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-background border rounded-xl p-3 text-sm"
            >
              <div className="flex items-center gap-2">
                {item.type === 'prestation'
                  ? <Scissors className="h-4 w-4 text-primary" />
                  : <Package className="h-4 w-4 text-emerald-500" />}
                <div>
                  <p className="font-semibold">{item.nom}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.prixUnitaire)} × {item.quantite}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">{formatCurrency(item.montant)}</span>
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  onClick={() => removeItem(idx)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="flex justify-between items-center p-3 bg-primary/5 rounded-xl border border-primary/20">
            <span className="font-bold text-sm uppercase tracking-wide">Total</span>
            <span className="text-xl font-black text-primary">{formatCurrency(total)}</span>
          </div>
        </div>
      )}

      {/* Mode de paiement */}
      <div>
        <label className="text-sm font-semibold mb-1.5 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          {t('finances.paymentMethod')}
        </label>
        <Select value={modePaiement} onValueChange={(v) => setModePaiement(v as any)}>
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {modePaiementOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes / Recommandations */}
      <div>
        <label className="text-sm font-semibold mb-1.5 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Notes & Recommandations post-prestation
          <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {t('common.optional') || 'Optionnel'}
          </span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: Peau sensible, boutons sur les joues. Hydrater matin/soir avec de l'aloé vera."
          className="w-full min-h-[80px] max-h-[140px] rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || items.length === 0}
          className="flex-1 gradient-primary text-white font-bold"
        >
          {loading ? 'Enregistrement...' : t('finances.saveSale')}
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
        <DialogContent className="w-[95vw] max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl flex items-center gap-2">
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
