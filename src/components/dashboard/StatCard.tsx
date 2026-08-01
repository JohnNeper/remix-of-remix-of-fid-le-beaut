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

export function StatCard({ title, value, subtitle, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="rounded-3xl p-5 border border-border/60 bg-card hover:border-primary/40 transition-all duration-300 relative overflow-hidden card-shadow group flex flex-col justify-between min-h-[130px]">
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider leading-tight line-clamp-1">
            {title}
          </p>

          <p className="text-xl sm:text-2xl font-black tracking-tight text-foreground break-words leading-tight pt-0.5">
            {value}
          </p>

          {subtitle && (
            <p className="text-[11px] font-medium text-muted-foreground leading-snug line-clamp-1 pt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="relative z-10 pt-2">
          <div className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
            trend.positive 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
              : 'bg-destructive/10 text-destructive border-destructive/20'
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
