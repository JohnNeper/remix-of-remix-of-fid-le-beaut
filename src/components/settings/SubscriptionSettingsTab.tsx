import React from 'react';
import { Crown, Check, Sparkles, Zap, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PLANS, PlanType, formatPlanPrice, getPlanColor } from '@/lib/plans';
import { cn } from '@/lib/utils';
import type { Salon } from '@/types';

interface SubscriptionSettingsTabProps {
  salon: Salon;
  currentPlanKey: PlanType;
  language: string;
  t: (key: string) => string;
  onUpgrade: (plan: PlanType) => void;
  onOpenComparison: () => void;
}

export function SubscriptionSettingsTab({
  salon,
  currentPlanKey,
  language,
  t,
  onUpgrade,
  onOpenComparison
}: SubscriptionSettingsTabProps) {
  const currentPlan = PLANS[currentPlanKey] || PLANS.basic;

  const planOrder: PlanType[] = ['basic', 'pro', 'premium'];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Current Active Plan Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-accent/10 p-6 lg:p-8 card-shadow shadow-md">
        <div className="absolute -top-16 -right-16 h-48 w-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge className={cn("px-3.5 py-1 text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs", getPlanColor(currentPlanKey))}>
                <Crown className="h-3.5 w-3.5 mr-1 inline" />
                {t('settings.planCurrent') || 'FORFAIT ACTUEL'}
              </Badge>
              <span className="text-xs font-semibold text-muted-foreground">
                {formatPlanPrice(currentPlan.price)}
              </span>
            </div>

            <h2 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
              {currentPlan.label}
            </h2>
            <p className="text-sm font-medium text-muted-foreground max-w-lg">
              {language === 'fr' ? currentPlan.description : currentPlan.descriptionEn}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              onClick={onOpenComparison}
              variant="outline"
              className="rounded-2xl h-11 px-5 font-bold border-border/80 gap-2 hover:bg-primary/5 hover:text-primary transition-all w-full md:w-auto"
            >
              <HelpCircle className="h-4 w-4" />
              {language === 'fr' ? 'Comparer les formules' : 'Compare plans'}
            </Button>
          </div>
        </div>

        {/* Enabled Features pills */}
        <div className="mt-6 pt-4 border-t border-border/30 flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-lg text-xs py-1 px-3 bg-muted/80">🕒 Disponibilité & Horaires</Badge>
          {currentPlan.automationEnabled && <Badge variant="secondary" className="rounded-lg text-xs py-1 px-3 bg-muted/80">🤖 Automatisations SMS/WA</Badge>}
          {currentPlan.exportEnabled && <Badge variant="secondary" className="rounded-lg text-xs py-1 px-3 bg-muted/80">📊 Export Excel/PDF</Badge>}
          {currentPlan.multiBranchEnabled && <Badge variant="secondary" className="rounded-lg text-xs py-1 px-3 bg-muted/80">🏢 Multi-établissements</Badge>}
          {currentPlan.loyaltyRulesEnabled && <Badge variant="secondary" className="rounded-lg text-xs py-1 px-3 bg-muted/80">⭐ Programme Fidélité</Badge>}
          {currentPlan.prioritySupport && <Badge variant="secondary" className="rounded-lg text-xs py-1 px-3 bg-muted/80">🎯 Support VIP Prioritaire</Badge>}
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold text-foreground">
            {language === 'fr' ? 'Choisissez la formule adaptée à vos besoins' : 'Choose the best plan for your business'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {language === 'fr' ? 'Sans engagement, modifiez ou annulez à tout moment via Mobile Money' : 'No lock-in, upgrade or cancel anytime'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {planOrder.map((key) => {
            const planItem = PLANS[key];
            const isCurrent = key === currentPlanKey;
            const isPro = key === 'pro';

            return (
              <Card
                key={key}
                className={cn(
                  "relative rounded-3xl border-2 transition-all duration-300 card-shadow flex flex-col justify-between overflow-hidden",
                  isCurrent ? "border-primary bg-primary/5 shadow-lg" : "border-border/60 bg-card hover:border-primary/40",
                  isPro && !isCurrent && "border-accent/40 shadow-md"
                )}
              >
                {isPro && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-extrabold uppercase px-4 py-1 rounded-bl-2xl shadow-sm">
                    {language === 'fr' ? 'Plus populaire' : 'Most popular'}
                  </div>
                )}

                <CardHeader className="p-6 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-extrabold">{planItem.label}</CardTitle>
                    {isCurrent && (
                      <Badge variant="outline" className="border-primary text-primary font-bold text-[10px]">
                        {language === 'fr' ? 'Actuel' : 'Active'}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs min-h-[32px]">
                    {language === 'fr' ? planItem.description : planItem.descriptionEn}
                  </CardDescription>

                  <div className="pt-2">
                    <span className="text-2xl lg:text-3xl font-extrabold text-foreground">
                      {planItem.price.toLocaleString('fr-FR')} FCFA
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground"> /mois</span>
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-0 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5 text-xs text-muted-foreground border-t border-border/40 pt-4">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>
                        Collaborateurs max: <strong className="text-foreground">{planItem.maxStaff === -1 ? 'Illimité' : planItem.maxStaff}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>
                        Clients max: <strong className="text-foreground">{planItem.maxCustomers === -1 ? 'Illimité' : planItem.maxCustomers}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>
                        Campagnes SMS/WA: <strong className="text-foreground">{planItem.maxCampaignsPerMonth === -1 ? 'Illimité' : planItem.maxCampaignsPerMonth === 0 ? 'Désactivé' : `${planItem.maxCampaignsPerMonth} /mois`}</strong>
                      </span>
                    </div>

                    {planItem.loyaltyRulesEnabled && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-foreground font-semibold">Programme de Fidélité</span>
                      </div>
                    )}

                    {planItem.exportEnabled && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-foreground font-semibold">Exportations PDF / Excel</span>
                      </div>
                    )}

                    {planItem.automationEnabled && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-foreground font-semibold">Relances automatiques</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    {isCurrent ? (
                      <Button disabled variant="outline" className="w-full rounded-2xl font-bold border-primary/40 text-primary">
                        <Check className="h-4 w-4 mr-2" />
                        {language === 'fr' ? 'Formule Actuelle' : 'Current Plan'}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => onUpgrade(key)}
                        className={cn(
                          "w-full rounded-2xl font-bold shadow-md gap-2",
                          isPro ? "gradient-primary" : "bg-foreground text-background hover:bg-foreground/90"
                        )}
                      >
                        <Zap className="h-4 w-4 fill-current" />
                        {language === 'fr' ? 'Choisir cette formule' : 'Select plan'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
