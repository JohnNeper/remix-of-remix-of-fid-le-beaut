import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  AlertCircle,
  Package,
  PackageX,
  ArrowRight,
  CheckCircle2,
  PlusCircle,
  Sparkles,
  TrendingDown,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Produit } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStock } from '@/hooks/useStock';
import { useFinances } from '@/hooks/useFinances';
import { RestockModal } from '@/components/stock/RestockModal';
import { toast } from 'sonner';

interface StockAlertsProps {
  produits: Produit[];
}

export function StockAlerts({ produits }: StockAlertsProps) {
  const { t } = useLanguage();
  const { adjustStock } = useStock();
  const { addDepense } = useFinances();

  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'out' | 'low'>('all');

  const outOfStockCount = useMemo(() => {
    return produits.filter(p => p.quantite === 0).length;
  }, [produits]);

  const lowStockCount = useMemo(() => {
    return produits.filter(p => p.quantite > 0 && p.quantite <= p.seuilAlerte).length;
  }, [produits]);

  const filteredProduits = useMemo(() => {
    if (filter === 'out') {
      return produits.filter(p => p.quantite === 0);
    }
    if (filter === 'low') {
      return produits.filter(p => p.quantite > 0 && p.quantite <= p.seuilAlerte);
    }
    return produits;
  }, [produits, filter]);

  const handleOpenRestock = (p: Produit, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProduit(p);
    setIsRestockOpen(true);
  };

  const handleRestock = async (produitId: string, addedQty: number, createExpense?: boolean) => {
    if (!selectedProduit) return;
    setLoading(true);
    try {
      await adjustStock(produitId, addedQty);

      if (createExpense && selectedProduit.prixAchat > 0) {
        const montantTotal = addedQty * selectedProduit.prixAchat;
        addDepense({
          date: new Date().toISOString().split('T')[0],
          categorie: 'Stock',
          description: `Réapprovisionnement: ${selectedProduit.nom} (+${addedQty} ${selectedProduit.unite})`,
          montant: montantTotal,
        });
      }

      toast.success(`Stock réapprovisionné (+${addedQty} ${selectedProduit.unite})`);
    } catch (err: any) {
      console.error('Erreur réapprovisionnement:', err);
      toast.error('Erreur lors du réapprovisionnement');
    } finally {
      setLoading(false);
    }
  };

  const hasCriticalAlerts = outOfStockCount > 0;

  return (
    <>
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden bg-white dark:bg-slate-900">
        {/* Header with Visual Status Glow */}
        <CardHeader className="pb-3 pt-4 px-4 sm:px-5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50 dark:from-slate-900/50 dark:via-slate-900 dark:to-slate-900/50">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-colors ${
                  produits.length === 0
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : hasCriticalAlerts
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 animate-pulse'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                }`}
              >
                {produits.length === 0 ? (
                  <CheckCircle2 className="h-4.5 w-4.5" />
                ) : hasCriticalAlerts ? (
                  <PackageX className="h-4.5 w-4.5" />
                ) : (
                  <AlertTriangle className="h-4.5 w-4.5" />
                )}
              </div>

              <div>
                <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{t('stockAlerts.title') || "Alertes Stock"}</span>
                  {produits.length > 0 && (
                    <span className="flex h-2 w-2 relative">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasCriticalAlerts ? 'bg-rose-400' : 'bg-amber-400'}`} />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${hasCriticalAlerts ? 'bg-rose-500' : 'bg-amber-500'}`} />
                    </span>
                  )}
                </CardTitle>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {produits.length === 0
                    ? t('stockAlerts.allOkDesc') || "Inventaire sous contrôle"
                    : `${produits.length} produit${produits.length > 1 ? 's' : ''} nécessitant attention`}
                </p>
              </div>
            </div>

            <Link to="/stock">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:bg-primary/10 rounded-xl px-2.5 transition-all group"
              >
                <span>{t('stockAlerts.manageStock') || "Gérer"}</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>

          {/* Quick Counter Badges & Filters (when there are products) */}
          {produits.length > 0 && (
            <div className="flex items-center gap-1.5 pt-2 flex-wrap">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  filter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                }`}
              >
                <span>Tous</span>
                <span className="opacity-80">({produits.length})</span>
              </button>

              {outOfStockCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilter('out')}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                    filter === 'out'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>Ruptures</span>
                  <span>({outOfStockCount})</span>
                </button>
              )}

              {lowStockCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilter('low')}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                    filter === 'low'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span>Seuils bas</span>
                  <span>({lowStockCount})</span>
                </button>
              )}
            </div>
          )}
        </CardHeader>

        {/* Card Content */}
        <CardContent className="p-3 sm:p-4 space-y-2.5">
          {produits.length > 0 ? (
            <div className="space-y-2.5">
              {filteredProduits.slice(0, 5).map(p => {
                const isOut = p.quantite === 0;
                // Calculate stock percentage relative to threshold (0 to 100%)
                const threshold = Math.max(1, p.seuilAlerte);
                const percent = Math.min(100, Math.round((p.quantite / threshold) * 100));

                return (
                  <div
                    key={p.id}
                    onClick={(e) => handleOpenRestock(p, e)}
                    className={`group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isOut
                        ? 'bg-rose-500/[0.04] dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40 hover:border-rose-400 hover:shadow-xs'
                        : 'bg-amber-500/[0.04] dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 hover:border-amber-400 hover:shadow-xs'
                    }`}
                  >
                    {/* Top Row: Icon + Title & Category + Status Badge */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-xs ${
                            isOut
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {isOut ? (
                            <PackageX className="h-4.5 w-4.5" />
                          ) : (
                            <Package className="h-4.5 w-4.5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-primary transition-colors">
                              {p.nom}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.2 rounded-md">
                              {p.categorie || 'Général'}
                            </span>
                            {p.unite && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                • {p.unite}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                          isOut
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {isOut ? (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-2.5 w-2.5" />
                            {t('stockAlerts.outOfStock') || 'Rupture'}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <TrendingDown className="h-2.5 w-2.5" />
                            {t('stockAlerts.lowStock') || 'Faible'}
                          </span>
                        )}
                      </Badge>
                    </div>

                    {/* Bottom Row: Stock Progress Gauge + Count + Quick Restock CTA */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-3">
                      {/* Gauge & Numbers */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className={isOut ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-slate-700 dark:text-slate-300'}>
                            {p.quantite} <span className="font-medium text-slate-400">/ {p.seuilAlerte} {p.unite || 'u.'}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                            Seuil min: {p.seuilAlerte}
                          </span>
                        </div>

                        {/* Visual Bar */}
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isOut
                                ? 'w-0 bg-rose-500'
                                : percent <= 30
                                ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                                : 'bg-gradient-to-r from-amber-500 to-amber-400'
                            }`}
                            style={{ width: `${Math.max(6, percent)}%` }}
                          />
                        </div>
                      </div>

                      {/* Quick Restock Button */}
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => handleOpenRestock(p, e)}
                        className={`h-7 px-2.5 text-[11px] font-bold rounded-lg shrink-0 shadow-2xs transition-all ${
                          isOut
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        <PlusCircle className="h-3.5 w-3.5 mr-1 shrink-0" />
                        <span>Réappro.</span>
                      </Button>
                    </div>
                  </div>
                );
              })}

              {filteredProduits.length === 0 && (
                <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
                  Aucun produit dans cette catégorie.
                </div>
              )}

              {produits.length > 5 && (
                <Link to="/stock" className="block pt-1">
                  <div className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-bold flex items-center justify-center gap-1.5">
                      <span>+{(produits.length - 5)} autres produits sous le seuil</span>
                      <ArrowRight className="h-3 w-3 text-primary" />
                    </p>
                  </div>
                </Link>
              )}
            </div>
          ) : (
            /* Joyful, Modern Empty State */
            <div className="text-center py-7 px-3 bg-gradient-to-b from-emerald-500/[0.04] to-transparent rounded-xl border border-emerald-500/10">
              <div className="relative inline-flex items-center justify-center mb-3">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs border border-emerald-500/25">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <Sparkles className="h-4 w-4 text-emerald-500 absolute -top-1 -right-1 animate-bounce" />
              </div>

              <h4 className="text-xs sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                {t('stockAlerts.stockOk') || "Stock 100% en ordre"}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[240px] mx-auto font-medium">
                {t('stockAlerts.allOkDesc') || "Tous vos produits sont au-dessus de leur seuil de sécurité."}
              </p>

              <Link to="/stock" className="inline-block mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10 rounded-lg px-2.5"
                >
                  <Layers className="h-3 w-3 mr-1" />
                  <span>Consulter l'inventaire</span>
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <RestockModal
        produit={selectedProduit}
        isOpen={isRestockOpen}
        onClose={() => setIsRestockOpen(false)}
        onRestock={handleRestock}
        loading={loading}
      />
    </>
  );
}
