import React, { useState, useMemo } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Receipt, Wallet, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

function DepenseForm({ onSubmit, onCancel }: { onSubmit: (d: z.infer<typeof depenseSchema>) => void; onCancel: () => void }) {
  const form = useForm<z.infer<typeof depenseSchema>>({
    resolver: zodResolver(depenseSchema),
    defaultValues: { date: new Date().toISOString().split('T')[0], categorie: '', description: '', montant: 0 },
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="date" render={({ field }) => (
          <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="categorie" render={({ field }) => (
          <FormItem><FormLabel>Catégorie</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger></FormControl>
              <SelectContent>
                {['Fournitures', 'Loyer', 'Salaires', 'Eau & Électricité', 'Transport', 'Marketing', 'Équipement', 'Autre'].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Description..." className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="montant" render={({ field }) => (
          <FormItem><FormLabel>Montant (FCFA)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Annuler</Button>
          <Button type="submit" className="flex-1 gradient-primary">Enregistrer</Button>
        </div>
      </form>
    </Form>
  );
}

function VenteForm({ onSubmit, onCancel }: { onSubmit: (v: Omit<Vente, 'id'>) => void; onCancel: () => void }) {
  const { clients } = useClients();
  const { produits, adjustStock } = useStock();
  const { typesPrestations } = usePrestations();
  const [items, setItems] = useState<VenteItem[]>([]);
  const [clientId, setClientId] = useState('');
  const [modePaiement, setModePaiement] = useState<'especes' | 'mobile_money' | 'carte' | 'mixte'>('especes');
  const [itemType, setItemType] = useState<'produit' | 'prestation'>('produit');
  const [selectedRef, setSelectedRef] = useState('');
  const [itemQty, setItemQty] = useState(1);

  const addItem = () => {
    if (!selectedRef) return;
    let nom = '', prixUnitaire = 0;
    if (itemType === 'produit') {
      const p = produits.find(p => p.id === selectedRef);
      if (!p) return;
      nom = p.nom; prixUnitaire = p.prix;
    } else {
      const t = typesPrestations.find(t => t.id === selectedRef);
      if (!t) return;
      nom = t.nom; prixUnitaire = t.prix;
    }
    setItems(prev => [...prev, { type: itemType, referenceId: selectedRef, nom, quantite: itemQty, prixUnitaire, montant: prixUnitaire * itemQty }]);
    setSelectedRef(''); setItemQty(1);
  };

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const total = items.reduce((s, i) => s + i.montant, 0);

  const handleSubmit = () => {
    if (items.length === 0) { toast.error('Ajoutez au moins un article'); return; }
    items.filter(i => i.type === 'produit').forEach(i => adjustStock(i.referenceId, -i.quantite));
    onSubmit({ date: new Date().toISOString().split('T')[0], clientId: clientId || undefined, items, totalMontant: total, modePaiement });
  };

  const formatFCFA = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Cliente (optionnel)</label>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger><SelectValue placeholder="Sélectionner une cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucune</SelectItem>
            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="p-4 space-y-3">
        <p className="font-medium text-sm">Ajouter un article</p>
        <div className="flex gap-2">
          <Select value={itemType} onValueChange={(v) => { setItemType(v as 'produit' | 'prestation'); setSelectedRef(''); }}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="produit">Produit</SelectItem>
              <SelectItem value="prestation">Prestation</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedRef} onValueChange={setSelectedRef}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Choisir..." /></SelectTrigger>
            <SelectContent>
              {itemType === 'produit'
                ? produits.map(p => <SelectItem key={p.id} value={p.id}>{p.nom} ({formatFCFA(p.prix)})</SelectItem>)
                : typesPrestations.map(t => <SelectItem key={t.id} value={t.id}>{t.nom} ({formatFCFA(t.prix)})</SelectItem>)
              }
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Input type="number" value={itemQty} onChange={e => setItemQty(Number(e.target.value))} min={1} className="w-20" placeholder="Qté" />
          <Button type="button" onClick={addItem} variant="outline" className="flex-1">Ajouter</Button>
        </div>
      </Card>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between bg-muted/50 rounded-lg p-2 text-sm">
              <div>
                <span className="font-medium">{item.nom}</span>
                <span className="text-muted-foreground ml-2">x{item.quantite}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{formatFCFA(item.montant)}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(idx)}>×</Button>
              </div>
            </div>
          ))}
          <div className="text-right font-bold text-lg">Total: {formatFCFA(total)}</div>
        </div>
      )}

      <div>
        <label className="text-sm font-medium">Mode de paiement</label>
        <Select value={modePaiement} onValueChange={(v) => setModePaiement(v as typeof modePaiement)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(modePaiementLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Annuler</Button>
        <Button type="button" onClick={handleSubmit} className="flex-1 gradient-primary">Enregistrer la vente</Button>
      </div>
    </div>
  );
}

