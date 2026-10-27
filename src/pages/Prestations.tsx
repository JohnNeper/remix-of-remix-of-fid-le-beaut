import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Scissors, CalendarDays, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { usePrestations } from '@/hooks/usePrestations';
import { useClients } from '@/hooks/useClients';
import { useRendezVous } from '@/hooks/useRendezVous';
import { TypePrestation } from '@/types';
import { TypePrestationForm, TypeFormData } from '@/components/prestations/TypePrestationForm';
import { NouvellePrestation } from '@/components/prestations/NouvellePrestation';
import { CalendrierRendezVous } from '@/components/prestations/CalendrierRendezVous';
import { RendezVousForm } from '@/components/prestations/RendezVousForm';
import { PopularTemplatesModal } from '@/components/prestations/PopularTemplatesModal';
import { getCategoryImage } from '@/lib/category-images';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/hooks/useTranslations';
import { useAuth } from '@/contexts/AuthContext';
import { TourPointer } from '@/components/ui/TourPointer';
import { cn } from '@/lib/utils';

export default function Prestations() {
  const { typesPrestations, prestations, addTypePrestation, updateTypePrestation, deleteTypePrestation, getTypePrestation } = usePrestations();
  const { getClient } = useClients();
  const { t, formatCurrency } = useTranslations();
  const [showAddType, setShowAddType] = useState(false);
  const [editingType, setEditingType] = useState<TypePrestation | null>(null);
  const [customizingTemplate, setCustomizingTemplate] = useState<Partial<TypeFormData> | null>(null);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showNouvellePrestation, setShowNouvellePrestation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategorie, setSelectedCategorie] = useState<string | null>(null);
  const [selectedPrestation, setSelectedPrestation] = useState<string | null>(null);
  const [showAddRdv, setShowAddRdv] = useState(false);
  const isMobile = useIsMobile();

  const { addRendezVous } = useRendezVous();
  const { session } = useAuth();
  const isOwner = session?.userRole === 'owner' || session?.userRole === 'co_owner' || session?.type === 'admin';

  const getCategoryLabel = (cat: string) => {
    if (!cat) return '';
    const key = `services.categories.${cat.toLowerCase()}`;
    const translation = t(key);
    return translation !== key ? translation : cat;
  };

  const handleAddRdv = (data: any) => {
    addRendezVous({
      ...data,
      statut: 'en_attente',
    });
    setShowAddRdv(false);
  };

  const handleAddType = (data: Omit<TypePrestation, 'id'>) => {
    addTypePrestation(data);
    setShowAddType(false);
    setCustomizingTemplate(null);
  };

  const handleEditType = (data: Partial<TypePrestation>) => {
    if (editingType) {
      updateTypePrestation(editingType.id, data);
      setEditingType(null);
    }
  };

  const handleDeleteType = (id: string) => {
    if (confirm(t('services.deleteConfirm'))) {
      deleteTypePrestation(id);
    }
  };

  const categories = [...new Set(typesPrestations.map(t => t.categorie).filter(Boolean))] as string[];

  const filteredTypes = selectedCategorie
    ? typesPrestations.filter(t => t.categorie === selectedCategorie)
    : typesPrestations;

  const recentPrestations = [...prestations]
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const type = getTypePrestation(p.typePrestationId);
      const client = getClient(p.clientId);
      const typeNom = type?.nom?.toLowerCase() || '';
      const clientNom = client?.nom?.toLowerCase() || '';
      const employe = p.employe?.toLowerCase() || '';
      return typeNom.includes(q) || clientNom.includes(q) || employe.includes(q);
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);

  return (
    <div className="p-4 lg:p-6 space-y-6 sm:space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">{t('services.title')}</h1>
          <p className="text-muted-foreground mt-1 font-medium">{typesPrestations.length} {t('services.types')} disponibles</p>
        </div>
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <Button
            onClick={() => setShowTemplatesModal(true)}
            className="rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-600 hover:via-rose-600 hover:to-purple-700 text-white font-extrabold whitespace-nowrap shadow-md shadow-rose-500/20 active:scale-[0.98] transition-all"
          >
            <Sparkles className="h-4 w-4 mr-2 text-amber-200 animate-pulse" />
            <span>{t('services.templatesBtn') || '⚡ Modèles Populaires'}</span>
          </Button>

          <TourPointer stepId="step-3" title="Étape 3 : Créer votre catalogue" description="Ajoutez vos soins, catégories et tarifs">
            <Button onClick={() => setShowAddType(true)} variant="outline" className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              {t('services.newType')}
            </Button>
          </TourPointer>

          <TourPointer stepId="step-4" title="Étape 4 : Enregistrer un service" description="Enregistrez une prestation effectuée pour cumuler les revenus et points">
            <Button onClick={() => setShowNouvellePrestation(true)} className="rounded-xl gradient-primary whitespace-nowrap shadow-md">
              <Scissors className="h-4 w-4 mr-2" />
              {t('services.register')}
            </Button>
          </TourPointer>
        </div>
      </div>

      <Tabs defaultValue="catalogue" className="space-y-6">
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar pb-1">
          <TabsList className="inline-flex w-max sm:w-full sm:grid sm:grid-cols-3 p-1 bg-muted/50 rounded-2xl h-auto">
            <TabsTrigger value="catalogue" className="rounded-xl py-2.5 px-6 font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">{t('services.catalog')}</TabsTrigger>
            <TabsTrigger value="calendrier" className="flex items-center gap-2 rounded-xl py-2.5 px-6 font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <CalendarDays className="h-4 w-4" />
              {t('services.appointments')}
            </TabsTrigger>
            <TabsTrigger value="historique" className="rounded-xl py-2.5 px-6 font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">{t('services.history')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="catalogue" className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
          {/* Trending & Popular Templates Discovery Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/90 via-rose-950/80 to-amber-950/80 border border-rose-500/30 p-5 sm:p-6 text-white shadow-xl shadow-rose-950/20">
            <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-gradient-to-br from-rose-500/20 to-amber-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge className="bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950 font-black text-[10px] tracking-wider uppercase px-2.5 py-0.5 border-none shadow-sm">
                    {t('services.bannerBadge') || 'Nouveau'}
                  </Badge>
                  <span className="text-xs font-bold text-amber-300/90 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {t('services.templatesTitle') || 'Bibliothèque de Coiffures'}
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                  {t('services.bannerTitle') || 'Catalogue Prêt à l’Emploi & Coiffures Tendances'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {t('services.bannerDesc') || 'Ajoutez en 1 clic les coiffures et soins les plus demandés (Knotless, Tissages, Silk Press, Dégradés) avec photos.'}
                </p>
              </div>
              <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
                <Button
                  onClick={() => setShowTemplatesModal(true)}
                  className="w-full md:w-auto rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-black px-5 py-2.5 text-xs sm:text-sm shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4 text-rose-500" />
                  <span>{t('services.browseTemplates') || 'Découvrir les modèles'}</span>
                  <ArrowRight className="h-4 w-4 text-slate-700 ml-0.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Categories Pills */}
          <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 snap-x">
              <button
                onClick={() => setSelectedCategorie(null)}
                className={cn(
                  "snap-start whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border-2",
                  selectedCategorie === null
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105"
                    : "bg-background text-muted-foreground border-transparent hover:border-border hover:bg-muted"
                )}
              >
                {t('services.all')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategorie(cat)}
                  className={cn(
                    "snap-start whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border-2",
                    selectedCategorie === cat
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105"
                      : "bg-background text-muted-foreground border-transparent hover:border-border hover:bg-muted"
                  )}
                >
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredTypes.map((type) => (
              <div key={type.id} className="group relative flex flex-col bg-card rounded-3xl border border-border/40 overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                {/* Image Section */}
                <div className="relative h-48 sm:h-52 overflow-hidden bg-muted">
                  <img
                    src={type.imageUrl || getCategoryImage(type.categorie)}
                    alt={type.nom}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />

                  {type.categorie && (
                    <Badge className="absolute top-4 left-4 bg-white/20 backdrop-blur-md text-white border-none shadow-sm hover:bg-white/30 text-[10px] sm:text-xs uppercase tracking-wider font-bold px-3 py-1">
                      {getCategoryLabel(type.categorie)}
                    </Badge>
                  )}

                  {isOwner && (
                    <div className="absolute top-3 right-3 flex gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-background/90 hover:bg-background text-foreground shadow-sm"
                        onClick={() => setEditingType(type)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-destructive/90 hover:bg-destructive text-white shadow-sm"
                        onClick={() => handleDeleteType(type.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <h3 className="font-black text-white text-xl sm:text-2xl leading-tight text-shadow-sm line-clamp-2 pr-2">{type.nom}</h3>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-col flex-1 p-4 sm:p-5">
                  {type.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-4 leading-relaxed">
                      {type.description}
                    </p>
                  ) : (
                    <div className="flex-1 mb-4" />
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-primary tracking-tight">
                      {formatCurrency(type.prix)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <Button
                      variant="outline"
                      className="rounded-xl h-11 font-bold border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 transition-colors"
                      onClick={() => {
                        setSelectedPrestation(type.id);
                        setShowAddRdv(true);
                      }}
                    >
                      {t('services.book')}
                    </Button>
                    <Button
                      className="rounded-xl h-11 font-bold gradient-primary shadow-md hover:shadow-lg transition-all"
                      onClick={() => {
                        setSelectedPrestation(type.id);
                        setShowNouvellePrestation(true);
                      }}
                    >
                      {t('services.register')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredTypes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
              <div className="h-20 w-20 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 text-rose-500">
                <Scissors className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">{t('services.notFound')}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">{t('services.notFoundHint') || 'Essayez de modifier vos filtres ou ajoutez une nouvelle prestation.'}</p>
              <Button
                onClick={() => setShowTemplatesModal(true)}
                className="rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-600 hover:via-rose-600 hover:to-purple-700 text-white font-extrabold shadow-md active:scale-[0.98] transition-all"
              >
                <Sparkles className="h-4 w-4 mr-2 text-amber-200 animate-pulse" />
                <span>{t('services.browseTemplates') || 'Découvrir les modèles populaires'}</span>
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Calendar */}
        <TabsContent value="calendrier">
          <CalendrierRendezVous />
        </TabsContent>

        {/* History */}
        <TabsContent value="historique" className="space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('services.search') || "Rechercher..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Recent prestations */}
          <Card>
            <CardHeader>
              <CardTitle>{t('services.recentTitle') || 'Prestations récentes'}</CardTitle>
            </CardHeader>
            <CardContent>
              {recentPrestations.length > 0 ? (
                <div className="space-y-3">
                  {recentPrestations.map((prestation) => {
                    const type = getTypePrestation(prestation.typePrestationId);
                    const client = getClient(prestation.clientId);
                    return (
                      <div key={prestation.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={prestation.imageUrls?.[0] || type?.imageUrl || getCategoryImage(type?.categorie)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{type?.nom || t('services.unknown') || 'Prestation inconnue'}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {client?.nom || t('clients.unknownClient') || 'Cliente inconnue'} • {new Date(prestation.date).toLocaleDateString('fr-FR')}
                              {prestation.employe && ` • ${(t('services.byStaff') || 'Coiffé(e) par {name}').replace('{name}', prestation.employe)}`}
                            </p>
                          </div>
                        </div>
                        {isOwner && (
                          <span className="font-semibold text-primary whitespace-nowrap ml-3">
                            {formatCurrency(prestation.montant)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">{t('services.none') || 'Aucune prestation enregistrée'}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isMobile ? (
        <>
          <Drawer
            open={showAddType}
            onOpenChange={(open) => {
              setShowAddType(open);
              if (!open) setCustomizingTemplate(null);
            }}
          >
            <DrawerContent className="p-0 bg-background border-none rounded-t-[30px] overflow-hidden max-h-[92vh] outline-none">
              <div className="bg-muted p-6 relative overflow-hidden shrink-0 border-b">
                <DrawerHeader className="relative z-10 text-left p-0">
                  <DrawerTitle className="text-xl font-black">{t('services.newTypeTitle')}</DrawerTitle>
                </DrawerHeader>
              </div>
              <div className="p-4 overflow-y-auto pb-10">
                <TypePrestationForm
                  initialValues={customizingTemplate || undefined}
                  onSubmit={handleAddType}
                  onCancel={() => {
                    setShowAddType(false);
                    setCustomizingTemplate(null);
                  }}
                />
              </div>
            </DrawerContent>
          </Drawer>

          <Drawer open={!!editingType} onOpenChange={(open) => !open && setEditingType(null)}>
            <DrawerContent className="p-0 bg-background border-none rounded-t-[30px] overflow-hidden max-h-[92vh] outline-none">
              <div className="bg-muted p-6 relative overflow-hidden shrink-0 border-b">
                <DrawerHeader className="relative z-10 text-left p-0">
                  <DrawerTitle className="text-xl font-black">{t('services.editTypeTitle')}</DrawerTitle>
                </DrawerHeader>
              </div>
              <div className="p-4 overflow-y-auto pb-10">
                {editingType && (
                  <TypePrestationForm
                    type={editingType}
                    onSubmit={handleEditType}
                    onCancel={() => setEditingType(null)}
                  />
                )}
              </div>
            </DrawerContent>
          </Drawer>

          <Drawer open={showNouvellePrestation} onOpenChange={setShowNouvellePrestation}>
            <DrawerContent className="p-0 bg-background border-none rounded-t-[30px] overflow-hidden max-h-[92vh] outline-none">
              <div className="bg-primary p-6 text-primary-foreground relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 pointer-events-none">
                  <Scissors className="h-24 w-24" />
                </div>
                <DrawerHeader className="relative z-10 text-left p-0">
                  <DrawerTitle className="text-xl font-black tracking-tight">{t('services.registerTitle')}</DrawerTitle>
                </DrawerHeader>
              </div>
              <div className="p-4 overflow-y-auto pb-10">
                <NouvellePrestation
                  onClose={() => setShowNouvellePrestation(false)}
                  onAddNewType={() => { setShowNouvellePrestation(false); setShowAddType(true); }}
                  defaultPrestationId={selectedPrestation || undefined}
                />
              </div>
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        <>
          <Dialog
            open={showAddType}
            onOpenChange={(open) => {
              setShowAddType(open);
              if (!open) setCustomizingTemplate(null);
            }}
          >
            <DialogContent className="sm:max-w-md w-[95vw] sm:w-full rounded-3xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
              <DialogHeader className="shrink-0 p-4 sm:p-6 border-b border-border/40">
                <DialogTitle className="text-xl sm:text-2xl">{t('services.newTypeTitle')}</DialogTitle>
              </DialogHeader>
              <TypePrestationForm
                initialValues={customizingTemplate || undefined}
                onSubmit={handleAddType}
                onCancel={() => {
                  setShowAddType(false);
                  setCustomizingTemplate(null);
                }}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={!!editingType} onOpenChange={() => setEditingType(null)}>
            <DialogContent className="sm:max-w-md w-[95vw] sm:w-full rounded-3xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
              <DialogHeader className="shrink-0 p-4 sm:p-6 border-b border-border/40">
                <DialogTitle className="text-xl sm:text-2xl">{t('services.editTypeTitle')}</DialogTitle>
              </DialogHeader>
              {editingType && (
                <TypePrestationForm
                  type={editingType}
                  onSubmit={handleEditType}
                  onCancel={() => setEditingType(null)}
                />
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={showNouvellePrestation} onOpenChange={setShowNouvellePrestation}>
            <DialogContent className="sm:max-w-lg w-[95vw] sm:w-full p-0 rounded-3xl overflow-hidden max-h-[90vh] flex flex-col bg-background border-none shadow-2xl">
              <div className="bg-primary p-6 text-primary-foreground relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 pointer-events-none">
                  <Scissors className="h-24 w-24" />
                </div>
                <DialogHeader className="relative z-10 text-left p-0 border-none">
                  <DialogTitle className="text-2xl font-black tracking-tight">{t('services.registerTitle')}</DialogTitle>
                </DialogHeader>
              </div>
              <div className="p-6 overflow-y-auto flex-1 min-h-0">
                <NouvellePrestation
                  onClose={() => setShowNouvellePrestation(false)}
                  onAddNewType={() => { setShowNouvellePrestation(false); setShowAddType(true); }}
                  defaultPrestationId={selectedPrestation || undefined}
                />
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      {isMobile ? (
        <Drawer open={showAddRdv} onOpenChange={setShowAddRdv}>
          <DrawerContent className="p-0 bg-background border-none rounded-t-[30px] overflow-hidden max-h-[92vh] flex flex-col outline-none">
            <div className="bg-primary p-6 text-primary-foreground relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 pointer-events-none">
                <Plus className="h-24 w-24" />
              </div>
              <DrawerHeader className="relative z-10 text-left p-0 border-none">
                <DrawerTitle className="text-xl font-black tracking-tight">{t('appointments.newRdvTitle')}</DrawerTitle>
              </DrawerHeader>
            </div>
            <RendezVousForm
              defaultPrestationId={selectedPrestation || undefined}
              onSubmit={handleAddRdv}
              onCancel={() => setShowAddRdv(false)}
            />
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showAddRdv} onOpenChange={setShowAddRdv}>
          <DialogContent className="sm:max-w-xl w-[95vw] sm:w-full p-0 overflow-hidden rounded-3xl border-none shadow-3xl bg-background/95 backdrop-blur-xl max-h-[90vh] flex flex-col">
            <div className="bg-primary p-6 sm:p-8 text-primary-foreground relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10 rotate-12">
                <Plus className="h-16 w-16 sm:h-24 sm:w-24" />
              </div>
              <DialogHeader className="relative z-10 text-left p-0 border-none">
                <DialogTitle className="text-xl sm:text-3xl font-black tracking-tight">{t('appointments.newRdvTitle')}</DialogTitle>
              </DialogHeader>
            </div>
            <RendezVousForm
              defaultPrestationId={selectedPrestation || undefined}
              onSubmit={handleAddRdv}
              onCancel={() => setShowAddRdv(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Popular Hairstyles & Services Templates Library Modal */}
      <PopularTemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onCustomizeTemplate={(template) => {
          setCustomizingTemplate({
            nom: template.nom,
            prix: template.prix,
            description: template.description,
            categorie: template.categorie,
            imageUrl: template.imageUrl,
          });
          setShowAddType(true);
        }}
      />
    </div>
  );
}
