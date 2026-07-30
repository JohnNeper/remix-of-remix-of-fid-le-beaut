import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, ArrowRight, CheckCircle2, PlusCircle } from 'lucide-react';
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

  return (
    <>
      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden bg-white dark:bg-slate-900 transition-all">
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 sm:px-5">
          <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
            <span>{t('stockAlerts.title') || "Alertes stock"}</span>
            {produits.length > 0 && (
              <Badge variant="outline" className="text-[11px] font-bold text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 px-2 py-0.5">
                {produits.length}
              </Badge>
            )}
          </CardTitle>

          <Link to="/stock">
            <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 px-2">
              <span>{t('stockAlerts.manageStock') || "Gérer Stock"}</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="px-4 sm:px-5 pb-4">
          {produits.length > 0 ? (
            <div className="space-y-3">
              {produits.slice(0, 5).map(p => {
                const isOut = p.quantite === 0;
                return (
                  <div
                    key={p.id}
                    onClick={(e) => handleOpenRestock(p, e)}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer hover:shadow-sm transition-all group ${
                      isOut
                        ? 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 hover:border-rose-400'
                        : 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                        isOut ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      }`}>
                        <Package className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{p.nom}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{p.categorie}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={`text-[10px] font-bold ${
                        isOut
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      }`}>
                        {isOut ? (t('stockAlerts.outOfStock') || 'Rupture') : `${p.quantite}/${p.seuilAlerte}`}
                      </Badge>

                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-2.5 text-[11px] font-bold rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 transition-colors"
                        onClick={(e) => handleOpenRestock(p, e)}
                      >
                        <PlusCircle className="h-3.5 w-3.5 mr-1" />
                        Réappro.
                      </Button>
                    </div>
                  </div>
                );
              })}

              {produits.length > 5 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium pt-1">
                  +{(produits.length - 5)} {t('dashboard.othersProducts') || "autres produits"}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-emerald-500/80 mx-auto mb-2" />
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {t('stockAlerts.stockOk') || "✓ Stock en ordre"}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {t('stockAlerts.allOkDesc') || "Tous les produits sont au-dessus du seuil"}
              </p>
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
