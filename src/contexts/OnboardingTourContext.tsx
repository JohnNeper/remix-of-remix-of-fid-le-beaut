import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export interface TourStepInfo {
  id: string;
  stepNumber: number;
  title: string;
  shortDesc: string;
  route: string;
  routeLabel: string;
  notes: string[];
  tips: string;
}

export const TOUR_STEPS: TourStepInfo[] = [
  {
    id: 'step-1',
    stepNumber: 1,
    title: 'Étape 1 : Paramétrer votre Salon',
    shortDesc: 'Définissez le nom, téléphone WhatsApp, adresse et vos employés.',
    route: '/parametres',
    routeLabel: 'Aller aux Paramètres',
    notes: [
      'Personnalisez le nom et l’adresse exacte pour vos factures.',
      'Saisissez votre numéro WhatsApp pour l’envoi des reçus.',
      'Ajoutez les membres de votre équipe.'
    ],
    tips: 'Un profil complet renforce la confiance des clientes et permet de générer des reçus professionnels.'
  },
  {
    id: 'step-2',
    stepNumber: 2,
    title: 'Étape 2 : Ajouter votre 1er Client',
    shortDesc: 'Créez vos fiches clientes avec numéro WhatsApp.',
    route: '/clientes',
    routeLabel: 'Aller à Clientes',
    notes: [
      'Enregistrez le nom, prénom et numéro WhatsApp.',
      'Suivez l’historique des soins et préférences.',
      'Toutes les prestations y seront rattachées.'
    ],
    tips: 'Le numéro WhatsApp au format standard permet l’envoi de rappels automatiques en 1 clic.'
  },
  {
    id: 'step-3',
    stepNumber: 3,
    title: 'Étape 3 : Créer vos Prestations & Tarifs',
    shortDesc: 'Structurez votre catalogue (coiffure, soins...), tarifs et durées.',
    route: '/prestations',
    routeLabel: 'Catalogue de Prestations',
    notes: [
      'Classez vos prestations par catégories (Coiffure, Soin, Onglerie).',
      'Fixez le tarif par défaut et la durée estimée.',
      'Définissez les commissions du personnel.'
    ],
    tips: 'Des durées précises évitent le chevauchement des rendez-vous.'
  },
  {
    id: 'step-4',
    stepNumber: 4,
    title: 'Étape 4 : Enregistrer un Service / RDV',
    shortDesc: 'Comptabilisez vos encaissements et prestations effectuées.',
    route: '/prestations',
    routeLabel: 'Enregistrer une Prestation',
    notes: [
      'Sélectionnez la cliente, le soin et l’employé.',
      'Mettez à jour le chiffre d’affaires en temps réel.',
      'La cliente gagne ses points de fidélité !'
    ],
    tips: 'Chaque encaissement enregistré met à jour votre bilan financier.'
  },
  {
    id: 'step-5',
    stepNumber: 5,
    title: 'Étape 5 : Gérer le Stock & Produits',
    shortDesc: 'Gérez vos produits de revente et de soins avec alertes.',
    route: '/stock',
    routeLabel: 'Gérer le Stock',
    notes: [
      'Ajoutez vos produits de vente ou soins internes.',
      'Configurez le seuil d’alerte (ex: 3 unités restantes).',
      'Évitez les ruptures de stock impromptues.'
    ],
    tips: 'Consultez les alertes sur le dashboard pour réapprovisionner au bon moment.'
  },
  {
    id: 'step-6',
    stepNumber: 6,
    title: 'Étape 6 : Activer la Fidélité & Relances',
    shortDesc: 'Récompensez la fidélité et relancez les clientes sur WhatsApp.',
    route: '/fidelite',
    routeLabel: 'Fidélisation Client',
    notes: [
      'Définissez la valeur des points (ex: 10 000 FCFA = 100 pts).',
      'Proposez des récompenses (remises, soins offerts).',
      'Relancez les clientes inactives via WhatsApp.'
    ],
    tips: 'Fidéliser vos client(e)s augmente vos revenus de 30% sans budget pub supplémentaire.'
  }
];

