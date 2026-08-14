import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Info,
  Smartphone,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOnboardingTour } from '@/contexts/OnboardingTourContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface OnboardingStep {
  id: string;
  title: string;
  shortDesc: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  route: string;
  routeLabel: string;
  completed: boolean;
  notes: string[];
  tips: string;
  detailedSteps: {
    number: number;
    title: string;
    description: string;
  }[];
}

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: OnboardingStep[];
  completedCount: number;
  initialStepIndex?: number;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  open,
  onOpenChange,
  steps,
  completedCount,
  initialStepIndex = 0,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(initialStepIndex);
  const { goToStep, goToStepAndNavigate } = useOnboardingTour();
  const { t } = useLanguage();

  const activeStep = steps[activeStepIndex] || steps[0];
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const getStepRoute = (id: string) => {
    switch (id) {
      case 'step-1': return '/parametres';
      case 'step-2': return '/clientes';
      case 'step-3': return '/prestations';
      case 'step-4': return '/prestations';
      case 'step-5': return '/stock';
      case 'step-6': return '/fidelite';
      default: return '/';
    }
  };

  const handleActionClick = () => {
    if (!activeStep) return;
    const targetRoute = getStepRoute(activeStep.id);
    goToStep(activeStepIndex);
    goToStepAndNavigate(targetRoute);
    onOpenChange(false);
  };

  const handleNextIndex = () => {
    if (activeStepIndex < steps.length - 1) {
      setActiveStepIndex(prev => prev + 1);
    }
  };

  const handlePrevIndex = () => {
    if (activeStepIndex > 0) {
      setActiveStepIndex(prev => prev - 1);
    }
  };

  if (!activeStep) return null;

  const IconComponent = activeStep.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-3xl border-slate-200 dark:border-slate-800 shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-6 pb-5 relative overflow-hidden shrink-0">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
            <Sparkles className="w-64 h-64 text-rose-300" />
          </div>

          <div className="flex items-center justify-between gap-4 mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <Badge className="bg-rose-500/20 text-rose-200 border-rose-400/30 px-3 py-1 font-bold text-xs backdrop-blur-md">
                <BookOpen className="w-3.5 h-3.5 mr-1.5 text-rose-300" />
                {t('tour.modalTitle', 'Guide de Prise en Main BeautyFlow')}
              </Badge>
              <Badge variant="outline" className="text-slate-300 border-white/20 text-xs font-semibold">
                {t('tour.completedCount', { count: completedCount, total: steps.length })}
              </Badge>
            </div>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5 relative z-10">
            <span>{t('tour.modalSubtitle', 'Comment bien démarrer votre Salon')}</span>
          </DialogTitle>
          
          <DialogDescription className="text-slate-300 text-xs sm:text-sm font-medium mt-1 relative z-10">
            {t('tour.modalDesc', 'Suivez ces 6 étapes simples pour configurer votre établissement et automatiser votre gestion au quotidien.')}
          </DialogDescription>

          {/* Progress bar */}
          <div className="mt-4 space-y-1.5 relative z-10">
            <div className="flex justify-between text-[11px] font-bold text-slate-300">
              <span>{t('tour.globalProgress', 'Progression Globale')}</span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-slate-800/80 [&>div]:bg-gradient-to-r [&>div]:from-rose-500 [&>div]:to-amber-400" />
          </div>
        </div>

        {/* Step Tabs Navigation */}
        <div className="border-b border-border bg-muted/40 p-2 overflow-x-auto flex gap-1.5 shrink-0 scrollbar-none">
          {steps.map((step, idx) => {
            const isCurrent = idx === activeStepIndex;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStepIndex(idx)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border',
                  isCurrent
                    ? 'bg-background text-foreground border-border shadow-sm ring-2 ring-primary/20'
                    : step.completed
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                )}
              >
                <div className={cn(
                  'w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-extrabold shrink-0',
                  step.completed ? 'bg-emerald-500 text-white' : isCurrent ? step.bgColor + ' ' + step.color : 'bg-muted-foreground/20 text-muted-foreground'
                )}>
                  {step.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span>{step.title.split(':')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Main Step Detail View */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 font-sans">
          
          {/* Active Step Header Banner */}
          <div className={cn(
            'p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all',
            activeStep.bgColor,
            activeStep.borderColor
          )}>
            <div className="flex items-center gap-3.5">
              <div className={cn('p-3 rounded-2xl bg-white dark:bg-slate-900 shadow-sm shrink-0 border border-border/50', activeStep.color)}>
                <IconComponent className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('tour.stepCounterOf', { step: activeStepIndex + 1, total: steps.length })}</span>
                  {activeStep.completed && (
                    <Badge className="bg-emerald-500 text-white border-0 text-[10px] font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {t('tour.completedTag', 'Terminée')}
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-black text-foreground">{activeStep.title}</h3>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">{activeStep.shortDesc}</p>
              </div>
            </div>

            <Button onClick={handleActionClick} className="w-full sm:w-auto font-bold text-xs shadow-md flex items-center justify-center gap-2 border-0 gradient-primary">
              <span>{activeStep.routeLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Detailed Instructions Steps */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <span>{t('tour.detailedStepsTitle', 'Marche à suivre détaillée :')}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {activeStep.detailedSteps.map(subStep => (
                <div key={subStep.number} className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex flex-col justify-between space-y-2 hover:border-primary/30 transition-colors">
                  <div>
                    <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary font-black text-xs flex items-center justify-center mb-2.5">
                      {subStep.number}
                    </div>
                    <h5 className="font-extrabold text-xs text-foreground">{subStep.title}</h5>
                    <p className="text-[11px] text-muted-foreground font-medium mt-1 leading-relaxed">{subStep.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes & Key Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Notes List */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{t('tour.benefitsTitle', 'Ce que cela apporte à votre salon :')}</span>
              </h4>
              <ul className="space-y-2">
                {activeStep.notes.map((note, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 font-medium flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Tip Box */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 text-amber-500 animate-bounce" />
                  <span>{t('tour.proTipTitle', 'Astuce Pro BeautyFlow :')}</span>
                </div>
                <p className="text-xs font-medium mt-2 leading-relaxed">
                  {activeStep.tips}
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2 text-[11px] font-bold text-amber-800 dark:text-amber-400">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('tour.optimizedBadge', 'Optimisé pour la beauté & le bien-être')}</span>
              </div>
            </div>

          </div>

        </div>

        {/* Footer Navigation Controls */}
        <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevIndex}
            disabled={activeStepIndex === 0}
            className="font-bold text-xs"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t('tour.prevStep', 'Étape Précédente')}
          </Button>

          <span className="text-xs font-bold text-muted-foreground hidden sm:inline">
            {t('tour.stepCounterOf', { step: activeStepIndex + 1, total: steps.length })}
          </span>

          {activeStepIndex < steps.length - 1 ? (
            <Button
              size="sm"
              onClick={handleNextIndex}
              className="font-bold text-xs gradient-primary border-0"
            >
              {t('tour.nextStep', 'Étape Suivante')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleActionClick} className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0">
              Lancer l'action →
            </Button>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
};
