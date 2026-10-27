import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/hooks/useTranslations';
import { usePrestations } from '@/hooks/usePrestations';
import { toast } from '@/hooks/use-toast';
import {
  POPULAR_SERVICE_TEMPLATES,
  STARTER_PACKS,
  PopularServiceTemplate,
  StarterPack,
} from '@/lib/popular-service-templates';
import {
  Sparkles,
  Search,
  Plus,
  Sliders,
  Check,
  CheckCircle2,
  Clock,
  Scissors,
  Layers,
  Flame,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PopularTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomizeTemplate: (template: {
    nom: string;
    prix: number;
    description: string;
    categorie: string;
    imageUrl: string;
  }) => void;
}

export function PopularTemplatesModal({
  isOpen,
  onClose,
  onCustomizeTemplate,
}: PopularTemplatesModalProps) {
  const { language, t } = useLanguage();
  const { formatCurrency } = useTranslations();
  const isMobile = useIsMobile();
  const { typesPrestations, addTypePrestation } = usePrestations();

  const isEn = language === 'en';
  const langKey = isEn ? 'en' : 'fr';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'individual' | 'packs'>('individual');
  const [addingTemplateId, setAddingTemplateId] = useState<string | null>(null);
  const [importingPackId, setImportingPackId] = useState<string | null>(null);

  // Existing names in salon catalog for fast duplicate detection
  const existingNamesSet = useMemo(() => {
    return new Set(
      typesPrestations.map((tp) => (tp.nom || '').trim().toLowerCase())
    );
  }, [typesPrestations]);

  // Categories list derived from templates
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    POPULAR_SERVICE_TEMPLATES.forEach((tpl) => {
      set.add(tpl.categorie[langKey]);
    });
    return Array.from(set);
  }, [langKey]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return POPULAR_SERVICE_TEMPLATES.filter((tpl) => {
      const name = tpl.nom[langKey].toLowerCase();
      const desc = tpl.description[langKey].toLowerCase();
      const cat = tpl.categorie[langKey].toLowerCase();

      const matchesCat =
        selectedCategory === 'all' || tpl.categorie[langKey] === selectedCategory;
      const matchesSearch = !q || name.includes(q) || desc.includes(q) || cat.includes(q);

      return matchesCat && matchesSearch;
    });
  }, [searchQuery, selectedCategory, langKey]);

  // Handle adding a template directly
  const handleAddDirect = async (tpl: PopularServiceTemplate) => {
    setAddingTemplateId(tpl.id);
    try {
      const payload = {
        nom: tpl.nom[langKey],
        prix: tpl.prix,
        description: tpl.description[langKey],
        categorie: tpl.categorie[langKey],
        imageUrl: tpl.imageUrl || tpl.fallbackImage,
      };

      await addTypePrestation(payload);

      toast({
        title: isEn ? 'Service added to catalog!' : 'Prestation ajoutée au catalogue !',
        description: `${tpl.nom[langKey]} (${formatCurrency(tpl.prix)})`,
      });
    } catch (err: any) {
      toast({
        title: isEn ? 'Failed to add service' : "Erreur lors de l'ajout",
        description: err.message || (isEn ? 'Please try again' : 'Veuillez réessayer'),
        variant: 'destructive',
      });
    } finally {
      setAddingTemplateId(null);
    }
  };

  // Handle opening customize form
  const handleCustomize = (tpl: PopularServiceTemplate) => {
    onCustomizeTemplate({
      nom: tpl.nom[langKey],
      prix: tpl.prix,
      description: tpl.description[langKey],
      categorie: tpl.categorie[langKey],
      imageUrl: tpl.imageUrl || tpl.fallbackImage,
    });
    onClose();
  };

  // Handle importing an entire starter pack
  const handleImportPack = async (pack: StarterPack) => {
    setImportingPackId(pack.id);
    try {
      const templatesToImport = POPULAR_SERVICE_TEMPLATES.filter((t) =>
        pack.templateIds.includes(t.id)
      );

      let addedCount = 0;
      for (const tpl of templatesToImport) {
        // Skip if already in catalog
        const nameKey = tpl.nom[langKey].trim().toLowerCase();
        if (!existingNamesSet.has(nameKey)) {
          await addTypePrestation({
            nom: tpl.nom[langKey],
            prix: tpl.prix,
            description: tpl.description[langKey],
            categorie: tpl.categorie[langKey],
            imageUrl: tpl.imageUrl || tpl.fallbackImage,
          });
          addedCount++;
        }
      }

      toast({
        title: isEn ? 'Starter pack imported!' : 'Pack importé avec succès !',
        description: isEn
          ? `${addedCount} new services added to your salon menu.`
          : `${addedCount} nouvelle(s) prestation(s) ajoutée(s) à votre catalogue.`,
      });
    } catch (err: any) {
      toast({
        title: isEn ? 'Import error' : "Erreur d'importation",
        description: err.message || (isEn ? 'Could not import pack' : 'Impossible d’importer le pack'),
        variant: 'destructive',
      });
    } finally {
      setImportingPackId(null);
    }
  };

  // Dialog Content Body
  const contentBody = (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Luxury Gradient Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 relative overflow-hidden shrink-0 border-b border-white/10">
        {/* Mobile pull indicator */}
        <div className="sm:hidden mx-auto -mt-1 mb-2.5 h-1.5 w-12 rounded-full bg-white/30 shrink-0" />

        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-44 h-44 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3.5 sm:gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-300 text-[11px] font-bold shadow-xs">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>{isEn ? 'Ready-to-Use Menu' : 'Catalogue Prêt à l’Emploi'}</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 leading-tight">
                <span>{isEn ? 'Popular Hairstyles & Services' : 'Modèles & Coiffures Populaires'}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed hidden sm:block">
                {isEn
                  ? 'Kickstart your salon catalog in 1 click with top trending African & modern hairstyles, or customize prices to your salon.'
                  : 'Configurez votre salon en 1 clic grâce aux coiffures et soins les plus demandés (Tresses, Perruques, Dégradés, Soins), ou personnalisez directement les tarifs.'}
              </p>
            </div>

            {/* Close button in banner */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full h-8 w-8 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 border border-white/15 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick tab switcher - full width on mobile */}
          <div className="grid grid-cols-2 w-full sm:w-auto self-start bg-white/10 p-1 rounded-2xl border border-white/15 backdrop-blur-md shrink-0 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('individual')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5',
                activeTab === 'individual'
                  ? 'bg-white text-slate-950 shadow-md scale-[1.01]'
                  : 'text-slate-300 hover:text-white'
              )}
            >
              <Scissors className="h-3.5 w-3.5 text-rose-500" />
              <span>{isEn ? 'All Hairstyles' : 'Toutes les Coiffures'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('packs')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5',
                activeTab === 'packs'
                  ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950 font-black shadow-md scale-[1.01]'
                  : 'text-slate-300 hover:text-white'
              )}
            >
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              <span>{isEn ? 'Packs (1-Click)' : 'Packs Clés en Main'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-6 space-y-4 sm:space-y-5 bg-slate-50/70 dark:bg-slate-950/70">
        {/* If Starter Packs Tab */}
        {activeTab === 'packs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Flame className="h-4 w-4 text-rose-500" />
                  <span>{isEn ? 'One-Click Starter Packs' : 'Packs Thématiques en 1 Clic'}</span>
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  {isEn
                    ? 'Import an entire specialized menu into your salon in a single click.'
                    : 'Importez tout un univers spécialisé dans votre salon en une seule action.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STARTER_PACKS.map((pack) => {
                const isImporting = importingPackId === pack.id;
                const packTemplates = POPULAR_SERVICE_TEMPLATES.filter((t) =>
                  pack.templateIds.includes(t.id)
                );
                const allAdded = packTemplates.every((t) =>
                  existingNamesSet.has(t.nom[langKey].trim().toLowerCase())
                );

                return (
                  <div
                    key={pack.id}
                    className="relative group rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
                  >
                    <div
                      className={cn(
                        'absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r',
                        pack.gradient
                      )}
                    />

                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge
                          variant="outline"
                          className="font-extrabold text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          {pack.badge[langKey]}
                        </Badge>
                        <span className="text-[11px] font-bold text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full">
                          {pack.categorieLabel[langKey]}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                          {pack.nom[langKey]}
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">
                          {pack.description[langKey]}
                        </p>
                      </div>

                      {/* Preview mini badges of included services with Pinterest thumbnail photos */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {packTemplates.map((t) => {
                          const alreadyIn = existingNamesSet.has(
                            t.nom[langKey].trim().toLowerCase()
                          );
                          return (
                            <span
                              key={t.id}
                              className={cn(
                                'inline-flex items-center gap-1.5 text-[11px] pl-1 pr-2.5 py-1 rounded-xl font-bold border transition-colors shadow-2xs',
                                alreadyIn
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                  : 'bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700'
                              )}
                            >
                              <img
                                src={t.imageUrl}
                                alt=""
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = t.fallbackImage;
                                }}
                                className="w-4 h-4 rounded-full object-cover shrink-0"
                              />
                              {alreadyIn && <Check className="h-3 w-3 text-emerald-500" />}
                              <span>{t.nom[langKey]}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-muted-foreground">
                        {packTemplates.length} {isEn ? 'services included' : 'services inclus'}
                      </span>

                      <Button
                        onClick={() => handleImportPack(pack)}
                        disabled={isImporting || allAdded}
                        size="sm"
                        className={cn(
                          'rounded-2xl h-10 px-4 font-black text-xs transition-all shadow-md active:scale-[0.98]',
                          allAdded
                            ? 'bg-emerald-600 hover:bg-emerald-600 text-white cursor-default'
                            : 'bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white shadow-rose-600/25'
                        )}
                      >
                        {isImporting ? (
                          <span className="flex items-center gap-1.5">
                            <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>{isEn ? 'Importing...' : 'Importation...'}</span>
                          </span>
                        ) : allAdded ? (
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{isEn ? 'Already Added' : 'Déjà au catalogue'}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Plus className="h-4 w-4" />
                            <span>{isEn ? 'Import Pack (1-Click)' : 'Importer le Pack'}</span>
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Individual Hairstyles & Services Tab */}
        {activeTab === 'individual' && (
          <div className="space-y-4">
            {/* Search & Category Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isEn
                      ? 'Search hairstyle (e.g. Knotless, Fade, Pop Smoke, French Curls)...'
                      : 'Rechercher (ex: Knotless, Dégradé, Pop Smoke, French Curls)...'
                  }
                  className="pl-10 h-10 sm:h-11 rounded-2xl bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm font-medium shadow-2xs focus-visible:ring-rose-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Category Pills Strip */}
              <div className="-mx-3.5 px-3.5 sm:mx-0 sm:px-0 flex gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={cn(
                    'px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl text-xs font-black transition-all shrink-0 border',
                    selectedCategory === 'all'
                      ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-transparent shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  )}
                >
                  {isEn ? 'All' : 'Toutes'} ({POPULAR_SERVICE_TEMPLATES.length})
                </button>
                {categoriesList.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        'px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl text-xs font-black transition-all shrink-0 border',
                        isSelected
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/25'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      )}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Templates Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTemplates.map((tpl) => {
                const isAdding = addingTemplateId === tpl.id;
                const isAlreadyInCatalog = existingNamesSet.has(
                  tpl.nom[langKey].trim().toLowerCase()
                );

                return (
                  <div
                    key={tpl.id}
                    className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Visual Hairstyle Image Banner */}
                    <div className="relative h-44 sm:h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={tpl.imageUrl}
                        alt={tpl.nom[langKey]}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = tpl.fallbackImage;
                        }}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                      {/* Badges on image */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <Badge
                          variant="outline"
                          className="bg-white/20 backdrop-blur-md text-white border-white/20 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-xs"
                        >
                          {tpl.categorie[langKey]}
                        </Badge>

                        {tpl.badge && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm border-0">
                            {tpl.badge[langKey]}
                          </Badge>
                        )}
                      </div>

                      {/* Price & Duration overlay banner */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <div>
                          <span className="text-lg sm:text-xl font-black text-white tracking-tight drop-shadow-md">
                            {formatCurrency(tpl.prix)}
                          </span>
                          <span className="text-[10px] text-slate-300 font-semibold block">
                            {isEn ? 'suggested price' : 'prix indicatif'}
                          </span>
                        </div>

                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-white/90 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
                          <Clock className="h-3 w-3 text-amber-400" />
                          <span>{tpl.duree} min</span>
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-1.5">
                          <h4 className="font-black text-slate-900 dark:text-white text-sm sm:text-base leading-snug line-clamp-1">
                            {tpl.nom[langKey]}
                          </h4>
                          {isAlreadyInCatalog && (
                            <span
                              title={isEn ? 'Already in catalog' : 'Déjà dans votre catalogue'}
                              className="inline-flex items-center text-emerald-500 shrink-0"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed font-medium">
                          {tpl.description[langKey]}
                        </p>
                      </div>

                      {/* Action Buttons: Fast Add or Customize */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCustomize(tpl)}
                          className="rounded-xl h-9 text-xs font-bold border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        >
                          <Sliders className="h-3.5 w-3.5 mr-1 text-primary" />
                          <span>{isEn ? 'Customize' : 'Ajuster'}</span>
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          disabled={isAdding}
                          onClick={() => handleAddDirect(tpl)}
                          className={cn(
                            'rounded-xl h-9 text-xs font-black shadow-xs transition-all active:scale-[0.98]',
                            isAlreadyInCatalog
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-emerald-600 hover:text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          )}
                        >
                          {isAdding ? (
                            <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : isAlreadyInCatalog ? (
                            <span className="flex items-center gap-1">
                              <Plus className="h-3.5 w-3.5" />
                              <span>{isEn ? 'Add again' : '+ Rajouter'}</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Plus className="h-3.5 w-3.5" />
                              <span>{isEn ? '1-Click Add' : '+ Ajouter'}</span>
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
                <Scissors className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {isEn ? 'No templates match your search' : 'Aucun modèle ne correspond à votre recherche'}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {isEn ? 'Try another keyword or category.' : 'Essayez un autre mot-clé ou catégorie.'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-4 rounded-xl text-xs font-bold"
                >
                  {isEn ? 'Reset filters' : 'Réinitialiser les filtres'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="bg-white dark:bg-slate-900 px-4 sm:px-5 py-3 pb-safe border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-muted-foreground shrink-0">
        <span className="flex items-center gap-1.5 font-semibold text-[11px] sm:text-xs">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="line-clamp-1">
            {isEn
              ? 'Images and descriptions automatically adapt to your chosen prices.'
              : 'Les photos et descriptions s’intègrent directement à votre catalogue et réservation.'}
          </span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="rounded-xl font-bold text-xs h-8 px-3 shrink-0 ml-2"
        >
          {t('common.close') || 'Fermer'}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="fixed inset-x-0 bottom-0 top-auto sm:top-[50%] sm:left-[50%] sm:-translate-x-1/2 sm:-translate-y-1/2 translate-x-0 translate-y-0 w-full sm:w-[96vw] max-w-full sm:max-w-5xl h-[94dvh] sm:h-[88vh] max-h-[94dvh] sm:max-h-[88vh] rounded-t-[28px] sm:rounded-[28px] rounded-b-none sm:rounded-b-[28px] p-0 overflow-hidden border border-border/60 shadow-2xl bg-background flex flex-col focus:outline-none z-50">
        <DialogHeader className="sr-only">
          <DialogTitle>Popular Hairstyles & Services</DialogTitle>
          <DialogDescription>Template catalog</DialogDescription>
        </DialogHeader>
        {contentBody}
      </DialogContent>
    </Dialog>
  );
}