export function getTranslatedTourSteps(t: (key: string, arg2?: any, arg3?: any) => string): TourStepInfo[] {
  return [
    {
      id: 'step-1',
      stepNumber: 1,
      title: t('tour.step1.title', 'Étape 1 : Paramétrer votre Salon'),
      shortDesc: t('tour.step1.shortDesc', 'Définissez le nom, téléphone WhatsApp, adresse et vos employés.'),
      route: '/parametres',
      routeLabel: t('tour.step1.routeLabel', 'Aller aux Paramètres'),
      notes: [
        t('tour.step1.note1', 'Personnalisez le nom et l’adresse exacte pour vos factures.'),
        t('tour.step1.note2', 'Saisissez votre numéro WhatsApp pour l’envoi des reçus.'),
        t('tour.step1.note3', 'Ajoutez les membres de votre équipe.')
      ],
      tips: t('tour.step1.tip', 'Un profil complet renforce la confiance des clientes et permet de générer des reçus professionnels.')
    },
    {
      id: 'step-2',
      stepNumber: 2,
      title: t('tour.step2.title', 'Étape 2 : Ajouter votre 1er Client'),
      shortDesc: t('tour.step2.shortDesc', 'Créez vos fiches clientes avec numéro WhatsApp.'),
      route: '/clientes',
      routeLabel: t('tour.step2.routeLabel', 'Aller à Clientes'),
      notes: [
        t('tour.step2.note1', 'Enregistrez le nom, prénom et numéro WhatsApp.'),
        t('tour.step2.note2', 'Suivez l’historique des soins et préférences.'),
        t('tour.step2.note3', 'Toutes les prestations y seront rattachées.')
      ],
      tips: t('tour.step2.tip', 'Le numéro WhatsApp au format standard permet l’envoi de rappels automatiques en 1 clic.')
    },
    {
      id: 'step-3',
      stepNumber: 3,
      title: t('tour.step3.title', 'Étape 3 : Créer vos Prestations & Tarifs'),
      shortDesc: t('tour.step3.shortDesc', 'Structurez votre catalogue (coiffure, soins...), tarifs et durées.'),
      route: '/prestations',
      routeLabel: t('tour.step3.routeLabel', 'Catalogue de Prestations'),
      notes: [
        t('tour.step3.note1', 'Classez vos prestations par catégories (Coiffure, Soin, Onglerie).'),
        t('tour.step3.note2', 'Fixez le tarif par défaut et la durée estimée.'),
        t('tour.step3.note3', 'Définissez les commissions du personnel.')
      ],
      tips: t('tour.step3.tip', 'Des durées précises évitent le chevauchement des rendez-vous.')
    },
    {
      id: 'step-4',
      stepNumber: 4,
      title: t('tour.step4.title', 'Étape 4 : Enregistrer un Service / RDV'),
      shortDesc: t('tour.step4.shortDesc', 'Comptabilisez vos encaissements et prestations effectuées.'),
      route: '/prestations',
      routeLabel: t('tour.step4.routeLabel', 'Enregistrer une Prestation'),
      notes: [
        t('tour.step4.note1', 'Sélectionnez la cliente, le soin et l’employé.'),
        t('tour.step4.note2', 'Mettez à jour le chiffre d’affaires en temps réel.'),
        t('tour.step4.note3', 'La cliente gagne ses points de fidélité !')
      ],
      tips: t('tour.step4.tip', 'Chaque encaissement enregistré met à jour votre bilan financier.')
    },
    {
      id: 'step-5',
      stepNumber: 5,
      title: t('tour.step5.title', 'Étape 5 : Gérer le Stock & Produits'),
      shortDesc: t('tour.step5.shortDesc', 'Gérez vos produits de revente et de soins avec alertes.'),
      route: '/stock',
      routeLabel: t('tour.step5.routeLabel', 'Gérer le Stock'),
      notes: [
        t('tour.step5.note1', 'Ajoutez vos produits de vente ou soins internes.'),
        t('tour.step5.note2', 'Configurez le seuil d’alerte (ex: 3 unités restantes).'),
        t('tour.step5.note3', 'Évitez les ruptures de stock impromptues.')
      ],
      tips: t('tour.step5.tip', 'Consultez les alertes sur le dashboard pour réapprovisionner au bon moment.')
    },
    {
      id: 'step-6',
      stepNumber: 6,
      title: t('tour.step6.title', 'Étape 6 : Activer la Fidélité & Relances'),
      shortDesc: t('tour.step6.shortDesc', 'Récompensez la fidélité et relancez les clientes sur WhatsApp.'),
      route: '/fidelite',
      routeLabel: t('tour.step6.routeLabel', 'Fidélisation Client'),
      notes: [
        t('tour.step6.note1', 'Définissez la valeur des points (ex: 10 000 FCFA = 100 pts).'),
        t('tour.step6.note2', 'Proposez des récompenses (remises, soins offerts).'),
        t('tour.step6.note3', 'Relancez les clientes inactives via WhatsApp.')
      ],
      tips: t('tour.step6.tip', 'Fidéliser vos client(e)s augmente vos revenus de 30% sans budget pub supplémentaire.')
    }
  ];
}

