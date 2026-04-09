import React, { useState } from 'react';
import { Lock, ArrowUpCircle, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plan, formatPlanPrice, getPlanColor } from '@/lib/plans';
import { ContactUpgradeDialog } from '@/components/ui/ContactUpgradeDialog';

interface UpgradePromptProps {
  feature: string;
  currentPlan: string;
  requiredPlan: Plan | null;
  type?: 'inline' | 'card' | 'banner';
  className?: string;
}

export function UpgradePrompt({ feature, currentPlan, requiredPlan, type = 'card', className = '' }: UpgradePromptProps) {
  const { language } = useLanguage();
  const [showContact, setShowContact] = useState(false);

  if (!requiredPlan) return null;

  const upgradeText = {
    fr: `Passez au plan ${requiredPlan.label} pour débloquer`,
    en: `Upgrade to ${requiredPlan.labelEn} to unlock`,
  };

  if (type === 'inline') {
    return (
      <>
        <button onClick={() => setShowContact(true)} className={`flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors ${className}`}>
          <Lock className="h-3.5 w-3.5" />
          <span>{feature}</span>
          <Badge variant="outline" className="text-[10px] ml-1">{requiredPlan.label}</Badge>
        </button>
        <ContactUpgradeDialog open={showContact} onOpenChange={setShowContact} feature={feature} currentPlan={currentPlan} requiredPlan={requiredPlan} />
      </>
    );
  }

  if (type === 'banner') {
    return (
      <>
        <button onClick={() => setShowContact(true)} className={`w-full flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer text-left ${className}`}>
          <ArrowUpCircle className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{feature}</p>
            <p className="text-xs text-muted-foreground">{upgradeText[language]}</p>
          </div>
          <Badge className={getPlanColor(requiredPlan.name)}>{requiredPlan.label}</Badge>
        </button>
        <ContactUpgradeDialog open={showContact} onOpenChange={setShowContact} feature={feature} currentPlan={currentPlan} requiredPlan={requiredPlan} />
      </>
    );
  }

  return (
    <>
      <Card className={`border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 cursor-pointer hover:shadow-md transition-shadow ${className}`} onClick={() => setShowContact(true)}>
        <CardContent className="p-4 sm:p-6 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{language === 'fr' ? 'Fonctionnalité réservée' : 'Feature restricted'}</h3>
            <p className="text-sm text-muted-foreground mt-1">{feature}</p>
          </div>
          <div className="p-3 rounded-lg bg-background border">
            <div className="flex items-center justify-center gap-2">
              <Badge className={`${getPlanColor(requiredPlan.name)} text-xs`}>{requiredPlan.label}</Badge>
              <span className="text-sm font-semibold">{formatPlanPrice(requiredPlan.price)}</span>
            </div>
          </div>
          <Button variant="outline" size="sm">
            {language === 'fr' ? 'Contacter pour changer de plan' : 'Contact to change plan'}
          </Button>
        </CardContent>
      </Card>
      <ContactUpgradeDialog open={showContact} onOpenChange={setShowContact} feature={feature} currentPlan={currentPlan} requiredPlan={requiredPlan} />
    </>
  );
}

export function LimitReachedBanner({ current, max, label, requiredPlan }: { current: number; max: number; label: string; requiredPlan: Plan | null }) {
  const { language } = useLanguage();
  const [showContact, setShowContact] = useState(false);

  if (current < max || !requiredPlan) return null;

  return (
    <>
      <button onClick={() => setShowContact(true)} className="w-full flex items-center gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors cursor-pointer text-left">
        <Lock className="h-5 w-5 text-destructive shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {language === 'fr' ? `Limite atteinte : ${current}/${max} ${label}` : `Limit reached: ${current}/${max} ${label}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {language === 'fr' ? `Passez au plan ${requiredPlan.label} pour augmenter la limite` : `Upgrade to ${requiredPlan.labelEn} to increase the limit`}
          </p>
        </div>
        <Badge className={getPlanColor(requiredPlan.name)}>{requiredPlan.label}</Badge>
      </button>
      <ContactUpgradeDialog open={showContact} onOpenChange={setShowContact} feature={label} currentPlan="" requiredPlan={requiredPlan} />
    </>
  );
}
