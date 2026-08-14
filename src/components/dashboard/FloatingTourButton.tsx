import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Sparkles, BookOpen } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { usePrestations } from '@/hooks/usePrestations';
import { useSalon } from '@/hooks/useSalon';
import { useStock } from '@/hooks/useStock';
import { useRendezVous } from '@/hooks/useRendezVous';
import { useOnboardingTour } from '@/contexts/OnboardingTourContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { OnboardingModal } from './OnboardingModal';
import { OnboardingStep } from './OnboardingModal';
import {
  Settings,
  UserPlus,
  Scissors,
  Calendar,
  Package,
  Gift,
} from 'lucide-react';

export const FloatingTourButton: React.FC = () => {
  const { isTourModalOpen, openTourModal, closeTourModal, goToStepAndNavigate, initialStepIndex } = useOnboardingTour();
  const { t } = useLanguage();

  const { salon } = useSalon();
  const { clients } = useClients();
  const { typesPrestations, prestations } = usePrestations();
  const { produits } = useStock();
  const { rendezVous } = useRendezVous();

  const manualChecks = useMemo(() => {
    try {
      const saved = localStorage.getItem('beautyspace_onboarding_manual_checks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }, []);

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
        title: t('tour.step1.title', 'Étape 1 : Paramétrer votre Salon'),
        shortDesc: t('tour.step1.shortDesc', 'Définissez le nom, téléphone WhatsApp, adresse et vos employés.'),
        icon: Settings,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        route: '/parametres',
        routeLabel: t('tour.step1.routeLabel', 'Aller aux Paramètres'),
        completed: isStep1Done,
        notes: [
          t('tour.step1.note1', 'Personnalisez le nom et l’adresse exacte pour vos factures.'),
          t('tour.step1.note2', 'Saisissez votre numéro WhatsApp pour l’envoi des reçus.'),
          t('tour.step1.note3', 'Ajoutez les membres de votre équipe.')
        ],
        tips: t('tour.step1.tip', 'Un profil complet renforce la confiance des clientes et permet de générer des reçus professionnels.'),
        detailedSteps: [
          { number: 1, title: t('tour.step1.detail1.title', 'Renseigner le Profil'), description: t('tour.step1.detail1.desc', 'Entrez le nom commercial, l’adresse physique et l’adresse e-mail de votre salon.') },
          { number: 2, title: t('tour.step1.detail2.title', 'Configurer WhatsApp'), description: t('tour.step1.detail2.desc', 'Ajoutez votre numéro WhatsApp principal avec l’indicatif pays (ex: +237...).') },
          { number: 3, title: t('tour.step1.detail3.title', 'Ajouter l’Équipe'), description: t('tour.step1.detail3.desc', 'Allez dans l’onglet Équipe pour ajouter vos employés et définir leurs accès.') }
        ]
      },
      {
        id: 'step-2',
        title: t('tour.step2.title', 'Étape 2 : Ajouter votre 1er Client'),
        shortDesc: t('tour.step2.shortDesc', 'Créez vos fiches clientes avec numéro WhatsApp.'),
        icon: UserPlus,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        route: '/clientes',
        routeLabel: t('tour.step2.routeLabel', 'Aller à Clientes'),
        completed: isStep2Done,
        notes: [
          t('tour.step2.note1', 'Enregistrez le nom, prénom et numéro WhatsApp.'),
          t('tour.step2.note2', 'Suivez l’historique des soins et préférences.'),
          t('tour.step2.note3', 'Toutes les prestations y seront rattachées.')
        ],
        tips: t('tour.step2.tip', 'Le numéro WhatsApp au format standard permet l’envoi de rappels automatiques en 1 clic.'),
        detailedSteps: [
          { number: 1, title: t('tour.step2.detail1.title', 'Ouvrir le Répertoire'), description: t('tour.step2.detail1.desc', 'Accédez au menu Clientes depuis la barre de navigation.') },
          { number: 2, title: t('tour.step2.detail2.title', 'Nouveau Profil'), description: t('tour.step2.detail2.desc', 'Cliquez sur "Nouvelle cliente" et saisissez le nom et prénom.') },
          { number: 3, title: t('tour.step2.detail3.title', 'WhatsApp & Préférences'), description: t('tour.step2.detail3.desc', 'Renseignez le numéro WhatsApp pour activer les rappels automatiques.') }
        ]
      },
      {
        id: 'step-3',
        title: t('tour.step3.title', 'Étape 3 : Créer vos Prestations & Tarifs'),
        shortDesc: t('tour.step3.shortDesc', 'Structurez votre catalogue (coiffure, soins...), tarifs et durées.'),
        icon: Scissors,
        color: 'text-rose-500',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/30',
        route: '/prestations',
        routeLabel: t('tour.step3.routeLabel', 'Catalogue de Prestations'),
        completed: isStep3Done,
        notes: [
          t('tour.step3.note1', 'Classez vos prestations par catégories (Coiffure, Soin, Onglerie).'),
          t('tour.step3.note2', 'Fixez le tarif par défaut et la durée estimée.'),
          t('tour.step3.note3', 'Définissez les commissions du personnel.')
        ],
        tips: t('tour.step3.tip', 'Des durées précises évitent le chevauchement des rendez-vous.'),
        detailedSteps: [
          { number: 1, title: t('tour.step3.detail1.title', 'Créer les Catégories'), description: t('tour.step3.detail1.desc', 'Organisez vos prestations par spécialités (Coiffure, Esthétique...).') },
          { number: 2, title: t('tour.step3.detail2.title', 'Fixer les Tarifs'), description: t('tour.step3.detail2.desc', 'Définissez les prix de chaque soin et la durée estimée.') },
          { number: 3, title: t('tour.step3.detail3.title', 'Commissions'), description: t('tour.step3.detail3.desc', 'Indiquez le % de commission attribué aux employé(e)s.') }
        ]
      },
      {
        id: 'step-4',
        title: t('tour.step4.title', 'Étape 4 : Enregistrer un Service / RDV'),
        shortDesc: t('tour.step4.shortDesc', 'Comptabilisez vos encaissements et prestations effectuées.'),
        icon: Calendar,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        route: '/prestations',
        routeLabel: t('tour.step4.routeLabel', 'Enregistrer une Prestation'),
        completed: isStep4Done,
        notes: [
          t('tour.step4.note1', 'Sélectionnez la cliente, le soin et l’employé.'),
          t('tour.step4.note2', 'Mettez à jour le chiffre d’affaires en temps réel.'),
          t('tour.step4.note3', 'La cliente gagne ses points de fidélité !')
        ],
        tips: t('tour.step4.tip', 'Chaque encaissement enregistré met à jour votre bilan financier.'),
        detailedSteps: [
          { number: 1, title: t('tour.step4.detail1.title', 'Sélectionner la Cliente'), description: t('tour.step4.detail1.desc', 'Choisissez la cliente parmi votre base ou créez-la directement.') },
          { number: 2, title: t('tour.step4.detail2.title', 'Choisir le Soin'), description: t('tour.step4.detail2.desc', 'Cochez la ou les prestations réalisées lors du rendez-vous.') },
          { number: 3, title: t('tour.step4.detail3.title', 'Valider l’Encaissement'), description: t('tour.step4.detail3.desc', 'Sélectionnez le mode de paiement et générez le reçu WhatsApp.') }
        ]
      },
      {
        id: 'step-5',
        title: t('tour.step5.title', 'Étape 5 : Gérer le Stock & Produits'),
        shortDesc: t('tour.step5.shortDesc', 'Gérez vos produits de revente et de soins avec alertes.'),
        icon: Package,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        route: '/stock',
        routeLabel: t('tour.step5.routeLabel', 'Gérer le Stock'),
        completed: isStep5Done,
        notes: [
          t('tour.step5.note1', 'Ajoutez vos produits de vente ou soins internes.'),
          t('tour.step5.note2', 'Configurez le seuil d’alerte (ex: 3 unités restantes).'),
          t('tour.step5.note3', 'Évitez les ruptures de stock impromptues.')
        ],
        tips: t('tour.step5.tip', 'Consultez les alertes sur le dashboard pour réapprovisionner au bon moment.'),
        detailedSteps: [
          { number: 1, title: t('tour.step5.detail1.title', 'Enregistrer les Produits'), description: t('tour.step5.detail1.desc', 'Ajoutez vos cosmétiques, shampoings, huiles et accessoires.') },
          { number: 2, title: t('tour.step5.detail2.title', 'Seuils d’Alerte'), description: t('tour.step5.detail2.desc', 'Indiquez la quantité minimale avant notification d’alerte stock.') },
          { number: 3, title: t('tour.step5.detail3.title', 'Suivi des Entrées/Sorties'), description: t('tour.step5.detail3.desc', 'Ajustez le niveau de stock lors des ventes ou consommations.') }
        ]
      },
      {
        id: 'step-6',
        title: t('tour.step6.title', 'Étape 6 : Activer la Fidélité & Relances'),
        shortDesc: t('tour.step6.shortDesc', 'Récompensez la fidélité et relancez les clientes sur WhatsApp.'),
        icon: Gift,
        color: 'text-rose-600',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/30',
        route: '/fidelite',
        routeLabel: t('tour.step6.routeLabel', 'Fidélisation Client'),
        completed: isStep6Done,
        notes: [
          t('tour.step6.note1', 'Définissez la valeur des points (ex: 10 000 FCFA = 100 pts).'),
          t('tour.step6.note2', 'Proposez des récompenses (remises, soins offerts).'),
          t('tour.step6.note3', 'Relancez les clientes inactives via WhatsApp.')
        ],
        tips: t('tour.step6.tip', 'Fidéliser vos client(e)s augmente vos revenus de 30% sans budget pub supplémentaire.'),
        detailedSteps: [
          { number: 1, title: t('tour.step6.detail1.title', 'Activer la Fidélité'), description: t('tour.step6.detail1.desc', 'Configurez le nombre de visites nécessaires pour débloquer un cadeau.') },
          { number: 2, title: t('tour.step6.detail2.title', 'Définir les Remises'), description: t('tour.step6.detail2.desc', 'Choisissez le % de réduction ou la prestation offerte.') },
          { number: 3, title: t('tour.step6.detail3.title', 'Relances Inactives'), description: t('tour.step6.detail3.desc', 'Envoyez des messages d’invitation aux clientes non revenues depuis 30 jours.') }
        ]
      }
    ];
  }, [salon, clients, typesPrestations, prestations, produits, rendezVous, manualChecks, t]);

  const completedCount = useMemo(() => {
    return steps.filter(s => s.completed).length;
  }, [steps]);

  // Wrap onOpenChange so when a step route is clicked inside modal, it navigates with spotlight highlight
  const handleModalOpenChange = (open: boolean) => {
    if (!open) closeTourModal();
  };

  return (
    <>
      <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 animate-in fade-in duration-300">
        <Button
          onClick={() => openTourModal(0)}
          className="h-12 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-950 dark:border dark:border-amber-400/40 shadow-2xl flex items-center gap-2.5 font-sans border-2 border-amber-400/60 transition-transform active:scale-95 group"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 flex items-center justify-center text-slate-950 font-black text-xs shrink-0 shadow-sm group-hover:scale-110 transition-transform">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
              {t('tour.floatingBtnLabel', 'Guide 1ers pas')}
            </div>
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span>{completedCount}/{steps.length} {t('tour.completedTag', 'Terminées')}</span>
            </div>
          </div>
          <Badge className="bg-amber-400 text-slate-950 font-black text-[11px] px-2 py-0.5 rounded-full border-0 ml-1">
            {completedCount}/{steps.length}
          </Badge>
        </Button>
      </div>

      <OnboardingModal
        open={isTourModalOpen}
        onOpenChange={handleModalOpenChange}
        steps={steps.map(step => ({
          ...step,
          // Override route handler to activate tour pointer on navigation!
          route: '#',
          routeLabel: step.routeLabel,
        }))}
        completedCount={completedCount}
        initialStepIndex={initialStepIndex}
      />
    </>
  );
};