interface OnboardingTourContextType {
  isTourActive: boolean;
  currentStepIndex: number;
  currentStep: TourStepInfo;
  tourSteps: TourStepInfo[];
  activeHighlightStepId: string | null;
  isTourModalOpen: boolean;
  initialStepIndex: number;
  openTourModal: (stepIndex?: number) => void;
  closeTourModal: () => void;
  startTour: (stepIndex?: number) => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  goToStepAndNavigate: (route: string) => void;
  getActiveStepForRoute: (route: string) => TourStepInfo | null;
  clearHighlight: () => void;
}

const OnboardingTourContext = createContext<OnboardingTourContextType | null>(null);

export const OnboardingTourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useLanguage();
  const tourSteps = useMemo(() => getTranslatedTourSteps(t), [t]);

  const [isTourActive, setIsTourActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('beautyspace_tour_active');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [activeHighlightStepId, setActiveHighlightStepId] = useState<string | null>(null);
  const [isTourModalOpen, setIsTourModalOpen] = useState<boolean>(false);
  const [initialStepIndex, setInitialStepIndex] = useState<number>(0);

  const navigate = useNavigate();
  const location = useLocation();

  const currentStep = tourSteps[currentStepIndex] || tourSteps[0];

  const openTourModal = useCallback((stepIndex: number = 0) => {
    setInitialStepIndex(stepIndex);
    setIsTourModalOpen(true);
  }, []);

  const closeTourModal = useCallback(() => {
    setIsTourModalOpen(false);
  }, []);

  const startTour = useCallback((stepIndex: number = 0) => {
    setCurrentStepIndex(stepIndex);
    setIsTourActive(true);
    try {
      localStorage.setItem('beautyspace_tour_active', 'true');
    } catch (e) {
      console.error(e);
    }
  }, []);

  const stopTour = useCallback(() => {
    setIsTourActive(false);
    setActiveHighlightStepId(null);
    try {
      localStorage.setItem('beautyspace_tour_active', 'false');
    } catch (e) {
      console.error(e);
    }
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStepIndex(prev => {
      const nextIdx = Math.min(prev + 1, tourSteps.length - 1);
      return nextIdx;
    });
  }, [tourSteps.length]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < tourSteps.length) {
      setCurrentStepIndex(index);
      setIsTourActive(true);
    }
  }, [tourSteps.length]);

  const goToStepAndNavigate = useCallback((route: string) => {
    setActiveHighlightStepId(currentStep.id);
    if (location.pathname !== route) {
      navigate(route);
    }
    setTimeout(() => {
      setActiveHighlightStepId(prev => (prev === currentStep.id ? null : prev));
    }, 12000);
  }, [currentStep.id, navigate, location.pathname]);

  const getActiveStepForRoute = useCallback((route: string) => {
    if (!isTourActive) return null;
    if (currentStep.route === route) {
      return currentStep;
    }
    return null;
  }, [isTourActive, currentStep]);

  const clearHighlight = useCallback(() => {
    setActiveHighlightStepId(null);
  }, []);

  return (
    <OnboardingTourContext.Provider
      value={{
        isTourActive,
        currentStepIndex,
        currentStep,
        tourSteps,
        activeHighlightStepId,
        isTourModalOpen,
        initialStepIndex,
        openTourModal,
        closeTourModal,
        startTour,
        stopTour,
        nextStep,
        prevStep,
        goToStep,
        goToStepAndNavigate,
        getActiveStepForRoute,
        clearHighlight,
      }}
    >
      {children}
    </OnboardingTourContext.Provider>
  );
};

export const useOnboardingTour = () => {
  const context = useContext(OnboardingTourContext);
  if (!context) {
    throw new Error('useOnboardingTour must be used within an OnboardingTourProvider');
  }
  return context;
};
