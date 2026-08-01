import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Sparkles, MessageSquare, CreditCard, ArrowRight, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Plan, PLANS, PlanType, formatPlanPrice, getPlanColor } from '@/lib/plans';
import { PawaPayCheckout } from '@/components/payment/PawaPayCheckout';

interface ContactUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  currentPlan?: string;
  requiredPlan?: Plan | null;
}

export function ContactUpgradeDialog({
  open,
  onOpenChange,
  feature,
  currentPlan: propCurrentPlan,
  requiredPlan
}: ContactUpgradeDialogProps) {
  const { language } = useLanguage();
  const { currentSalon, currentUser, session } = useAuth();
  const [selectedPlanKey, setSelectedPlanKey] = useState<PlanType>(
    (requiredPlan?.name as PlanType) || 'pro'
  );
  const [mode, setMode] = useState<'choose' | 'payment'>('choose');

  const targetPlan = PLANS[selectedPlanKey] || requiredPlan || PLANS.pro;

  const salonId = currentSalon?.id || (currentSalon as any)?._id || '';
  const salonName = currentSalon?.nom || (currentSalon as any)?.name || 'Votre Salon';
  const email = currentUser?.email || session?.email || '';

  const whatsappMessage = encodeURIComponent(
    `Bonjour l'équipe BeautyFlow,\nJe souhaite faire évoluer mon salon (${salonName}) vers la formule ${targetPlan.label}.\nMerci !`
  );

  const handleStartPayment = (planKey: PlanType) => {
    setSelectedPlanKey(planKey);
    setMode('payment');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] sm:w-full rounded-3xl p-0 overflow-hidden border border-border bg-card shadow-2xl">
        {mode === 'choose' ? (
          <div className="p-6 space-y-6">
            <DialogHeader className="space-y-1 text-left">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <Crown className="h-4 w-4 text-amber-500" />
                <span>{language === 'fr' ? 'Formules & Abonnement Pro' : 'Pro Subscription Plans'}</span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                {feature ? (
                  <span>{language === 'fr' ? `Débloquer : ${feature}` : `Unlock: ${feature}`}</span>
                ) : (
                  <span>{language === 'fr' ? 'Passez à la vitesse supérieure' : 'Upgrade your salon'}</span>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {language === 'fr'
                  ? 'Choisissez votre formule et validez directement par Mobile Money ou WhatsApp.'
                  : 'Choose your plan and pay instantly via Mobile Money or WhatsApp.'}
              </DialogDescription>
            </DialogHeader>

            {/* Plans Selection Cards */}
            <div className="space-y-3">
              {(['pro', 'premium'] as PlanType[]).map((key) => {
                const plan = PLANS[key];
                const isSelected = selectedPlanKey === key;

                return (
                  <div
                    key={key}
                    onClick={() => setSelectedPlanKey(key)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500/5 shadow-sm'
                        : 'border-border/60 hover:border-rose-500/40 bg-card'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getPlanColor(key)} text-xs font-bold`}>{plan.label}</Badge>
                        {key === 'pro' && (
                          <span className="text-[10px] font-bold text-amber-500 uppercase bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            Recommandé
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        {language === 'fr' ? plan.description : plan.descriptionEn}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-base font-extrabold text-foreground">{formatPlanPrice(plan.price)}</p>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartPayment(key);
                        }}
                        className="mt-1 h-8 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
                      >
                        <span>{language === 'fr' ? 'Choisir' : 'Select'}</span>
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Direct Actions */}
            <div className="space-y-2.5 pt-2 border-t border-border/40">
              <Button
                onClick={() => setMode('payment')}
                className="w-full h-12 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 transition-all"
              >
                <CreditCard className="h-4 w-4" />
                <span>{language === 'fr' ? `Payer ${targetPlan.label} par Mobile Money` : `Pay ${targetPlan.label} via Mobile Money`}</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => window.open(`https://wa.me/237658315610?text=${whatsappMessage}`, '_blank')}
                className="w-full h-11 text-xs font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-2xl flex items-center justify-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>{language === 'fr' ? 'Assistance WhatsApp BeautyFlow' : 'WhatsApp BeautyFlow Support'}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <button
                type="button"
                onClick={() => setMode('choose')}
                className="text-xs font-semibold text-rose-500 hover:underline flex items-center gap-1"
              >
                ← {language === 'fr' ? 'Changer de formule' : 'Change plan'}
              </button>
              <Badge className={`${getPlanColor(selectedPlanKey)} text-xs font-bold`}>
                {targetPlan.label}
              </Badge>
            </div>

            <PawaPayCheckout
              salonId={salonId}
              email={email}
              plan={selectedPlanKey}
              amount={parseInt(targetPlan.price.toString().replace(/\s/g, '')) || 15000}
              onPaymentComplete={() => {
                onOpenChange(false);
                window.location.reload();
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
