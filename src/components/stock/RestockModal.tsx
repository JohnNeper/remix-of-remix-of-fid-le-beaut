import React, { useState } from 'react';
import { Produit } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, TrendingUp, AlertTriangle, ArrowRight, ShieldCheck, Banknote } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/hooks/useTranslations';
import { cn } from '@/lib/utils';

interface RestockModalProps {
  produit: Produit | null;
  isOpen: boolean;
  onClose: () => void;
  onRestock: (produitId: string, addedQty: number, createExpense?: boolean) => void;
  loading?: boolean;
}

export function RestockModal({ produit, isOpen, onClose, onRestock, loading = false }: RestockModalProps) {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const { formatCurrency } = useTranslations();

  const [addedQty, setAddedQty] = useState<number>(10);
  const [recordExpense, setRecordExpense] = useState<boolean>(false);

  if (!produit) return null;

  const currentQty = produit.quantite;
  const newQty = Math.max(0, currentQty + (addedQty || 0));
  const isNowOk = newQty > produit.seuilAlerte;
  const totalCost = (addedQty || 0) * (produit.prixAchat || 0);

  const presets = [5, 10, 20, 50];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addedQty <= 0) return;
    onRestock(produit.id, addedQty, recordExpense);
    onClose();
  };

  const ModalWrapper = isMobile ? Drawer : Dialog;
  const ModalContent = isMobile ? DrawerContent : DialogContent;
  const ModalHeader = isMobile ? DrawerHeader : DialogHeader;
  const ModalTitle = isMobile ? DrawerTitle : DialogTitle;
  const ModalDescription = isMobile ? DrawerDescription : DialogDescription;
  const ModalFooter = isMobile ? DrawerFooter : DialogFooter;

  return (
    <ModalWrapper open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className={cn(
        isMobile 
          ? "p-0 bg-background border-none rounded-t-[30px] overflow-hidden max-h-[92vh] outline-none" 
          : "max-w-md rounded-[24px] p-0 overflow-hidden border-none shadow-2xl"
      )}>
        <div className="bg-gradient-to-br from-amber-500/10 via-primary/5 to-transparent p-6 border-b border-border/50">
          <ModalHeader className="p-0 text-left">
            <ModalTitle className="text-xl font-extrabold flex items-center gap-2 text-foreground">
              <Package className="h-5 w-5 text-amber-500" />
              <span>Réapprovisionner le stock</span>
            </ModalTitle>
            <ModalDescription className="text-xs font-semibold text-muted-foreground mt-1">
              Ajustement du stock pour <span className="font-bold text-foreground">{produit.nom}</span>
            </ModalDescription>
          </ModalHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Current vs New stock indicator */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Stock actuel</p>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xl font-black",
                  currentQty <= produit.seuilAlerte ? "text-destructive" : "text-foreground"
                )}>
                  {currentQty} {produit.unite}
                </span>
                {currentQty <= produit.seuilAlerte && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    Alerte ({produit.seuilAlerte})
                  </Badge>
                )}
              </div>
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />

            <div className="space-y-1 text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nouveau stock</p>
              <div className="flex items-center justify-end gap-2">
                <span className={cn(
                  "text-xl font-black",
                  isNowOk ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                )}>
                  {newQty} {produit.unite}
                </span>
                {isNowOk && (
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                )}
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Présélections rapides
            </label>
            <div className="grid grid-cols-4 gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={addedQty === preset ? "default" : "outline"}
                  className={cn(
                    "h-11 rounded-xl font-bold transition-all",
                    addedQty === preset ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted"
                  )}
                  onClick={() => setAddedQty(preset)}
                >
                  +{preset}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom quantity input */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Quantité à ajouter ({produit.unite})
            </label>
            <div className="relative">
              <Input
                type="number"
                min="1"
                value={addedQty || ''}
                onChange={(e) => setAddedQty(parseInt(e.target.value) || 0)}
                className="h-12 rounded-xl text-lg font-bold pl-4 pr-12 bg-muted/30 border-muted focus:ring-primary/20"
                placeholder="Ex: 15"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                {produit.unite}
              </div>
            </div>
          </div>

          {/* Cost estimation & expense logging checkbox */}
          {produit.prixAchat > 0 && (
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <Banknote className="h-4 w-4 text-primary" />
                  Coût estimé du réapprovisionnement :
                </span>
                <span className="font-bold text-foreground text-sm">
                  {formatCurrency(totalCost)}
                </span>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-border/40">
                <Checkbox
                  id="recordExpense"
                  checked={recordExpense}
                  onCheckedChange={(checked) => setRecordExpense(!!checked)}
                />
                <label
                  htmlFor="recordExpense"
                  className="text-xs font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none text-foreground"
                >
                  Enregistrer automatiquement cette dépense dans les finances
                </label>
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <ModalFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-12 rounded-xl font-bold flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={addedQty <= 0 || loading}
              className="h-12 rounded-xl font-bold flex-1 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Valider (+{addedQty || 0})
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalWrapper>
  );
}
