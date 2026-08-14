import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, Crown, Shield } from 'lucide-react';
import { PLANS, PlanType, getPlanColor, formatPlanPrice } from '@/lib/plans';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export interface PlanComparisonDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  currentPlan: PlanType;
  onSelectPlan?: (plan: PlanType) => void;
  onUpgrade?: (plan: PlanType) => void;
}

const FEATURE_LIST = [
  { name: 'settings.availability', basic: true, pro: true, premium: true },
  { name: 'settings.features.crm', basic: '300', pro: 'Illimité', premium: 'Illimité' },
  { name: 'settings.staffMembers', basic: '2', pro: '6', premium: 'Illimité' },
  { name: 'nav.campaigns', basic: '-', pro: '5/mois', premium: 'Illimité' },
  { name: 'settings.features.loyalty', basic: false, pro: true, premium: true },
  { name: 'settings.features.automation', basic: false, pro: false, premium: true },
  { name: 'settings.features.multi', basic: false, pro: false, premium: true },
  { name: 'settings.features.support', basic: 'Email', pro: 'Prioritaire', premium: 'Dédié 24/7' },
];

export function PlanComparisonDialog({ open, onOpenChange, currentPlan, onSelectPlan, onUpgrade }: PlanComparisonDialogProps) {
  const { t } = useLanguage();
  const plansArray = Object.values(PLANS);
  const handleUpgrade = onSelectPlan || onUpgrade;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gradient-primary h-12 px-10 text-lg rounded-full">
          {t('settings.explorePlans')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center mb-6">
          <DialogTitle className="text-3xl font-bold">{t('settings.choosePerfectPlan')}</DialogTitle>
          <DialogDescription className="text-lg">
            {t('settings.planUnlock')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plansArray.map((plan) => {
            const isCurrent = currentPlan === plan.name;
            const isPremium = plan.name === 'premium';
            
            return (
              <div
                key={plan.name}
                className={cn(
                  "relative flex flex-col p-6 rounded-2xl border-2 transition-all hover:shadow-lg",
                  isCurrent ? "border-primary bg-primary/5 shadow-md" : "border-border bg-background",
                  isPremium && !isCurrent && "border-accent/30 bg-accent/5"
                )}
              >
                {isCurrent && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    {t('settings.planCurrent')}
                  </Badge>
                )}
                
                <div className="mb-4">
                  <h3 className="font-bold text-xl">{plan.label}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-black">{formatPlanPrice(plan.price).split(' ')[0]}</span>
                    <span className="text-xs text-muted-foreground">FCFA/{t('common.month')}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-3 mb-6">
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    {plan.description}
                  </p>
                  
                  <div className="pt-2">
                    <Button
                      variant={isCurrent ? "outline" : "default"}
                      className={cn("w-full h-11 rounded-xl font-bold", !isCurrent && "gradient-primary")}
                      disabled={isCurrent}
                      onClick={() => {
                        console.log("Plan choisi dans le dialog:", plan.name);
                        handleUpgrade?.(plan.name);
                      }}
                    >
                      {isCurrent ? t('settings.planCurrent') : t('common.select')}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-4 text-left font-bold">{t('settings.includedFeatures')}</th>
                <th className="p-4 text-center">Basic</th>
                <th className="p-4 text-center text-primary">Pro</th>
                <th className="p-4 text-center text-accent">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {FEATURE_LIST.map((feature) => (
                <tr key={feature.name} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-medium">{t(feature.name)}</td>
                  <td className="p-4 text-center font-medium opacity-70">{renderFeatureValue(feature.basic)}</td>
                  <td className="p-4 text-center text-primary font-bold">{renderFeatureValue(feature.pro)}</td>
                  <td className="p-4 text-center text-accent font-bold">{renderFeatureValue(feature.premium)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>


        <div className="mt-8 p-6 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col md:flex-row items-center gap-6">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
            <Shield className="h-6 w-6" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="font-bold">{t('settings.guarantee')}</h4>
            <p className="text-sm text-muted-foreground">{t('settings.guaranteeDesc')}</p>
          </div>
          <Button variant="outline" className="shrink-0" onClick={() => window.open('https://beautyflow.com/contact', '_blank')}>
            {t('settings.needHelp')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function renderFeatureValue(value: any) {
  if (value === true) return <Check className="h-4 w-4 text-emerald-500 mx-auto" />;
  if (value === false) return <span className="text-muted-foreground">-</span>;
  return <span>{value}</span>;
}
