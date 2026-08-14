import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOnboardingTour } from '@/contexts/OnboardingTourContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const GuidedTourPopover: React.FC = () => {
  const { t } = useLanguage();
  const {
    isTourActive,
    currentStepIndex,
    currentStep,
    tourSteps,
    nextStep,
    prevStep,
    stopTour,
    goToStepAndNavigate,
  } = useOnboardingTour();

  if (!isTourActive || !currentStep) return null;

  const totalSteps = tourSteps?.length || 6;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
      <Card className="rounded-3xl border-2 border-amber-400/50 shadow-2xl overflow-hidden bg-slate-900 text-white dark:bg-slate-950 dark:border-amber-500/40 relative">
        
        {/* Top Decorative Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500" />

        <CardContent className="p-4 sm:p-5 space-y-3 font-sans">
          
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full border-0">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-slate-950 animate-bounce" />
                {t('tour.stepCounter', { step: currentStep.stepNumber, total: totalSteps })}
              </Badge>
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                {t('tour.badge', 'Guide Pas-à-Pas')}
              </span>
            </div>

            <button
              onClick={stopTour}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={t('tour.hide', 'Masquer le guide')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title & Short Description */}
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-snug">
              {currentStep.title}
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
              {currentStep.shortDesc}
            </p>
          </div>

          {/* Notes */}
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-1.5 text-xs">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('tour.toDoSection', 'À faire à cette étape :')}</span>
            </div>
            <ul className="space-y-1 text-slate-200 text-[11px] font-medium">
              {currentStep.notes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Tip */}
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] font-medium flex items-start gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span><strong className="text-amber-300 font-bold">{t('tour.proTip', 'Astuce :')} </strong>{currentStep.tips}</span>
          </div>

          {/* Action Toolbar */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={prevStep}
              disabled={isFirst}
              className="h-8 text-xs font-bold border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white px-2.5"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
              {t('tour.prev', 'Précédent')}
            </Button>

            <Button
              size="sm"
              onClick={() => goToStepAndNavigate(currentStep.route)}
              className="h-8 text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 border-0 px-3 shadow-md"
            >
              {currentStep.routeLabel}
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>

            {!isLast ? (
              <Button
                size="sm"
                onClick={nextStep}
                className="h-8 text-xs font-bold gradient-primary text-white border-0 px-3"
              >
                {t('tour.next', 'Suivant')}
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={stopTour}
                className="h-8 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white border-0 px-3"
              >
                {t('tour.finish', 'Terminer 🎉')}
              </Button>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
};
