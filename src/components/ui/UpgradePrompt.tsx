import React from 'react';
import { Lock, ArrowUpCircle, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plan, formatPlanPrice, getPlanColor } from '@/lib/plans';

interface UpgradePromptProps {
  feature: string;
  currentPlan: string;
  requiredPlan: Plan | null;
  type?: 'inline' | 'card' | 'banner';
  className?: string;
}

export function UpgradePrompt({ feature, currentPlan, requiredPlan, type = 'card', className = '' }: UpgradePromptProps) {
  const { language } = useLanguage();

  if (!requiredPlan) return null;

  const titles = {
    fr: 'Fonctionnalité réservée',
    en: 'Feature restricted',
  };
  const upgradeText = {
    fr: `Passez au plan ${requiredPlan.label} pour débloquer`,
    en: `Upgrade to ${requiredPlan.labelEn} to unlock`,
  };

  if (type === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Lock className="h-3.5 w-3.5" />
        <span>{feature}</span>
        <Badge variant="outline" className="text-[10px] ml-1">
          {requiredPlan.label}
        </Badge>
      </div>
    );
  }

  if (type === 'banner') {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5 ${className}`}>
        <ArrowUpCircle className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{feature}</p>
          <p className="text-xs text-muted-foreground">{upgradeText[language]}</p>
        </div>
        <Badge className={getPlanColor(requiredPlan.name)}>
          {requiredPlan.label}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={`border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 ${className}`}>
      <CardContent className="p-4 sm:p-6 text-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{titles[language]}</h3>
          <p className="text-sm text-muted-foreground mt-1">{feature}</p>
        </div>
        <div className="p-3 rounded-lg bg-background border">
          <div className="flex items-center justify-center gap-2">
            <Badge className={`${getPlanColor(requiredPlan.name)} text-xs`}>
              {requiredPlan.label}
            </Badge>
            <span className="text-sm font-semibold">{formatPlanPrice(requiredPlan.price)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{upgradeText[language]}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {language === 'fr' ? 'Contactez LeaderBright pour changer de plan' : 'Contact LeaderBright to change your plan'}
        </p>
      </CardContent>
    </Card>
  );
}

export function LimitReachedBanner({ current, max, label, requiredPlan }: { current: number; max: number; label: string; requiredPlan: Plan | null }) {
  const { language } = useLanguage();
  if (current < max || !requiredPlan) return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5">
      <Lock className="h-5 w-5 text-destructive shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {language === 'fr' ? `Limite atteinte : ${current}/${max} ${label}` : `Limit reached: ${current}/${max} ${label}`}
        </p>
        <p className="text-xs text-muted-foreground">
          {language === 'fr'
            ? `Passez au plan ${requiredPlan.label} pour augmenter la limite`
            : `Upgrade to ${requiredPlan.labelEn} to increase the limit`}
        </p>
      </div>
      <Badge className={getPlanColor(requiredPlan.name)}>{requiredPlan.label}</Badge>
    </div>
  );
}
