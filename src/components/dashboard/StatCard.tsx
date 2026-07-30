import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'accent' | 'purple';
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  const cardStyles = {
    default: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
    primary: 'bg-gradient-to-br from-rose-500/5 via-white to-rose-500/10 dark:from-rose-950/30 dark:via-slate-900 dark:to-rose-950/40 border-rose-200 dark:border-rose-900/60 hover:border-rose-400',
    success: 'bg-gradient-to-br from-emerald-500/5 via-white to-emerald-500/10 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400',
    warning: 'bg-gradient-to-br from-amber-500/5 via-white to-amber-500/10 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/40 border-amber-200 dark:border-amber-900/60 hover:border-amber-400',
    accent: 'bg-gradient-to-br from-sky-500/5 via-white to-sky-500/10 dark:from-sky-950/30 dark:via-slate-900 dark:to-sky-950/40 border-sky-200 dark:border-sky-900/60 hover:border-sky-400',
    purple: 'bg-gradient-to-br from-purple-500/5 via-white to-purple-500/10 dark:from-purple-950/30 dark:via-slate-900 dark:to-purple-950/40 border-purple-200 dark:border-purple-900/60 hover:border-purple-400',
  };

  const iconStyles = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    primary: 'bg-rose-500 text-white shadow-md shadow-rose-500/20',
    success: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20',
    warning: 'bg-amber-500 text-white shadow-md shadow-amber-500/20',
    accent: 'bg-sky-500 text-white shadow-md shadow-sky-500/20',
    purple: 'bg-purple-500 text-white shadow-md shadow-purple-500/20',
  };

  return (
    <div className={cn(
      'rounded-2xl p-4 sm:p-5 border shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden backdrop-blur-xl group flex flex-col justify-between min-h-[124px]',
      cardStyles[variant]
    )}>
      {/* Subtle Glow Effect */}
      <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-current opacity-5 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-300" />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight line-clamp-1">
            {title}
          </p>

          <p className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white break-words leading-tight pt-0.5">
            {value}
          </p>

          {subtitle && (
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-snug line-clamp-1 pt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className={cn(
          'h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200',
          iconStyles[variant]
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="relative z-10 pt-2">
          <div className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-2xs',
            trend.positive 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
          )}>
            {trend.positive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{trend.positive ? '+' : '-'}{Math.abs(trend.value)}% vs mois-1</span>
          </div>
        </div>
      )}
    </div>
  );
}
