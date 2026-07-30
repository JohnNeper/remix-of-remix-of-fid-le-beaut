import React, { useState, useEffect, useRef } from 'react';
import { 
  Crown, 
  LogOut, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  ChevronLeft, 
  ArrowRight,
  MessageCircle,
  Building2,
  User,
  Clock,
  Lock,
  CreditCard,
  PhoneCall,
  Smartphone,
  Check,
  RefreshCw,
  Zap,
  HelpCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { BeautyFlowLogo } from '@/components/branding/BeautyFlowLogo';
import { api } from '@/lib/api';
import { PLANS, PlanType } from '@/lib/plans';

interface SubscriptionExpiredProps {
  email?: string;
  onSuccess?: () => void;
}

export default function SubscriptionExpired({ email, onSuccess }: SubscriptionExpiredProps) {
  const { logout, currentSalon, currentUser, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const { t } = useLanguage();

  // Multi-step Stepper State: 1 = Choice of Plan, 2 = Mobile Money Info, 3 = USSD Push & Validation
  const [step, setStep] = useState<number>(1);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro');
  
  // Step 2 inputs
  const queryEmail = searchParams.get('email');
  const locationEmail = (location.state as any)?.email;
  const initialEmail = email || locationEmail || queryEmail || currentUser?.email || session?.email || '';
  
  const [contactEmail, setContactEmail] = useState<string>(initialEmail);
  const [phone, setPhone] = useState<string>('');
  const [operator, setOperator] = useState<'orange' | 'mtn' | 'auto'>('auto');
  const [detectedOperator, setDetectedOperator] = useState<'orange' | 'mtn' | null>(null);
  
  // Step 3 Payment & Polling State
  const [isInitiating, setIsInitiating] = useState<boolean>(false);
  const [depositId, setDepositId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const [devSimulationUrl, setDevSimulationUrl] = useState<string | null>(null);
  const pollingTimerRef = useRef<any>(null);

  const salonName = currentSalon?.nom || (currentSalon as any)?.name || 'Votre Salon';

  // Auto-detect operator based on phone prefix or predict-provider API
  useEffect(() => {
    const cleanPhone = phone.replace(/\D/g, '');
    const localPhone = cleanPhone.startsWith('237') ? cleanPhone.slice(3) : cleanPhone;

    if (localPhone.length >= 2) {
      if (
        localPhone.startsWith('69') || 
        localPhone.startsWith('655') || 
        localPhone.startsWith('656') || 
        localPhone.startsWith('657') || 
        localPhone.startsWith('658') || 
        localPhone.startsWith('659')
      ) {
        setDetectedOperator('orange');
      } else if (
        localPhone.startsWith('67') || 
        localPhone.startsWith('68') || 
        localPhone.startsWith('650') || 
        localPhone.startsWith('651') || 
        localPhone.startsWith('652') || 
        localPhone.startsWith('653') || 
        localPhone.startsWith('654')
      ) {
        setDetectedOperator('mtn');
      } else {
        setDetectedOperator(null);
      }
    } else {
      setDetectedOperator(null);
    }
  }, [phone]);

  // Clean up polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleWhatsAppHelp = () => {
    const text = encodeURIComponent(
      `Bonjour l'équipe BeautyFlow, je souhaite de l'aide pour le renouvellement de l'abonnement de mon salon "${salonName}" (${contactEmail || 'salon'}).`
    );
    window.open(`https://wa.me/237658315610?text=${text}`, '_blank');
  };

  const handleInitiatePayment = async () => {
    if (!phone || phone.trim().length < 8) {
      toast({
        title: 'Numéro de téléphone requis',
        description: 'Veuillez saisir votre numéro Mobile Money (ex: 699999999 ou 670000000).',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsInitiating(true);
      const actualSalonId = currentSalon?.id || (currentSalon as any)?._id || currentUser?.salonId;
      const durationDays = billingCycle === 'annual' ? 365 : 30;
      const selectedOperator = operator === 'auto' ? (detectedOperator || 'mtn') : operator;

      const payload = {
        salonId: actualSalonId,
        email: contactEmail,
        plan: selectedPlan,
        phone: phone.trim(),
        operator: selectedOperator,
        dureeJours: durationDays,
      };

      const res: any = await api.initiateSubscriptionPayment(payload);

      const targetData = res?.data || res;
      const depositId = targetData?.depositId;
      const paymentLink = targetData?.paymentLink;

      if (depositId) {
        setDepositId(depositId);
        setPaymentStatus('PENDING');
        if (paymentLink) {
          setDevSimulationUrl(paymentLink);
        }
        setStep(3);

        toast({
          title: '🚀 Demande USSD transmise',
          description: 'Saisissez votre code PIN Mobile Money sur votre téléphone pour valider.',
        });

        // Start polling payment status every 3 seconds
        startPollingStatus(depositId);
      } else {
        throw new Error(res?.message || 'Erreur lors de l\'initiation du paiement.');
      }
    } catch (err: any) {
      console.error("Erreur initiation paiement PawaPay:", err);
      toast({
        title: '❌ Échec initiation paiement',
        description: err.message || 'Impossible de se connecter à PawaPay. Veuillez réinstaller ou contacter le support BeautyFlow.',
        variant: 'destructive',
      });
    } finally {
      setIsInitiating(false);
    }
  };

  const startPollingStatus = (id: string) => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);

    pollingTimerRef.current = setInterval(async () => {
      try {
        const res = await api.getPaymentStatus(id);
        const status = ((res?.status || res?.data?.status) || '').toLowerCase();
        if (status) {
          if (status === 'completed' || status === 'success') {
            clearInterval(pollingTimerRef.current);
            setPaymentStatus('SUCCESS');
            toast({
              title: '🎉 Abonnement réactivé !',
              description: 'Votre paiement a été validé avec succès. Bienvenue à nouveau sur BeautyFlow !',
            });
            setTimeout(() => {
              if (onSuccess) {
                onSuccess();
              } else {
                window.location.href = '/';
              }
            }, 1500);
          } else if (status === 'failed' || status === 'cancelled' || status === 'rejected') {
            clearInterval(pollingTimerRef.current);
            setPaymentStatus('FAILED');
            const rawReason = (res?.message || res?.failureReason || res?.data?.message || res?.data?.failureReason || '') + '';
            let msg = 'La transaction Mobile Money a été annulée ou n\'a pas pu être validée.';
            if (rawReason.toLowerCase().includes('solde') || rawReason.toLowerCase().includes('insufficient') || rawReason.toLowerCase().includes('not_enough')) {
              msg = 'Solde insuffisant dans votre compte Mobile Money. Veuillez recharger votre compte et réessayer.';
            } else if (rawReason) {
              msg = rawReason;
            }
            setFailureMessage(msg);
            toast({
              title: '❌ Paiement non validé',
              description: msg,
              variant: 'destructive',
              duration: 8000,
            });
          }
        }
      } catch (pollErr) {
        console.warn("Polling payment status warning:", pollErr);
      }
    }, 3000);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-3 sm:p-6 transition-colors duration-300 font-sans selection:bg-rose-500 selection:text-white">
      
      {/* Top Header */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <BeautyFlowLogo className="h-9 w-9" />
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
              Beauty<span className="text-rose-500">Flow</span>
            </span>
            <span className="text-[10px] font-bold uppercase text-rose-500 tracking-wider">Business Pro</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </div>

      {/* Main Stepper Card */}
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950 text-white p-5 sm:p-7 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>{t('sub.title') || "Renouvellement d'Abonnement BeautyFlow"}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                {salonName}
              </h1>

              <p className="text-xs text-slate-300 max-w-lg font-light leading-relaxed">
                {t('sub.subtitle') || "Choisissez votre forfait et validez par Mobile Money pour réactiver votre salon instantanément."}
              </p>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="flex items-center gap-2 bg-white/10 dark:bg-slate-800/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 shrink-0">
              <div className={`flex items-center gap-1 text-xs font-bold ${step === 1 ? 'text-rose-400' : 'text-slate-300'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 1 ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-300'}`}>1</span>
                <span className="hidden sm:inline">{t('sub.step1') || "Plan"}</span>
              </div>

              <div className="w-4 h-0.5 bg-slate-700 rounded-full" />

              <div className={`flex items-center gap-1 text-xs font-bold ${step === 2 ? 'text-rose-400' : 'text-slate-300'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 2 ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-300'}`}>2</span>
                <span className="hidden sm:inline">{t('sub.step2') || "Paiement"}</span>
              </div>

              <div className="w-4 h-0.5 bg-slate-700 rounded-full" />

              <div className={`flex items-center gap-1 text-xs font-bold ${step === 3 ? 'text-rose-400' : 'text-slate-300'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 3 ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-300'}`}>3</span>
                <span className="hidden sm:inline">{t('sub.step3') || "Validation"}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Content Stepper Views */}
        <div className="p-5 sm:p-8 space-y-6">
          
          {/* ========================================================================= */}
          {/* STEP 1: CHOICE OF PLAN (BASIC, PRO, PREMIUM) */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Billing Cycle Toggle (Monthly vs Annual -20%) */}
              <div className="flex items-center justify-between flex-wrap gap-3 p-2 bg-slate-100 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 pl-2">
                  {t('sub.billingDuration') || "Durée de l'abonnement :"}
                </span>

                <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {t('sub.monthly') || "Mensuel"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      billingCycle === 'annual'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{t('sub.annual') || "Annuel (-20%)"}</span>
                    <span className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full">Pro</span>
                  </button>
                </div>
              </div>

              {/* 3 Plans Grid (Basic, Pro, Premium) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. BASIC PLAN */}
                <div
                  onClick={() => setSelectedPlan('basic')}
                  className={`cursor-pointer p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between relative ${
                    selectedPlan === 'basic'
                      ? 'border-rose-500 bg-rose-500/5 dark:bg-rose-500/10 shadow-lg ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Basic</span>
                      {selectedPlan === 'basic' && <CheckCircle2 className="h-5 w-5 text-rose-500" />}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {PLANS.basic.description}
                    </p>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {billingCycle === 'annual' ? '4 000 FCFA' : '5 000 FCFA'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium"> {t('sub.monthShort') || "/mois"}</span>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 font-medium">
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>Jusqu'à 2 employés</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>Max 300 clientes</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>Gestion Caisse & RDV</span>
                      </li>
                    </ul>
                  </div>

                  <Button
                    type="button"
                    variant={selectedPlan === 'basic' ? 'default' : 'outline'}
                    className="w-full mt-5 text-xs font-bold h-9 rounded-xl"
                  >
                    {selectedPlan === 'basic' ? (t('sub.selected') || 'Sélectionné') : `${t('sub.choose') || 'Choisir'} Basic`}
                  </Button>
                </div>

                {/* 2. PRO PLAN (Recommended Badge) */}
                <div
                  onClick={() => setSelectedPlan('pro')}
                  className={`cursor-pointer p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                    selectedPlan === 'pro'
                      ? 'border-rose-500 bg-rose-500/5 dark:bg-rose-500/10 shadow-xl ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50'
                  }`}
                >
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-rose-600 to-amber-500 text-white text-[9px] font-extrabold uppercase px-3 py-1 rounded-bl-xl shadow-sm">
                    {t('sub.recommended') || "Recommandé"}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Crown className="h-4 w-4 text-amber-500" />
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Pro</span>
                      </div>
                      {selectedPlan === 'pro' && <CheckCircle2 className="h-5 w-5 text-rose-500" />}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {PLANS.pro.description}
                    </p>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                        {billingCycle === 'annual' ? '16 000 FCFA' : '20 000 FCFA'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium"> {t('sub.monthShort') || "/mois"}</span>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 font-medium">
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>Jusqu'à 6 employés</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>Clientes & RDV illimités</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>5 Campagnes SMS / mois</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>Module Fidélité & Bilan Boss</span>
                      </li>
                    </ul>
                  </div>

                  <Button
                    type="button"
                    className={`w-full mt-5 text-xs font-bold h-9 rounded-xl ${
                      selectedPlan === 'pro'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {selectedPlan === 'pro' ? (t('sub.selected') || 'Sélectionné') : `${t('sub.choose') || 'Choisir'} Pro`}
                  </Button>
                </div>

                {/* 3. PREMIUM PLAN */}
                <div
                  onClick={() => setSelectedPlan('premium')}
                  className={`cursor-pointer p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between relative ${
                    selectedPlan === 'premium'
                      ? 'border-rose-500 bg-rose-500/5 dark:bg-rose-500/10 shadow-lg ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-purple-500" />
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Premium</span>
                      </div>
                      {selectedPlan === 'premium' && <CheckCircle2 className="h-5 w-5 text-rose-500" />}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {PLANS.premium.description}
                    </p>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {billingCycle === 'annual' ? '24 000 FCFA' : '30 000 FCFA'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium"> {t('sub.monthShort') || "/mois"}</span>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 font-medium">
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>Employés illimités</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>SMS & Automatisations illimités</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>Multi-succursales & Exports</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>Support VIP Prioritaire 24/7</span>
                      </li>
                    </ul>
                  </div>

                  <Button
                    type="button"
                    variant={selectedPlan === 'premium' ? 'default' : 'outline'}
                    className="w-full mt-5 text-xs font-bold h-9 rounded-xl"
                  >
                    {selectedPlan === 'premium' ? (t('sub.selected') || 'Sélectionné') : `${t('sub.choose') || 'Choisir'} Premium`}
                  </Button>
                </div>

              </div>

              {/* Next Step Button */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{t('sub.logout') || "Se déconnecter"}</span>
                </button>

                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  className="h-11 px-6 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-500/20 flex items-center gap-2"
                >
                  <span>{t('sub.continueToPayment') || "Continuer vers le Paiement"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: MOBILE MONEY INFORMATION & PHONE NUMBER */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="p-4 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="text-xs font-extrabold uppercase text-rose-600 dark:text-rose-400">
                    {t('sub.chosenPlan') || "Plan Choisi :"} {selectedPlan.toUpperCase()} ({billingCycle === 'annual' ? (t('sub.annualDays') || 'Annuel 365j') : (t('sub.monthlyDays') || 'Mensuel 30j')})
                  </h4>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {t('sub.totalAmount') || "Montant total :"} {
                      selectedPlan === 'basic' ? (billingCycle === 'annual' ? '48 000 FCFA' : '5 000 FCFA') :
                      selectedPlan === 'pro' ? (billingCycle === 'annual' ? '192 000 FCFA' : '20 000 FCFA') :
                      (billingCycle === 'annual' ? '288 000 FCFA' : '30 000 FCFA')
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  {t('sub.changePlan') || "Changer de plan"}
                </button>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                
                {/* Email Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('sub.emailLabel') || "Email du Salon / Compte"}
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="salon@beautyflow.com"
                    required
                    className="h-11 text-xs bg-slate-50 dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 rounded-xl"
                  />
                </div>

                {/* Phone Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="phone" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t('sub.phoneLabel') || "Numéro Téléphone Mobile Money (Cameroon)"}
                    </Label>
                    {detectedOperator && (
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <Zap className="h-3 w-3 fill-rose-500 text-rose-500" />
                        <span>{t('sub.operatorAuto') || "Opérateur détecté :"} {detectedOperator.toUpperCase()}</span>
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder={t('sub.phonePlaceholder') || "ex: 699999999 ou 670000000"}
                      required
                      className="h-11 pl-10 text-sm font-bold tracking-wide bg-slate-50 dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                </div>

                {/* Operator Selector */}
                <div className="space-y-2 pt-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('sub.operatorLabel') || "Sélection de l'Opérateur Mobile Money :"}
                  </Label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setOperator('orange')}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        operator === 'orange' || (operator === 'auto' && detectedOperator === 'orange')
                          ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 font-bold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-xs">Orange Money</span>
                      </div>
                      {(operator === 'orange' || (operator === 'auto' && detectedOperator === 'orange')) && (
                        <Check className="h-4 w-4 text-amber-500" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setOperator('mtn')}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        operator === 'mtn' || (operator === 'auto' && detectedOperator === 'mtn')
                          ? 'border-yellow-500 bg-yellow-500/10 text-yellow-900 dark:text-yellow-200 font-bold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 shrink-0" />
                        <span className="text-xs">MTN MoMo</span>
                      </div>
                      {(operator === 'mtn' || (operator === 'auto' && detectedOperator === 'mtn')) && (
                        <Check className="h-4 w-4 text-yellow-500" />
                      )}
                    </button>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="h-11 px-4 text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>{t('sub.backToPlans') || "Retour aux plans"}</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={isInitiating}
                  className="h-11 px-6 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-500/20 flex items-center gap-2"
                >
                  {isInitiating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t('sub.initiatingPayment') || "Initiation du paiement..."}</span>
                    </div>
                  ) : (
                    <>
                      <Smartphone className="h-4 w-4" />
                      <span>{t('sub.payWithMobileMoney') || "Payer par Mobile Money"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: USSD PUSH & REAL-TIME VALIDATION POLLING */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="space-y-6 text-center py-4 animate-in fade-in duration-300">
              
              {paymentStatus === 'PENDING' && (
                <div className="space-y-5 max-w-md mx-auto">
                  
                  {/* Pulse Phone Icon Animation */}
                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-ping pointer-events-none" />
                    <div className="w-16 h-16 bg-rose-600 text-white rounded-2xl shadow-xl flex items-center justify-center relative z-10">
                      <Smartphone className="h-8 w-8 animate-bounce-slow" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {t('sub.ussdTitle') || "Validation sur votre téléphone"}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {(t('sub.ussdMessage') || "Un message USSD Push a été envoyé sur le numéro {phone}. Saisissez votre code secret PIN Mobile Money pour valider.").replace('{phone}', phone)}
                    </p>
                  </div>

                  {/* Polling Spinner Box */}
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <RefreshCw className="h-4 w-4 animate-spin text-rose-500" />
                    <span>{t('sub.pollingStatus') || "Vérification automatique du statut de paiement..."}</span>
                  </div>

                  {/* Dev Simulation Fallback Button */}
                  {devSimulationUrl && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                      <p className="text-[11px] font-semibold">{t('sub.devModeDetected') || "Mode Développeur / Simulation détecté :"}</p>
                      <Button
                        type="button"
                        onClick={() => window.open(devSimulationUrl, '_blank')}
                        className="w-full h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                      >
                        {t('sub.simulateDev') || "Simuler la validation du paiement (Dev)"}
                      </Button>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white underline"
                    >
                      {t('sub.modifyPhoneOrRetry') || "Modifier le numéro de téléphone ou réessayer"}
                    </button>
                  </div>

                </div>
              )}

              {/* SUCCESS STATE */}
              {paymentStatus === 'SUCCESS' && (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-full mx-auto flex items-center justify-center shadow-xl animate-in zoom-in duration-300">
                    <Check className="h-8 w-8 stroke-[3]" />
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {t('sub.successTitle') || "Paiement Validé & Abonnement Réactivé !"}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {t('sub.successDesc') || "Merci d'avoir renouvelé votre forfait BeautyFlow. Redirection vers votre tableau de bord..."}
                  </p>
                </div>
              )}

              {/* FAILED STATE */}
              {paymentStatus === 'FAILED' && (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-rose-500 text-white rounded-full mx-auto flex items-center justify-center shadow-xl">
                    <Lock className="h-8 w-8" />
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {t('sub.failedTitle') || "Le paiement n'a pas pu être validé"}
                  </h3>

                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold leading-relaxed">
                    {failureMessage || t('sub.failedDefaultDesc') || "La transaction Mobile Money a été annulée ou n'a pas été confirmée dans le délai imparti."}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      type="button"
                      onClick={() => {
                        setPaymentStatus('IDLE');
                        setFailureMessage(null);
                        setStep(2);
                      }}
                      className="flex-1 h-10 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                    >
                      {t('sub.retryPayment') || "Réessayer le paiement"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleWhatsAppHelp}
                      className="flex-1 h-10 text-xs font-bold border-slate-300 rounded-xl"
                    >
                      {t('sub.contactSupport') || "Support BeautyFlow WhatsApp"}
                    </Button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* WhatsApp Support & Help Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={handleWhatsAppHelp}
              className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <MessageCircle className="h-4 w-4 text-emerald-500" />
              <span>{t('sub.contactSupport') || "Besoin d'aide ? WhatsApp Support BeautyFlow"}</span>
            </button>

            <div className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-rose-500" />
              <span>{t('sub.securedPayment') || "Paiement Sécurisé PawaPay V2 (Orange / MTN)"}</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
