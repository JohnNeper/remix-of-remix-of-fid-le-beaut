import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Settings,
  UserPlus,
  Scissors,
  Calendar,
  Package,
  Gift,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lightbulb,
  BookOpen,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useClients } from '@/hooks/useClients';
import { usePrestations } from '@/hooks/usePrestations';
import { useSalon } from '@/hooks/useSalon';
import { useStock } from '@/hooks/useStock';
import { useRendezVous } from '@/hooks/useRendezVous';
import { OnboardingModal, OnboardingStep } from './OnboardingModal';
import { cn } from '@/lib/utils';

export const OnboardingGuide: React.FC<{ forceOpenModal?: boolean; onCloseModal?: () => void }> = ({
  forceOpenModal = false,
  onCloseModal,
}) => {
  const { salon } = useSalon();
  const { clients } = useClients();
  const { typesPrestations, prestations } = usePrestations();
  const { produits } = useStock();
  const { rendezVous } = useRendezVous();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedModalIndex, setSelectedModalIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [expandedStepId, setExpandedStepId] = useState<string | null>('step-1');
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('beautyspace_onboarding_manual_checks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (forceOpenModal) {
      setModalOpen(true);
    }
  }, [forceOpenModal]);

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open && onCloseModal) {
      onCloseModal();
    }
  };

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('beautyspace_onboarding_dismissed');
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleManualCheck = (stepId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setManualChecks(prev => {
      const updated = { ...prev, [stepId]: !prev[stepId] };
      try {
        localStorage.setItem('beautyspace_onboarding_manual_checks', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('beautyspace_onboarding_dismissed', 'true');
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = () => {
    setIsDismissed(false);
    setManualChecks({});
    try {
      localStorage.removeItem('beautyspace_onboarding_dismissed');
      localStorage.removeItem('beautyspace_onboarding_manual_checks');
    } catch (e) {
      console.error(e);
    }
  };

  // Define steps dynamically with real app data status
  const steps: OnboardingStep[] = useMemo(() => {
    const isStep1Done = Boolean(salon?.nom && (salon?.telephone || salon?.whatsappNumber) && salon?.adresse) || Boolean(manualChecks['step-1']);
    const isStep2Done = (clients && clients.length > 0) || Boolean(manualChecks['step-2']);
    const isStep3Done = (typesPrestations && typesPrestations.length > 0) || Boolean(manualChecks['step-3']);
    const isStep4Done = (prestations && prestations.length > 0) || (rendezVous && rendezVous.length > 0) || Boolean(manualChecks['step-4']);
    const isStep5Done = (produits && produits.length > 0) || Boolean(manualChecks['step-5']);
    const isStep6Done = Boolean(salon?.fideliteActive || salon?.programmeFidelite?.actif) || Boolean(manualChecks['step-6']);

    return [
      {
        id: 'step-1',
        title: 'Étape 1 : Paramétrer les infos du Salon',
        shortDesc: 'Configurez le nom, numéro WhatsApp, logo et membres de l’équipe.',
        icon: Settings,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        route: '/parametres',
        routeLabel: 'Accéder aux Paramètres',
        completed: isStep1Done,
        notes: [
          'Personnalisez la raison sociale et l’adresse exacte pour la facturation.',
          'Associez le bon numéro WhatsApp pour l’envoi des confirmations automatiques.',
          'Ajoutez les employés/coiffeurs/esthéticiennes pour l’attribution des prestations et la gestion d’agenda.'
        ],
        tips: 'Un profil salon complet renforce la confiance des clientes et permet de générer des reçus professionnels avec votre logo.',
        detailedSteps: [
          { number: 1, title: 'Informations Générales', description: 'Allez dans l’onglet Profil et saisissez le nom exact de votre établissement.' },
          { number: 2, title: 'Numéro WhatsApp', description: 'Ajoutez le numéro WhatsApp officiel du salon pour l’envoi direct des reçus.' },
          { number: 3, title: 'Équipe & Horaires', description: 'Créez vos collaborateurs et définissez leurs horaires de présence.' }
        ]
      },
      {
        id: 'step-2',
        title: 'Étape 2 : Ajouter votre 1er Client',
        shortDesc: 'Créez les fiches clientes pour suivre l’historique des visites et contacts.',
        icon: UserPlus,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        route: '/clientes',
        routeLabel: 'Ajouter une Cliente',
        completed: isStep2Done,
        notes: [
          'Enregistrez le nom, prénom et numéro de téléphone avec le code pays.',
          'Précisez le canal d’acquisition (ex: Instagram, Recommandation) pour optimiser votre marketing.',
          'Toutes les prestations futures lui seront automatiquement rattachées.'
        ],
        tips: 'Formattez toujours les numéros au format standard (ex: 699123456) pour déclencher les relances WhatsApp en un clic.',
        detailedSteps: [
          { number: 1, title: 'Ouvrir le répertoire', description: 'Rendez-vous dans la rubrique Clientes et cliquez sur "Ajouter une cliente".' },
          { number: 2, title: 'Compléter la fiche', description: 'Renseignez le téléphone et attribuez éventullement une note ou préférence.' },
          { number: 3, title: 'Importation', description: 'Vous pouvez aussi importer plusieurs contacts en 1 clic via votre répertoire.' }
        ]
      },
      {
        id: 'step-3',
        title: 'Étape 3 : Créer votre Catalogue de Prestations',
        shortDesc: 'Définissez vos soins (coiffure, ongles, massages...), leurs tarifs et durées.',
        icon: Scissors,
        color: 'text-rose-500',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/30',
        route: '/prestations',
        routeLabel: 'Gérer les Prestations',
        completed: isStep3Done,
        notes: [
          'Structurez vos prestations par types/catégories (Ex: Tresses, Pose de Gel, Soin Visage).',
          'Fixez les prix par défaut pour gagner du temps lors de la facturation rapide.',
          'Associez des durées réalistes pour optimiser la prise de rendez-vous en ligne.'
        ],
        tips: 'Définissez des prix clairs et des commissions si votre équipe est rémunérée à la prestation.',
        detailedSteps: [
          { number: 1, title: 'Créer les catégories', description: 'Définissez les grandes catégories de soins dispensés au salon.' },
          { number: 2, title: 'Ajouter une prestation', description: 'Renseignez le nom (ex: "Braids Longs"), la durée estimée et le tarif TTC.' },
          { number: 3, title: 'Attribuer la commission', description: 'Configurez la commission attribuée au staff pour le calcul du bilan.' }
        ]
      },
      {
        id: 'step-4',
        title: 'Étape 4 : Enregistrer un Service Effectué / RDV',
        shortDesc: 'Comptabilisez vos prestations réalisées ou programmez vos prochains RDV.',
        icon: Calendar,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        route: '/prestations',
        routeLabel: 'Enregistrer une Prestation',
        completed: isStep4Done,
        notes: [
          'Sélectionnez la cliente, le type de prestation et le collaborateur qui l’a réalisée.',
          'Le chiffre d’affaires et le bilan financier se mettent automatiquement à jour.',
          'La cliente accumule immédiatement ses points de fidélité !'
        ],
        tips: 'Utilisez la touche d’enregistrement rapide depuis le tableau de bord au moment de l’encaissement.',
        detailedSteps: [
          { number: 1, title: 'Sélectionner la cliente', description: 'Recherchez la cliente par nom ou téléphone.' },
          { number: 2, title: 'Choisir le soin', description: 'Sélectionnez la prestation réalisée et le montant encaissé.' },
          { number: 3, title: 'Valider l’encaissement', description: 'Générez la facture ou envoyez le reçu direct sur WhatsApp.' }
        ]
      },
      {
        id: 'step-5',
        title: 'Étape 5 : Gérer votre Stock & Produits',
        shortDesc: 'Ajoutez vos produits de vente ou d’usage et configurez les alertes de réapprovisionnement.',
        icon: Package,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        route: '/stock',
        routeLabel: 'Gérer le Stock',
        completed: isStep5Done,
        notes: [
          'Distinguez les produits destinés à la vente directe de ceux réservés au soin interne.',
          'Indiquez le seuil d’alerte (ex: 3 unités restantes).',
          'Recevez un avertissement sur le dashboard avant la rupture complète.'
        ],
        tips: 'Évitez les ruptures sur vos produits phares (shampoings, huiles, mèches) en automatisant le suivi des stocks.',
        detailedSteps: [
          { number: 1, title: 'Enregistrer un produit', description: 'Saisissez le nom du produit, la marque et la quantité initiale.' },
          { number: 2, title: 'Définir le seuil d’alerte', description: 'Indiquez le niveau critique de stock à partir duquel réapprovisionner.' },
          { number: 3, title: 'Suivre l’inventaire', description: 'Consultez la liste des alertes sur votre dashboard pour réapprovisionner.' }
        ]
      },
      {
        id: 'step-6',
        title: 'Étape 6 : Activer la Fidélité & les Rappels WhatsApp',
        shortDesc: 'Récompensez la fidélité de vos client(e)s et relancez les inactifs.',
        icon: Gift,
        color: 'text-rose-600',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/30',
        route: '/fidelite',
        routeLabel: 'Activer la Fidélité',
        completed: isStep6Done,
        notes: [
          'Définissez les règles de conversion (ex: 10 000 FCFA = 100 points).',
          'Associez des récompenses motivantes (ex: Un soin offert après 1 000 points).',
          'Utilisez la relance WhatsApp pour faire revenir les clientes non vues depuis 30+ jours.'
        ],
        tips: 'La fidélisation est 5 fois moins coûteuse que l’acquisition de nouvelles clientes !',
        detailedSteps: [
          { number: 1, title: 'Configurer les règles', description: 'Fixez le nombre de points crédités par tranche de dépense.' },
          { number: 2, title: 'Créer les récompensent', description: 'Proposez des remises ou cadeaux pour chaque palier franchi.' },
          { number: 3, title: 'Automatiser les relances', description: 'Envoyez des messages de courtoisie et rappels via la rubrique Rappels.' }
        ]
      }
    ];
  }, [salon, clients, typesPrestations, prestations, rendezVous, produits, manualChecks]);

  const completedCount = useMemo(() => {
    return steps.filter(s => s.completed).length;
  }, [steps]);

  const progressPercent = Math.round((completedCount / steps.length) * 100);

  if (isDismissed && !forceOpenModal) {
    return (
      <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border text-xs">
        <div className="flex items-center gap-2 text-muted-foreground font-medium">
          <BookOpen className="w-4 h-4 text-primary" />
          <span>Guide Premiers Pas masqué ({completedCount}/{steps.length} étapes)</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs font-bold text-primary">
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Réafficher le Guide
        </Button>
      </div>
    );
  }

  return (
    <>
      <Card className="rounded-3xl border border-primary/20 shadow-xl overflow-hidden bg-gradient-to-b from-card via-card to-primary/5 transition-all">
        {/* Header */}
        <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20 font-extrabold text-xs px-2.5 py-0.5">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500 animate-pulse" />
                  Prise en Main Rapide
                </Badge>
                <Badge variant="outline" className="text-xs font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                  {completedCount}/{steps.length} Validées
                </Badge>
              </div>
              <CardTitle className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
                <span>Tutoriel : Les 6 Étapes Indispensables pour votre Salon</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground font-medium">
                Suivez ce guide interactif pour maîtriser BeautyFlow et accélérer le développement de votre activité.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedModalIndex(0);
                  setModalOpen(true);
                }}
                className="h-9 px-3.5 font-extrabold text-xs text-primary border-primary/30 hover:bg-primary/10 rounded-xl shadow-xs"
              >
                <BookOpen className="w-4 h-4 mr-1.5" />
                Guide Pas-à-Pas Détaillé
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-9 w-9 rounded-xl"
                title={isCollapsed ? "Déplier" : "Réduire"}
              >
                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive"
                title="Masquer le guide"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

          </div>

          {/* Global Progress */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs font-extrabold text-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Niveau d'Avancement du Salon
              </span>
              <span className="text-primary">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2.5 rounded-full bg-muted [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-emerald-500" />
          </div>
        </CardHeader>

        {/* Collapsible Content */}
        {!isCollapsed && (
          <CardContent className="p-4 sm:p-6 space-y-3">
            <div className="grid grid-cols-1 gap-3">
              {steps.map((step, index) => {
                const IconComp = step.icon;
                const isExpanded = expandedStepId === step.id;

                return (
                  <div
                    key={step.id}
                    className={cn(
                      'rounded-2xl border transition-all overflow-hidden',
                      step.completed
                        ? 'bg-emerald-500/[0.03] border-emerald-500/20 dark:bg-emerald-950/10'
                        : isExpanded
                        ? 'bg-card border-primary/40 shadow-md ring-1 ring-primary/20'
                        : 'bg-muted/30 border-border/70 hover:border-border'
                    )}
                  >
                    {/* Step Header Row */}
                    <div
                      onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        
                        {/* Checkbox trigger */}
                        <div
                          onClick={(e) => toggleManualCheck(step.id, e)}
                          className={cn(
                            'w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 cursor-pointer',
                            step.completed
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                              : 'border-muted-foreground/30 hover:border-primary bg-background'
                          )}
                          title="Cocher manuellement comme effectué"
                        >
                          {step.completed && <CheckCircle2 className="w-4 h-4" />}
                        </div>

                        {/* Icon */}
                        <div className={cn('p-2.5 rounded-xl shrink-0 font-bold', step.bgColor, step.color)}>
                          <IconComp className="w-5 h-5" />
                        </div>

                        {/* Text */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={cn('font-extrabold text-xs sm:text-sm truncate', step.completed && 'line-through text-muted-foreground')}>
                              {step.title}
                            </h4>
                            {step.completed && (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold py-0 h-4">
                                Fait
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate mt-0.5">
                            {step.shortDesc}
                          </p>
                        </div>
                      </div>

                      {/* Right Action */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Link to={step.route} onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" className="h-8 text-xs font-bold text-primary hover:bg-primary/10 px-2.5 rounded-lg">
                            <span className="hidden sm:inline">{step.routeLabel}</span>
                            <ArrowRight className="w-3.5 h-3.5 sm:ml-1" />
                          </Button>
                        </Link>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>

                    {/* Expanded Detail Note */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-border/40 bg-muted/20 space-y-3 text-xs animate-in slide-in-from-top-1 duration-200">
                        
                        {/* Bullet Notes */}
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Notes & Recommandations :</span>
                          <ul className="space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                            {step.notes.map((note, nIdx) => (
                              <li key={nIdx} className="flex items-start gap-2 text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                <span>{note}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Pro Tip */}
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div className="text-[11px] font-medium leading-relaxed">
                            <strong className="font-bold">Astuce Pro : </strong>{step.tips}
                          </div>
                        </div>

                        {/* Action Toolbar */}
                        <div className="flex items-center justify-between pt-1">
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                              setSelectedModalIndex(index);
                              setModalOpen(true);
                            }}
                            className="h-auto p-0 text-xs font-bold text-primary underline"
                          >
                            Consulter le tutoriel pas-à-pas complet →
                          </Button>

                          <Link to={step.route}>
                            <Button size="sm" className="h-7 text-xs font-bold gradient-primary border-0 rounded-lg">
                              {step.routeLabel}
                            </Button>
                          </Link>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Global Interactive Detailed Tutorial Modal */}
      <OnboardingModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        steps={steps}
        completedCount={completedCount}
        initialStepIndex={selectedModalIndex}
      />
    </>
  );
};