function exportFinancesCSV(ventes: Vente[], depenses: Depense[], label: string) {
  let csv = 'Type,Date,Description,Montant\n';
  ventes.forEach(v => { csv += `Vente,${v.date},"${v.items.map(i => i.nom).join(', ')}",${v.totalMontant}\n`; });
  depenses.forEach(d => { csv += `Dépense,${d.date},"${d.description}",-${d.montant}\n`; });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `rapport-caisse-${label.replace(/\s/g, '-')}.csv`;
  a.click(); URL.revokeObjectURL(url);
  toast.success('Export CSV téléchargé');
}

function exportFinancesPDF(ventes: Vente[], depenses: Depense[], label: string) {
  const totalV = ventes.reduce((s, v) => s + v.totalMontant, 0);
  const totalD = depenses.reduce((s, d) => s + d.montant, 0);
  const fmtFCFA = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';
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
  <h2>Ventes</h2>
  <table><tr><th>Date</th><th>Description</th><th>Montant</th></tr>
  ${ventes.map(v => `<tr><td>${v.date}</td><td>${v.items.map(i => i.nom).join(', ')}</td><td class="positive">${fmtFCFA(v.totalMontant)}</td></tr>`).join('')}
  </table><p class="total positive">Total ventes: ${fmtFCFA(totalV)}</p>
  <h2>Dépenses</h2>
  <table><tr><th>Date</th><th>Description</th><th>Montant</th></tr>
  ${depenses.map(d => `<tr><td>${d.date}</td><td>${d.description}</td><td class="negative">${fmtFCFA(d.montant)}</td></tr>`).join('')}
  </table><p class="total negative">Total dépenses: ${fmtFCFA(totalD)}</p>
  <hr><p class="total">Solde: <span class="${totalV - totalD >= 0 ? 'positive' : 'negative'}">${fmtFCFA(totalV - totalD)}</span></p>
  </body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

export default function Finances() {
  const { ventes, depenses, addVente, addDepense, deleteVente, deleteDepense, stats } = useFinances();
  const { clients } = useClients();
  const { t } = useLanguage();
  const { hasExport, hasProfitEstimation, getUpgradePlan, plan, analyticsLevel } = useSubscriptionPlan();
  const { language } = useLanguage();
  const [showVenteForm, setShowVenteForm] = useState(false);
  const [showDepenseForm, setShowDepenseForm] = useState(false);
  const [invoiceVente, setInvoiceVente] = useState<Vente | null>(null);

  const formatFCFA = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';
  const getClientName = (id?: string) => id ? clients.find(c => c.id === id)?.nom || 'Client inconnu' : 'Sans client';

  const handleAddVente = (vente: Omit<Vente, 'id'>) => {
    const newVente = addVente(vente);
    toast.success('Vente enregistrée !');
    setShowVenteForm(false);
    // Auto-show invoice
    setInvoiceVente(newVente);
  };

  const handleAddDepense = (data: z.infer<typeof depenseSchema>) => {
    addDepense({ date: data.date, categorie: data.categorie, description: data.description, montant: data.montant });
    toast.success('Dépense enregistrée !');
    setShowDepenseForm(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t('finances.title')}</h1>
          <p className="text-muted-foreground">{t('finances.subtitle')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {hasExport && (
            <Button onClick={() => exportFinancesCSV(ventes, depenses, 'complet')} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
          )}
          <Button onClick={() => setShowVenteForm(true)} className="gradient-primary"><ShoppingCart className="h-4 w-4 mr-2" />{t('finances.newSale')}</Button>
          <Button onClick={() => setShowDepenseForm(true)} variant="outline"><Receipt className="h-4 w-4 mr-2" />{t('finances.expense')}</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Revenus mois</p><p className="text-lg font-bold">{formatFCFA(stats.totalRevenus)}</p></div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center"><TrendingDown className="h-5 w-5 text-destructive" /></div>
            <div><p className="text-sm text-muted-foreground">Dépenses mois</p><p className="text-lg font-bold">{formatFCFA(stats.totalDepenses)}</p></div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: stats.benefice >= 0 ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--destructive) / 0.1)' }}>
              <DollarSign className="h-5 w-5" style={{ color: stats.benefice >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }} />
            </div>
            <div><p className="text-sm text-muted-foreground">Bénéfice</p><p className={cn('text-lg font-bold', stats.benefice < 0 && 'text-destructive')}>{formatFCFA(stats.benefice)}</p></div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center"><Wallet className="h-5 w-5 text-accent" /></div>
            <div><p className="text-sm text-muted-foreground">Nb ventes</p><p className="text-lg font-bold">{stats.nombreVentes}</p></div>
          </CardContent>
        </Card>
      </div>

      {!hasExport && (
        <UpgradePrompt feature={language === 'fr' ? 'Export des données (Excel / CSV)' : 'Data export (Excel / CSV)'} currentPlan={plan.name} requiredPlan={getUpgradePlan()} type="banner" />
      )}
      {!hasProfitEstimation && (
        <UpgradePrompt feature={language === 'fr' ? 'Estimation détaillée des bénéfices' : 'Detailed profit estimation'} currentPlan={plan.name} requiredPlan={getUpgradePlan()} type="banner" />
      )}

      {/* Revenue breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="card-shadow">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Répartition revenus</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center"><span className="text-sm">Prestations</span><span className="font-semibold">{formatFCFA(stats.revenusPrestations)}</span></div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${stats.totalRevenus ? (stats.revenusPrestations / stats.totalRevenus * 100) : 0}%` }} />
            </div>
            <div className="flex justify-between items-center"><span className="text-sm">Produits</span><span className="font-semibold">{formatFCFA(stats.revenusProduits)}</span></div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: `${stats.totalRevenus ? (stats.revenusProduits / stats.totalRevenus * 100) : 0}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Par mode de paiement</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats.parModePaiement).map(([mode, montant]) => (
              <div key={mode} className="flex justify-between items-center">
                <Badge variant="secondary">{modePaiementLabels[mode] || mode}</Badge>
                <span className="font-semibold">{formatFCFA(montant)}</span>
              </div>
            ))}
            {Object.keys(stats.parModePaiement).length === 0 && <p className="text-sm text-muted-foreground">Aucune vente ce mois</p>}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ventes">
        <TabsList>
          <TabsTrigger value="ventes">Ventes</TabsTrigger>
          <TabsTrigger value="depenses">Dépenses</TabsTrigger>
          <TabsTrigger value="caisse">📊 Rapport de caisse</TabsTrigger>
        </TabsList>

        <TabsContent value="ventes">
          <Card className="card-shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Articles</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Facture</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventes.sort((a, b) => b.date.localeCompare(a.date)).map(v => (
                  <TableRow key={v.id}>
                    <TableCell>{new Date(v.date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{getClientName(v.clientId)}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{v.items.map(i => i.nom).join(', ')}</TableCell>
                    <TableCell><Badge variant="secondary">{modePaiementLabels[v.modePaiement]}</Badge></TableCell>
                    <TableCell className="text-right font-semibold">{formatFCFA(v.totalMontant)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setInvoiceVente(v)}>
                        <FileText className="h-4 w-4 text-primary" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="depenses">
          <Card className="card-shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {depenses.sort((a, b) => b.date.localeCompare(a.date)).map(d => (
                  <TableRow key={d.id}>
                    <TableCell>{new Date(d.date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell><Badge variant="secondary">{d.categorie}</Badge></TableCell>
                    <TableCell>{d.description}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">{formatFCFA(d.montant)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="caisse">
          <GlobalCashReport
            ventes={ventes}
            depenses={depenses}
            hasExport={hasExport}
            onExportCSV={({ ventes, depenses, label }) => exportFinancesCSV(ventes, depenses, label)}
            onExportPDF={({ ventes, depenses, label }) => exportFinancesPDF(ventes, depenses, label)}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={showVenteForm} onOpenChange={setShowVenteForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nouvelle vente</DialogTitle></DialogHeader>
          <VenteForm onSubmit={handleAddVente} onCancel={() => setShowVenteForm(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={showDepenseForm} onOpenChange={setShowDepenseForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouvelle dépense</DialogTitle></DialogHeader>
          <DepenseForm onSubmit={handleAddDepense} onCancel={() => setShowDepenseForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Invoice dialog */}
      {invoiceVente && (
        <InvoiceGenerator
          vente={invoiceVente}
          isOpen={!!invoiceVente}
          onClose={() => setInvoiceVente(null)}
        />
      )}
    </div>
  );
}
