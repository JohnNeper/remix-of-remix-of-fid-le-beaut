import React from 'react';
import { useOnboardingTour } from '@/contexts/OnboardingTourContext';
import { Sparkles, ArrowDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourPointerProps {
  stepId: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const TourPointer: React.FC<TourPointerProps> = ({
  stepId,
  title,
  description,
  children,
  align = 'center',
  className,
}) => {
  const { activeHighlightStepId, clearHighlight } = useOnboardingTour();

  const isHighlighted = activeHighlightStepId === stepId;

  if (!isHighlighted) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative inline-block z-40', className)}>
      {/* Animated Pulse Ring Effect */}
      <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 opacity-80 blur-sm animate-pulse pointer-events-none z-0" />
      
      {/* Target Element */}
      <div className="relative z-10 ring-4 ring-rose-500/80 ring-offset-2 ring-offset-background rounded-xl transition-transform duration-300 scale-[1.02]">
        {children}
      </div>

      {/* Floating Pointer Callout Banner */}
      <div
        className={cn(
          'absolute -top-16 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto',
          align === 'left' && 'left-0',
          align === 'center' && 'left-1/2 -translate-x-1/2',
          align === 'right' && 'right-0'
        )}
      >
        <div className="bg-slate-900 text-white dark:bg-slate-900 border border-amber-400/60 shadow-2xl px-3.5 py-2 rounded-2xl flex items-center gap-2.5 whitespace-nowrap">
          <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center animate-bounce shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>

          <div className="text-left">
            <div className="text-[11px] font-black text-amber-300 flex items-center gap-1">
              <span>Étape active</span>
              <ArrowDown className="w-3 h-3 text-amber-400 animate-bounce" />
            </div>
            <div className="text-xs font-bold text-white">{title}</div>
            {description && <div className="text-[10px] text-slate-300">{description}</div>}
          </div>

          <button
            onClick={clearHighlight}
            className="p-1 text-slate-400 hover:text-white transition-colors ml-1"
            title="Fermer le pointeur"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
