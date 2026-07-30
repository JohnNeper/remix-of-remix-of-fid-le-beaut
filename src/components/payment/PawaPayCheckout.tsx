import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Provider {
  provider: string;
  displayName: string;
  logo: string;
  nameDisplayedToCustomer?: string;
  currencies: {
    currency: string;
    operationTypes: {
      DEPOSIT: {
        authType: string;
        pinPrompt: string;
        pinPromptRevivable: boolean;
      };
    };
  }[];
}

interface CountryConfig {
  country: string;
  prefix: string;
  flag: string;
  providers: Provider[];
}

export const PawaPayCheckout = ({ salonId, email, plan = 'basic', amount = 5, onPaymentComplete }: { salonId?: string, email?: string, plan?: string, amount?: number, onPaymentComplete?: () => void }) => {
  const [config, setConfig] = useState<CountryConfig | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [predictedProvider, setPredictedProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [depositData, setDepositData] = useState<any>(null);
  const [error, setError] = useState('');
  const [displayAmount, setDisplayAmount] = useState(amount);

  // Fetch plan prices dynamically from backend if subscription payment
  useEffect(() => {
    if (plan && ['basic', 'pro', 'premium', 'elite'].includes(plan)) {
      const fetchPlanPrice = async () => {
        try {
          const plans = await api.getPlans();
          if (plans) {
            const planKey = plan === 'elite' ? 'premium' : plan; // elite plans map to premium keys in backend
            const matchedPlan = plans.find((p: any) => p.key === planKey);
            if (matchedPlan) {
              const basePrice = matchedPlan.price;
              const mmoFee = Math.ceil(basePrice * 0.01);
              const additionalFee = Math.ceil(basePrice * 0.02);
              setDisplayAmount(basePrice + mmoFee + additionalFee);
            }
          }
        } catch (err) {
          console.error("Error loading plan price from backend:", err);
          setDisplayAmount(amount);
        }
      };
      fetchPlanPrice();
    } else {
      setDisplayAmount(amount);
    }
  }, [plan, amount]);

  // 1. Fetch active config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await api.getActiveConfig('CMR');
        if (data && data.countries?.length > 0) {
          setConfig(data.countries[0]);
        }
      } catch (err) {
        setError('Erreur lors du chargement des moyens de paiement.');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // 2. Predict provider when phone number is long enough
  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhoneNumber(val);

    // Simple check to avoid calling API too often
    if (val.replace(/\D/g, '').length >= 9) {
      try {
        // Send without prefix for user input, or with prefix, backend handles it
        const data = await api.predictProvider((config?.prefix || '') + val);
        if (data && data.provider) {
          setPredictedProvider(data.provider);
        }
      } catch (err) {
        console.error("Prediction error", err);
      }
    } else {
      setPredictedProvider(null);
    }
  };

  // 3. Initiate Deposit
  const handlePayment = async () => {
    setProcessing(true);
    setError('');
    try {
      const fullPhone = (config?.prefix || '') + phoneNumber;
      const payload = {
        email,
        phone: fullPhone,
        plan,
        operator: (predictedProvider === 'ORANGE_CMR' ? 'orange' : 'mtn') as 'orange' | 'mtn'
      };

      let result;
      if (salonId) {
        result = await api.subscribe(salonId, payload);
      } else if (email) {
        result = await api.subscribeByEmail(payload);
      } else {
        setError("Impossible d'identifier l'utilisateur (salonId ou email manquant).");
        setProcessing(false);
        return;
      }

      if (result) {
        setDepositData(result);
        pollPaymentStatus(result.depositId);
      } else {
        setError("Erreur d'initiation du paiement.");
      }
    } catch (err: any) {
      setError(err?.message || "Erreur réseau lors du paiement.");
    } finally {
      setProcessing(false);
    }
  };

  // 4. Poll for payment status
  const pollPaymentStatus = (depositId: string) => {
    const interval = setInterval(async () => {
      try {
        const data = await api.getPaymentStatus(depositId);
        if (data && data.success) {
          if (data.status === 'COMPLETED' || data.status === 'SUCCESS' || data.status === 'SUCCESSFUL') {
            clearInterval(interval);
            if (onPaymentComplete) onPaymentComplete();
          } else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
            clearInterval(interval);
            setError("Le paiement a échoué ou a été annulé.");
            setDepositData(null);
          }
        }
      } catch (err) {
        // keep polling
      }
    }, 3000);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  // 5. Waiting for Authorization Screen
  if (depositData) {
    const providerInfo: Provider | undefined = depositData.providerInfo;
    const nameDisplayed = providerInfo?.nameDisplayedToCustomer || providerInfo?.displayName || 'votre opérateur';

    return (
      <Card className="w-full max-w-md mx-auto shadow-lg border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary">En attente d'autorisation</CardTitle>
          <CardDescription>Veuillez valider le paiement sur votre téléphone.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <Loader2 className="animate-spin text-primary w-16 h-16" />
          <div className="text-center space-y-2">
            <p className="text-lg">Un prompt a été envoyé au <strong>+{config?.prefix}{phoneNumber}</strong>.</p>
            <p className="text-muted-foreground">Approuvez le paiement pour <strong>{nameDisplayed}</strong>.</p>
          </div>

          {providerInfo?.currencies?.[0]?.operationTypes?.DEPOSIT?.pinPromptRevivable && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg text-sm text-center font-medium">
              <p>Vous n'avez pas reçu le prompt ? Composez le code USSD de votre opérateur pour valider manuellement.</p>
            </div>
          )}

          {depositData.paymentLink && (
            <Button variant="outline" className="mt-4 w-full" onClick={() => window.open(depositData.paymentLink, '_blank')}>
              (Mode Dev) Simuler le succès
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Initial Payment Form
  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-primary/20">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">Payer par Mobile Money</CardTitle>
        <CardDescription>Montant à payer : {displayAmount} FCFA</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <div className="p-3 bg-red-100/50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">{error}</div>}

        {/* Available Providers Display */}
        {config?.providers && (
          <div className="flex justify-center gap-4 mb-4">
            {config.providers.map(p => (
              <div key={p.provider} className="flex flex-col items-center gap-2">
                <img
                  src={p.logo}
                  alt={p.displayName}
                  className={`h-14 w-auto object-contain rounded-xl border-2 p-1 transition-all duration-300 ${predictedProvider === p.provider ? 'border-primary shadow-md scale-110' : 'border-transparent opacity-50 grayscale'}`}
                />
                <span className="text-xs font-medium text-muted-foreground">{p.displayName}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Numéro de téléphone</label>
          <div className="flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-4 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground font-medium">
              <img src={config?.flag} alt="flag" className="w-5 h-5 mr-2 rounded-sm" />
              +{config?.prefix}
            </span>
            <Input
              type="tel"
              className="rounded-l-none focus-visible:ring-1 h-12 text-lg"
              placeholder="6xxxxxxxx"
              value={phoneNumber}
              onChange={handlePhoneChange}
            />
          </div>
          {predictedProvider && config && (
            <p className="text-sm text-green-600 font-medium animate-in fade-in slide-in-from-top-1">
              ✓ Opérateur détecté: {config.providers.find(p => p.provider === predictedProvider)?.displayName}
            </p>
          )}
        </div>

        <Button
          className="w-full h-12 text-lg font-semibold"
          onClick={handlePayment}
          disabled={processing || !phoneNumber || phoneNumber.length < 9}
        >
          {processing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
          {processing ? 'Initiation en cours...' : 'Payer maintenant'}
        </Button>
      </CardContent>
    </Card>
  );
};
